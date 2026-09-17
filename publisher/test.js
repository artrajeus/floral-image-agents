'use strict';

/**
 * The test suite.
 *
 * The tests that matter most here are the ones about tokens. On the system this
 * is modelled on, a full green suite certified a publisher that could not post
 * to Facebook at all, because the mock had been written from the same
 * misunderstanding as the code. So the first thing this file does is check that
 * the *mock* refuses the user token — if that test ever passes trivially, every
 * test below it is worthless.
 *
 * Run: node --test publisher/test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createGraph, GraphError } = require('./graph');
const { createMockGraph, createMockImageHost, DEFAULTS } = require('./mock');
const { resolvePageToken, postPagePhoto, NoPagesError, PageNotGrantedError } = require('./facebook');
const { assertImageUrl, PreflightError } = require('./preflight');
const { trackToken } = require('./tokens');
const { run, assess, listDue } = require('./publish');

const IMAGE = 'https://example.test/social/rendered/a/1.jpg';
const STORY = 'https://example.test/social/rendered/a/story.jpg';

const NOW = new Date('2026-09-18T23:30:00Z');

function harness(mockOptions = {}) {
  const mock = createMockGraph(mockOptions);
  const graph = createGraph({ fetchImpl: mock.fetch });
  return { mock, graph };
}

/** A queue directory on disk, with one package. */
function queueWith(pkg, slug = '2026-09-18-test') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-queue-'));
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'publish.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  return { root, dir, file: path.join(dir, 'publish.json') };
}

const readPkg = (q) => JSON.parse(fs.readFileSync(q.file, 'utf8'));

function approvedPackage(overrides = {}) {
  return {
    status: 'approved',
    approved_by: 'Sam',
    approved_on: '2026-09-17',
    scheduled_utc: '2026-09-18T23:00:00Z',
    pillar: 'home',
    audience: 'b2c',
    format: 'image',
    media: [{ url: IMAGE, alt: 'An arrangement on a kitchen bench.' }],
    caption: 'Your kitchen bench, every month.',
    first_comment: 'From $13 a week.',
    link: 'https://floralimagecanberra.com.au',
    source_images: ['kitchen table flowers'],
    crosspost_facebook: true,
    posted: { ig_media_id: null, fb_post_id: null, story_id: null },
    ...overrides,
  };
}

