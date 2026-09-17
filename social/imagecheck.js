'use strict';

/**
 * No source photograph runs in two posts — and the obvious check finds nothing.
 *
 * Every tile is a composite: type, scrims and crop are baked in. Two posts built
 * from the same photograph therefore produce two different files with two
 * different names. On the system this is modelled on, comparing *output* files
 * found 101 distinct files and zero repeats while the same photograph sat in two
 * live posts.
 *
 * So the check runs on the **source**. Every package records `source_images`,
 * and three states have to stay distinguishable:
 *
 *   ["kitchen table flowers"]  one photograph
 *   []                         a type tile, genuinely no source
 *   field absent               UNRECORDED — a gap, reported, never passed
 *
 * Conflating the last two is how a duplicate check quietly passes on a queue it
 * cannot see.
 *
 * A second rule, learned from this library specifically: identifiers are keyed
 * on the **design number or filename stem**, never a path or a Drive file ID.
 * The catalogue holds the same design as two files under different IDs, and the
 * same photograph lives in two Drive folders. Keyed on either, one arrangement
 * runs twice and the check passes clean.
 *
 *   node social/imagecheck.js
 *
 * Exits non-zero if anything is wrong. Run it before anything queues.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = path.join(__dirname, 'queue');

/** Reduce any reference to its stable key: drop directories and extension. */
function normalise(ref) {
  return String(ref)
    .trim()
    .replace(/^.*[\\/]/, '')
    .replace(/\.[A-Za-z0-9]+$/, '')
    .toLowerCase();
}

function readQueue(queueDir = QUEUE_DIR) {
  if (!fs.existsSync(queueDir)) return [];
  return fs.readdirSync(queueDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(queueDir, e.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'publish.json')))
    .map((dir) => ({
      slug: path.basename(dir),
      pkg: JSON.parse(fs.readFileSync(path.join(dir, 'publish.json'), 'utf8')),
    }));
}

function check(entries) {
  const problems = [];
  const typeTiles = [];
  const seen = new Map(); // normalised key -> [slug, ...]

  for (const { slug, pkg } of entries) {
    if (!Object.prototype.hasOwnProperty.call(pkg, 'source_images')) {
      problems.push({
        kind: 'unrecorded',
        slug,
        message: `${slug}: source_images is ABSENT. That is not the same as []. ` +
                 'Absent means nobody recorded where the image came from, so this ' +
                 'package is invisible to the duplicate check. Add [] if it is a ' +
                 'type tile, or list the sources.',
      });
      continue;
    }

    const refs = pkg.source_images;
    if (!Array.isArray(refs)) {
      problems.push({ kind: 'malformed', slug, message: `${slug}: source_images must be an array, got ${typeof refs}.` });
      continue;
    }

    if (refs.length === 0) {
      typeTiles.push(slug);
      continue;
    }

    const within = new Set();
    for (const ref of refs) {
      const key = normalise(ref);
      if (!key) {
        problems.push({ kind: 'malformed', slug, message: `${slug}: an empty source_images entry.` });
        continue;
      }
      if (within.has(key)) {
        problems.push({ kind: 'repeat-within', slug, message: `${slug}: "${ref}" appears twice in its own source_images.` });
      }
      within.add(key);
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(slug);
    }
  }

  for (const [key, slugs] of seen) {
    const unique = [...new Set(slugs)];
    if (unique.length > 1) {
      problems.push({
        kind: 'duplicate',
        slug: unique.join(', '),
        message: `"${key}" is the source for ${unique.length} packages: ${unique.join(', ')}. ` +
                 'One photograph, one post.',
      });
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    packages: entries.length,
    typeTiles: typeTiles.length,
    distinctSources: seen.size,
  };
}

module.exports = { check, readQueue, normalise, QUEUE_DIR };

if (require.main === module) {
  const result = check(readQueue());
  console.log(
    `${result.packages} package(s), ${result.distinctSources} distinct source(s), ` +
    `${result.typeTiles} type tile(s) with no source.`,
  );
  if (result.ok) {
    console.log('OK — no photograph runs in two posts, and nothing is unrecorded.');
  } else {
    for (const p of result.problems) console.error(`  ${p.kind.toUpperCase()}: ${p.message}`);
    process.exitCode = 1;
  }
}
