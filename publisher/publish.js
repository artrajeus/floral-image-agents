'use strict';

/**
 * The publisher.
 *
 * Reads approved packages out of social/queue/, posts them, and commits the
 * resulting media IDs back so the repository is the record of what actually went
 * out.
 *
 * Three things this file will not do, each for a reason:
 *
 *  - **It never sets `status: approved`.** Only Sam does that, by hand, by name.
 *    A system that can generate *and* publish is a system that can publish
 *    something wrong at 8am with nobody awake.
 *
 *  - **It never posts a package that is already posted.** GitHub Actions cron is
 *    unreliable enough that we nudge late runs with an empty commit, so every run
 *    has to be safe to repeat. Idempotency is what makes the nudge safe.
 *
 *  - **It never guesses at a token.** The Page token is fetched from
 *    /me/accounts every run and passed explicitly.
 *
 * Usage:
 *   node publisher/publish.js            post everything due
 *   node publisher/publish.js --dry-run  say what would happen, touch nothing
 *   node publisher/publish.js --package social/queue/2026-09-18-slug
 */

const fs = require('fs');
const path = require('path');

const { createGraph, GraphError } = require('./graph');
const { resolvePageToken, postPagePhoto } = require('./facebook');
const ig = require('./instagram');
const { assertImageUrl } = require('./preflight');
const { trackToken } = require('./tokens');

const REPO_ROOT = path.join(__dirname, '..');
const QUEUE_DIR = path.join(REPO_ROOT, 'social', 'queue');

// ---------------------------------------------------------------------------
// Package loading
// ---------------------------------------------------------------------------

function listPackages(queueDir = QUEUE_DIR) {
  if (!fs.existsSync(queueDir)) return [];
  return fs
    .readdirSync(queueDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(queueDir, e.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'publish.json')))
    .sort();
}