/** Everything run() needs to work against the mock instead of the internet. */
function runOpts(q, mock, extra = {}) {
  const tokenFile = path.join(q.root, 'token-first-seen.json');
  return {
    env: { META_USER_TOKEN: DEFAULTS.userToken, FB_PAGE_ID: DEFAULTS.pageId, IG_USER_ID: DEFAULTS.igUserId },
    now: NOW,
    queueDir: q.root,
    fetchImpl: async (url, init) => {
      // Image URLs go to the fake host; everything else to the fake Graph API.
      if (!String(url).includes('graph.facebook.com')) {
        return createMockImageHost()(url, init);
      }
      return mock.fetch(url, init);
    },
    log: () => {},
    waitOpts: { intervalMs: 0, sleepImpl: async () => {} },
    trackTokenOpts: { file: tokenFile },
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// The mock itself. If these pass trivially, nothing below them means anything.
// ---------------------------------------------------------------------------

test('the mock rejects the USER token on a Page endpoint', async () => {
  const { mock, graph } = harness();
  await assert.rejects(
    () => graph.post(`/${DEFAULTS.pageId}/photos`, { url: IMAGE, caption: 'x' }, DEFAULTS.userToken),
    (err) => err instanceof GraphError && err.code === 200 && err.isTokenProblem,
  );
  assert.equal(mock.state.pagePosts.length, 0, 'nothing should have been posted');
});

test('the mock rejects the USER token on Instagram publishing too', async () => {
  const { graph } = harness();
  await assert.rejects(
    () => graph.post(`/${DEFAULTS.igUserId}/media`, { image_url: IMAGE }, DEFAULTS.userToken),
    (err) => err.code === 200,
  );
});

test('the mock accepts the PAGE token on a Page endpoint', async () => {
  const { graph } = harness();
  const res = await graph.post(`/${DEFAULTS.pageId}/photos`, { url: IMAGE, caption: 'x' }, DEFAULTS.pageToken);
  assert.ok(res.post_id);
});

test('the mock rejects a Page token on /me/accounts', async () => {
  const { graph } = harness();
  await assert.rejects(() => graph.get('/me/accounts', {}, DEFAULTS.pageToken), (err) => err.code === 200);
});

// ---------------------------------------------------------------------------
// Page token resolution
// ---------------------------------------------------------------------------

test('resolvePageToken returns the Page token, which is not the user token', async () => {
  const { graph } = harness();
  const page = await resolvePageToken(graph, DEFAULTS.userToken, DEFAULTS.pageId);
  assert.equal(page.token, DEFAULTS.pageToken);
  assert.notEqual(page.token, DEFAULTS.userToken);
  assert.equal(page.name, DEFAULTS.pageName);
});

test('every scope and no Page gives an empty list, and the error names the fix', async () => {
  const { graph } = harness({ pagesGranted: false });
  await assert.rejects(
    () => resolvePageToken(graph, DEFAULTS.userToken, DEFAULTS.pageId),
    (err) => {
      assert.ok(err instanceof NoPagesError);
      // The remedy is not discoverable from the API response, so it must be here.
      // Matched on a single line of the message so re-wrapping the prose cannot
      // break the test — the assertion is about the remedy, not the layout.
      assert.match(err.message, /previously unseen scope forces the Page-selection dialog/);
      return true;
    },
  );
});

test('asking for a Page the token cannot see names the Pages it can', async () => {
  const { graph } = harness();
  await assert.rejects(
    () => resolvePageToken(graph, DEFAULTS.userToken, '999999'),
    (err) => err instanceof PageNotGrantedError && err.message.includes(DEFAULTS.pageName),
  );
});

test('postPagePhoto with a page token succeeds', async () => {
  const { graph } = harness();
  const page = await resolvePageToken(graph, DEFAULTS.userToken, DEFAULTS.pageId);
  const res = await postPagePhoto(graph, page.token, DEFAULTS.pageId, { url: IMAGE, caption: 'hello' });
  assert.ok(res.postId);
});

// ---------------------------------------------------------------------------
// Approval — the rule the whole system exists to protect
// ---------------------------------------------------------------------------

test('a draft is never published', async () => {
  const q = queueWith(approvedPackage({ status: 'draft', approved_by: null }));
  const { mock } = harness();
  const res = await run(runOpts(q, mock));
  assert.equal(res.posted.length, 0);
  assert.equal(mock.state.published.size, 0);
  assert.equal(readPkg(q).status, 'draft');
});

test('"approved" with no approved_by is refused', async () => {
  const q = queueWith(approvedPackage({ approved_by: null }));
  const { mock } = harness();
  const res = await run(runOpts(q, mock));
  assert.equal(res.posted.length, 0);
  assert.match(assess({ pkg: readPkg(q) }, { now: NOW }).reason, /no approved_by/);
});

test('the publisher never writes status: approved', async () => {
  const q = queueWith(approvedPackage({ status: 'draft', approved_by: null }));
  const { mock } = harness();
  await run(runOpts(q, mock));
  assert.notEqual(readPkg(q).status, 'approved');
  // And the source carries no such assignment at all.
  const source = fs.readFileSync(path.join(__dirname, 'publish.js'), 'utf8');
  assert.equal(/status\s*=\s*['"]approved['"]/.test(source), false);
});

test('a package scheduled in the future is not posted', async () => {
  const q = queueWith(approvedPackage({ scheduled_utc: '2026-12-01T00:00:00Z' }));
  const { mock } = harness();
  const res = await run(runOpts(q, mock));
  assert.equal(res.posted.length, 0);
});

// ---------------------------------------------------------------------------
// source_images: absent, [] and [x] must stay three different things
// ---------------------------------------------------------------------------

test('absent source_images is refused as unrecorded', () => {
  const pkg = approvedPackage();
  delete pkg.source_images;
  const verdict = assess({ pkg }, { now: NOW });
  assert.equal(verdict.publish, false);
  assert.match(verdict.reason, /absent/);
});

test('empty source_images is fine — a type tile genuinely has no source', () => {
  const verdict = assess({ pkg: approvedPackage({ source_images: [] }) }, { now: NOW });
  assert.equal(verdict.publish, true);
});

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

test('a due package posts to Instagram, comments, and crossposts with the PAGE token', async () => {
  const q = queueWith(approvedPackage());
  const { mock } = harness();
  const res = await run(runOpts(q, mock));

  assert.equal(res.posted.length, 1);
  assert.ok(res.posted[0].ig_media_id);
  assert.ok(res.posted[0].ig_comment_id);
  assert.ok(res.posted[0].fb_post_id);

  // The regression that a green suite once missed: no Page-surface call may
  // ever have carried the user token.
  const leaked = mock.state.calls.filter(
    (c) => c.token === DEFAULTS.userToken && c.path !== '/me/accounts' && c.path !== '/debug_token' && c.path !== '/me',
  );
  assert.deepEqual(leaked, [], `user token leaked to: ${leaked.map((c) => c.path).join(', ')}`);
});

test('media IDs are written back to publish.json', async () => {
  const q = queueWith(approvedPackage());
  const { mock } = harness();
  await run(runOpts(q, mock));
  const after = readPkg(q);
  assert.equal(after.status, 'posted');
  assert.ok(after.posted.ig_media_id);
  assert.ok(after.posted.fb_post_id);
  assert.ok(after.posted.posted_at);
});

test('running twice does not post twice', async () => {
  const q = queueWith(approvedPackage());
  const { mock } = harness();
  await run(runOpts(q, mock));
  const firstCount = mock.state.published.size;
  const second = await run(runOpts(q, mock));
  assert.equal(second.posted.length, 0);
  assert.equal(mock.state.published.size, firstCount);
});

test('a container is waited for rather than published immediately', async () => {
  // containerDelay 2 means publishing before two status checks is rejected by
  // the mock, exactly as the real API rejects it.
  const q = queueWith(approvedPackage());
  const { mock } = harness({ containerDelay: 2 });
  const res = await run(runOpts(q, mock));
  assert.ok(res.posted[0].ig_media_id, res.posted[0].error);
});

test('a story is published when the package carries one', async () => {
  const q = queueWith(approvedPackage({ story: { url: STORY } }));
  const { mock } = harness();
  const res = await run(runOpts(q, mock));
  assert.ok(res.posted[0].ig_story_id);
  assert.equal(readPkg(q).posted.ig_story_id, res.posted[0].ig_story_id);
});

test('a carousel builds children then a container', async () => {
  const q = queueWith(approvedPackage({
    format: 'carousel',
    media: [
      { url: 'https://example.test/a/1.jpg', alt: 'one' },
      { url: 'https://example.test/a/2.jpg', alt: 'two' },
      { url: 'https://example.test/a/3.jpg', alt: 'three' },
    ],
    source_images: ['P20TS25001', 'P20TS25002', 'P20TS25003'],
  }));
  const { mock } = harness();
  const res = await run(runOpts(q, mock));
  assert.ok(res.posted[0].ig_media_id, res.posted[0].error);
  const children = mock.state.calls.filter((c) => c.params.is_carousel_item === 'true');
  assert.equal(children.length, 3);
});

test('one failing package does not stop the next', async () => {
  const q = queueWith(approvedPackage({ media: [{ url: 'https://example.test/a/broken.html', alt: 'x' }] }), '2026-09-18-a');
  const second = path.join(q.root, '2026-09-18-b');
  fs.mkdirSync(second);
  fs.writeFileSync(path.join(second, 'publish.json'), `${JSON.stringify(approvedPackage(), null, 2)}\n`);

  const { mock } = harness();
  const res = await run(runOpts(q, mock, {
    fetchImpl: async (url, init) => {
      if (!String(url).includes('graph.facebook.com')) {
        const html = String(url).endsWith('.html');
        return createMockImageHost({ contentType: html ? 'text/html' : 'image/jpeg' })(url, init);
      }
      return mock.fetch(url, init);
    },
  }));

  assert.equal(res.posted.length, 2);
  assert.ok(res.posted.find((p) => p.error));
  assert.ok(res.posted.find((p) => p.ig_media_id));
});

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

test('preflight rejects an HTML error page and explains the platform message', async () => {
  await assert.rejects(
    () => assertImageUrl('https://example.test/missing.jpg', { fetchImpl: createMockImageHost({ contentType: 'text/html' }) }),
    (err) => err instanceof PreflightError && /Only photo or video can be accepted as media type/.test(err.message),
  );
});

test('preflight rejects a non-200', async () => {
  await assert.rejects(
    () => assertImageUrl('https://example.test/x.jpg', { fetchImpl: createMockImageHost({ ok: false, status: 404 }) }),
    (err) => err instanceof PreflightError && /HTTP 404/.test(err.message),
  );
});

test('preflight accepts a real image/jpeg 200', async () => {
  const res = await assertImageUrl('https://example.test/x.jpg', { fetchImpl: createMockImageHost() });
  assert.equal(res.contentType, 'image/jpeg');
});

// ---------------------------------------------------------------------------
// Token expiry
// ---------------------------------------------------------------------------

test('debug_token omits expires_at when a token inspects itself', async () => {
  const { graph } = harness();
  const self = await graph.get('/debug_token', { input_token: DEFAULTS.userToken }, DEFAULTS.userToken);
  assert.equal(self.data.expires_at, undefined, 'self-inspection must not reveal expiry');
  const other = await graph.get('/debug_token', { input_token: 'OTHER' }, DEFAULTS.userToken);
  assert.ok(other.data.expires_at, 'inspecting a different token does reveal it');
});

test('expiry is counted from a first-seen date the repo records', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fi-tok-')), 'state.json');
  const first = trackToken('TOKEN-A', { now: new Date('2026-09-01T00:00:00Z'), file });
  assert.equal(first.firstSeen, '2026-09-01');
  assert.equal(first.daysRemaining, 60);
  assert.equal(first.shouldWarn, false);

  const later = trackToken('TOKEN-A', { now: new Date('2026-10-20T00:00:00Z'), file });
  assert.equal(later.firstSeen, '2026-09-01', 'the clock does not restart');
  assert.equal(later.daysRemaining, 11);
  assert.equal(later.shouldWarn, true);

  const expired = trackToken('TOKEN-A', { now: new Date('2026-11-05T00:00:00Z'), file });
  assert.equal(expired.expired, true);

  // A new token is a new clock, so rotating resets the countdown by itself.
  const rotated = trackToken('TOKEN-B', { now: new Date('2026-11-05T00:00:00Z'), file });
  assert.equal(rotated.daysRemaining, 60);
  assert.notEqual(rotated.fingerprint, first.fingerprint);
});

test('the state file stores a hash, never the token', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fi-tok-')), 'state.json');
  trackToken('SUPER-SECRET-TOKEN', { now: NOW, file });
  const raw = fs.readFileSync(file, 'utf8');
  assert.equal(raw.includes('SUPER-SECRET-TOKEN'), false);
});

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

test('missing environment fails loudly and names what is missing', async () => {
  await assert.rejects(
    () => run({ env: {}, log: () => {} }),
    (err) => /META_USER_TOKEN, FB_PAGE_ID, IG_USER_ID/.test(err.message),
  );
});

test('a Graph call with no token is refused before it is sent', async () => {
  const { graph } = harness();
  await assert.rejects(() => graph.get('/me', {}, undefined), /Every Graph call names its own token/);
});


// ---------------------------------------------------------------------------
// The cron gate: answering "is there work?" without credentials
// ---------------------------------------------------------------------------

test('listDue needs no credentials and no network', () => {
  const q = queueWith(approvedPackage());
  // No env, no fetch, no token. If this ever needs them, the hourly cron starts
  // failing loudly on an empty queue, which is how alerts get muted.
  const due = listDue({ queueDir: q.root, now: NOW });
  assert.deepEqual(due, ['2026-09-18-test']);
});

test('listDue ignores drafts, unapproved and not-yet-due packages', () => {
  const q = queueWith(approvedPackage({ status: 'draft', approved_by: null }), '2026-09-18-draft');
  for (const [slug, pkg] of [
    ['2026-09-18-noname', approvedPackage({ approved_by: null })],
    ['2026-12-01-future', approvedPackage({ scheduled_utc: '2026-12-01T00:00:00Z' })],
    ['2026-09-18-ok', approvedPackage()],
  ]) {
    const dir = path.join(q.root, slug);
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'publish.json'), JSON.stringify(pkg, null, 2));
  }
  assert.deepEqual(listDue({ queueDir: q.root, now: NOW }), ['2026-09-18-ok']);
});

test('listDue returns nothing for an empty queue rather than throwing', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-empty-'));
  assert.deepEqual(listDue({ queueDir: empty, now: NOW }), []);
});

test('an already-posted package is not due again', () => {
  const q = queueWith(approvedPackage({
    status: 'posted',
    posted: { ig_media_id: 'igmedia_1', fb_post_id: 'x', posted_at: '2026-09-18T23:05:00Z' },
  }));
  assert.deepEqual(listDue({ queueDir: q.root, now: NOW }), []);
});
