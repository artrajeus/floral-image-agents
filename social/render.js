'use strict';

/**
 * Turn a cleared library photograph into the exact file that gets posted.
 *
 * Two things this enforces structurally rather than by asking nicely:
 *
 * 1. **You cannot render from an image that is not in the library manifest.**
 *    The seasonal range, the uncleared Drive folders and anything else outside
 *    `social/library/` simply have no path through this tool. A rule written in
 *    a document gets forgotten; a rule that has no code path does not.
 *
 * 2. **The crop is returned, so it can be recorded.** Two posts built from the
 *    same staging are a grid problem even when the files differ, so `post.md`
 *    records the crop alongside the filename.
 *
 *   node social/render.js --source kitchen-table-flowers --slug 2026-09-19-a-slug
 *   node social/render.js --source p20ts25030 --slug x --aspect square --crop 120,300,1300,1300
 *
 * Phase 6 adds the type-tile renderer — HTML in headless Chromium with the fonts
 * vendored — which is a different job. This one handles photographs.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LIB_DIR = path.join(__dirname, 'library');
const MANIFEST = path.join(LIB_DIR, 'manifest.json');
const RENDERED = path.join(__dirname, 'rendered');
const PAPER = '#fbf8f3';

const ASPECTS = {
  feed: { w: 1080, h: 1350 },   // 4:5, the tallest Instagram allows in feed
  story: { w: 1080, h: 1920 },  // 9:16
  square: { w: 1080, h: 1080 },
};

class RenderError extends Error {
  constructor(message) { super(message); this.name = 'RenderError'; }
}

function loadManifest(file = MANIFEST) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).items || [];
  } catch {
    throw new RenderError(`No library manifest at ${file}. Run the library build first.`);
  }
}

function findSource(key, items) {
  const wanted = String(key).trim().toLowerCase().replace(/[\s_]+/g, '-');
  const item = items.find((i) => i.key === wanted);
  if (!item) {
    throw new RenderError(
      `"${key}" is not in the library.\n` +
      'Only images in social/library/ can be rendered — that is deliberate. The\n' +
      'seasonal range and the uncleared Drive folders have no path through this tool.\n' +
      `Known keys start: ${items.slice(0, 5).map((i) => i.key).join(', ')}…`,
    );
  }
  return item;
}

const identify = (file, fmt) => execFileSync('identify', ['-format', fmt, file], { encoding: 'utf8' }).trim();

/**
 * Work out a crop window of the target aspect, centred on the subject.
 *
 * `bias` nudges it: photographs in this library put the arrangement left of
 * centre more often than not, so a plain centre crop sometimes clips it.
 */
function centreCrop(srcW, srcH, targetAspect, bias = 0.5) {
  let w = srcW;
  let h = Math.round(w / targetAspect);
  if (h > srcH) {
    h = srcH;
    w = Math.round(h * targetAspect);
  }
  const x = Math.max(0, Math.min(srcW - w, Math.round((srcW - w) * bias)));
  const y = Math.max(0, Math.round((srcH - h) * 0.5));
  return { x, y, w, h };
}

function parseCrop(text) {
  const parts = String(text).split(',').map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new RenderError(`--crop wants "x,y,w,h", got "${text}"`);
  }
  const [x, y, w, h] = parts;
  return { x, y, w, h };
}

/**
 * Render one file. Returns what was actually done, for post.md to record.
 */
function render({
  source,
  slug,
  aspect = 'feed',
  crop = null,
  bias = 0.5,
  name = null,
  quality = 88,
  manifestFile = MANIFEST,
  outRoot = RENDERED,
}) {
  const spec = ASPECTS[aspect];
  if (!spec) throw new RenderError(`Unknown aspect "${aspect}". One of: ${Object.keys(ASPECTS).join(', ')}`);
  if (!slug) throw new RenderError('A package slug is required.');

  const items = loadManifest(manifestFile);
  const item = findSource(source, items);
  const src = path.join(path.dirname(manifestFile), item.file);
  if (!fs.existsSync(src)) throw new RenderError(`Manifest lists ${item.file} but it is not on disk.`);

  const [srcW, srcH] = identify(src, '%w %h').split(' ').map(Number);
  const window = crop ? parseCrop(crop) : centreCrop(srcW, srcH, spec.w / spec.h, bias);

  if (window.x < 0 || window.y < 0 || window.x + window.w > srcW || window.y + window.h > srcH) {
    throw new RenderError(
      `Crop ${window.x},${window.y},${window.w},${window.h} falls outside the ${srcW}×${srcH} source.`,
    );
  }

  const outDir = path.join(outRoot, slug);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, name || (aspect === 'story' ? 'story.jpg' : '1.jpg'));

  if (aspect === 'story') {
    // Letterbox onto the brand paper rather than crop a landscape photograph to
    // 9:16, which throws away most of the frame and usually the subject with it.
    const feedWindow = crop ? window : centreCrop(srcW, srcH, ASPECTS.feed.w / ASPECTS.feed.h, bias);
    const tmp = path.join(outDir, '.tmp-feed.jpg');
    execFileSync('convert', [
      src, '-auto-orient',
      '-crop', `${feedWindow.w}x${feedWindow.h}+${feedWindow.x}+${feedWindow.y}`, '+repage',
      '-resize', `${ASPECTS.feed.w}x${ASPECTS.feed.h}^`,
      '-gravity', 'center', '-extent', `${ASPECTS.feed.w}x${ASPECTS.feed.h}`,
      '-quality', String(quality), '-strip', tmp,
    ]);
    execFileSync('convert', [
      '-size', `${spec.w}x${spec.h}`, `xc:${PAPER}`,
      tmp, '-gravity', 'center', '-composite',
      '-quality', String(quality), '-strip', outFile,
    ]);
    fs.unlinkSync(tmp);
  } else {
    execFileSync('convert', [
      src, '-auto-orient',
      '-crop', `${window.w}x${window.h}+${window.x}+${window.y}`, '+repage',
      '-resize', `${spec.w}x${spec.h}^`,
      '-gravity', 'center', '-extent', `${spec.w}x${spec.h}`,
      '-quality', String(quality), '-strip', outFile,
    ]);
  }

  const out = {
    source_key: item.key,
    source_file: item.file,
    source_dimensions: `${srcW}x${srcH}`,
    crop: `${window.w}x${window.h}+${window.x}+${window.y}`,
    aspect,
    output: path.relative(path.join(__dirname, '..'), outFile),
    dimensions: identify(outFile, '%wx%h'),
    bytes: fs.statSync(outFile).size,
  };

  if (out.dimensions !== `${spec.w}x${spec.h}`) {
    throw new RenderError(`Expected ${spec.w}x${spec.h}, produced ${out.dimensions}.`);
  }
  return out;
}

module.exports = { render, centreCrop, findSource, loadManifest, ASPECTS, RenderError, PAPER };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = (flag, fallback = null) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
  };
  try {
    const result = render({
      source: arg('--source'),
      slug: arg('--slug'),
      aspect: arg('--aspect', 'feed'),
      crop: arg('--crop'),
      bias: parseFloat(arg('--bias', '0.5')),
      name: arg('--name'),
    });
    console.log(JSON.stringify(result, null, 2));
    console.error('\nOpen the file before writing alt text. Verify the asset, not the intention.');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