function loadPackage(dir) {
  const file = path.join(dir, 'publish.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { dir, file, pkg };
}

function savePackage({ file, pkg }) {
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * Why a package is or is not publishable right now.
 * Returns { publish: boolean, reason: string }.
 */
function assess({ pkg }, { now = new Date() } = {}) {
  if (pkg.status === 'posted' || (pkg.posted && pkg.posted.ig_media_id)) {
    return { publish: false, reason: 'already posted' };
  }
  if (pkg.status !== 'approved') {
    return { publish: false, reason: `status is "${pkg.status}", not "approved"` };
  }
  if (!pkg.approved_by) {
    // Belt and braces: `approved` without a name is not an approval, it is a
    // typo or a generator that went further than it should have.
    return { publish: false, reason: 'approved but no approved_by — refusing' };
  }
  if (!pkg.scheduled_utc) {
    return { publish: false, reason: 'no scheduled_utc' };
  }
  const due = new Date(pkg.scheduled_utc);
  if (Number.isNaN(due.getTime())) {
    return { publish: false, reason: `scheduled_utc "${pkg.scheduled_utc}" is not a date` };
  }
  if (due > now) {
    return { publish: false, reason: `not due until ${pkg.scheduled_utc}` };
  }
  if (!Array.isArray(pkg.media) || pkg.media.length === 0) {
    return { publish: false, reason: 'no media' };
  }
  if (!Object.prototype.hasOwnProperty.call(pkg, 'source_images')) {
    // Absent is not the same as empty. Empty means "a type tile, genuinely no
    // source"; absent means nobody recorded it, and an unrecorded source is a
    // gap the duplicate check cannot see.
    return { publish: false, reason: 'source_images is absent (not the same as []) — unrecorded' };
  }
  return { publish: true, reason: 'due' };
}

// ---------------------------------------------------------------------------
// Publishing one package
// ---------------------------------------------------------------------------

async function publishPackage(entry, ctx) {
  const { graph, pageToken, igUserId, pageId, dryRun, log, waitOpts, fetchImpl } = ctx;
  const { pkg } = entry;
  const result = { slug: path.basename(entry.dir), dryRun: !!dryRun };

  // Preflight every URL before a single call goes out. A bad URL fails with a
  // message that does not mention URLs, so we would rather find it here.
  for (const item of pkg.media) {
    await assertImageUrl(item.url, { fetchImpl });
  }
  log(`  preflight ok (${pkg.media.length} url${pkg.media.length === 1 ? '' : 's'})`);

  if (dryRun) {
    result.wouldPost = {
      format: pkg.format,
      media: pkg.media.map((m) => m.url),
      caption: (pkg.caption || '').slice(0, 60),
      story: !!pkg.story,
      crosspost: !!pkg.crosspost_facebook,
    };
    return result;
  }

  // --- feed post ----------------------------------------------------------
  let containerId;
  if (pkg.format === 'carousel') {
    const childIds = [];
    for (const item of pkg.media) {
      childIds.push(await ig.createCarouselItem(graph, pageToken, igUserId, { imageUrl: item.url }));
    }
    for (const child of childIds) await ig.waitForContainer(graph, pageToken, child, waitOpts);
    containerId = await ig.createCarouselContainer(graph, pageToken, igUserId, { childIds, caption: pkg.caption });
  } else {
    containerId = await ig.createImageContainer(graph, pageToken, igUserId, {
      imageUrl: pkg.media[0].url,
      caption: pkg.caption,
    });
  }

  await ig.waitForContainer(graph, pageToken, containerId, waitOpts);
  const mediaId = await ig.publishContainer(graph, pageToken, igUserId, containerId);
  result.ig_media_id = mediaId;
  log(`  instagram: ${mediaId}`);

  // --- first comment ------------------------------------------------------
  if (pkg.first_comment) {
    result.ig_comment_id = await ig.postComment(graph, pageToken, mediaId, pkg.first_comment);
    log(`  comment: ${result.ig_comment_id}`);
  }

  // --- story --------------------------------------------------------------
  if (pkg.story && pkg.story.url) {
    await assertImageUrl(pkg.story.url, { fetchImpl });
    const storyContainer = await ig.createStoryContainer(graph, pageToken, igUserId, { imageUrl: pkg.story.url });
    await ig.waitForContainer(graph, pageToken, storyContainer, waitOpts);
    result.ig_story_id = await ig.publishContainer(graph, pageToken, igUserId, storyContainer);
    log(`  story: ${result.ig_story_id}`);
  }

  // --- Facebook crosspost -------------------------------------------------
  if (pkg.crosspost_facebook) {
    const fb = await postPagePhoto(graph, pageToken, pageId, {
      url: pkg.media[0].url,
      caption: pkg.caption,
    });
    result.fb_post_id = fb.postId;
    log(`  facebook: ${fb.postId}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function run(opts = {}) {
  const {
    env = process.env,
    now = new Date(),
    dryRun = false,
    queueDir = QUEUE_DIR,
    only = null,
    fetchImpl = fetch,
    graphBaseUrl,
    log = console.log,
    waitOpts,
    trackTokenOpts,
  } = opts;

  const userToken = env.META_USER_TOKEN;
  const pageId = env.FB_PAGE_ID;
  const igUserId = env.IG_USER_ID;

  const missing = [
    !userToken && 'META_USER_TOKEN',
    !pageId && 'FB_PAGE_ID',
    !igUserId && 'IG_USER_ID',
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing environment: ${missing.join(', ')}. See publisher/SETUP.md.`);

  const graph = createGraph({ fetchImpl, ...(graphBaseUrl ? { baseUrl: graphBaseUrl } : {}) });

  const tokenAge = trackToken(userToken, { now, ...(trackTokenOpts || {}) });
  if (tokenAge.expired) {
    log(`TOKEN EXPIRED: first seen ${tokenAge.firstSeen}, ${-tokenAge.daysRemaining} days past 60. Run publisher/renew-token.sh.`);
  } else if (tokenAge.shouldWarn) {
    log(`Token expires in ${tokenAge.daysRemaining} days (first seen ${tokenAge.firstSeen}). Run publisher/renew-token.sh.`);
  }

  const candidates = (only ? [only] : listPackages(queueDir)).map(loadPackage);
  const due = [];
  for (const entry of candidates) {
    const verdict = assess(entry, { now });
    if (verdict.publish) due.push(entry);
    else log(`skip ${path.basename(entry.dir)}: ${verdict.reason}`);
  }

  if (due.length === 0) {
    log('nothing due');
    return { posted: [], skipped: candidates.length, tokenAge };
  }

  // Fetch the Page token once, after we know there is work. Never reuse the
  // user token past this line.
  const page = await resolvePageToken(graph, userToken, pageId);
  log(`page token resolved: ${page.name} (${page.id})`);

  const ctx = { graph, pageToken: page.token, igUserId, pageId, dryRun, log, waitOpts, fetchImpl };
  const posted = [];

  for (const entry of due) {
    log(`publish ${path.basename(entry.dir)}`);
    try {
      const result = await publishPackage(entry, ctx);
      if (!dryRun) {
        entry.pkg.status = 'posted';
        entry.pkg.posted = {
          ig_media_id: result.ig_media_id || null,
          ig_comment_id: result.ig_comment_id || null,
          ig_story_id: result.ig_story_id || null,
          fb_post_id: result.fb_post_id || null,
          posted_at: new Date(now).toISOString(),
        };
        savePackage(entry);
      }
      posted.push(result);
    } catch (err) {
      // One bad package must not stop the others. Report it loudly and move on.
      log(`FAILED ${path.basename(entry.dir)}: ${err.message}`);
      if (err instanceof GraphError && err.isTokenProblem) {
        log('  ^ this is a token problem, not a content problem. See publisher/SETUP.md.');
      }
      posted.push({ slug: path.basename(entry.dir), error: err.message });
    }
  }

  return { posted, skipped: candidates.length - due.length, tokenAge };
}

module.exports = { run, assess, listPackages, loadPackage, savePackage, publishPackage };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const only = argv.includes('--package') ? argv[argv.indexOf('--package') + 1] : null;
  run({ dryRun: argv.includes('--dry-run'), only })
    .then((r) => {
      const failed = r.posted.filter((p) => p.error);
      if (failed.length) process.exitCode = 1;
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    });
}
