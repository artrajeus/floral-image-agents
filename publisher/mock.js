'use strict';

/**
 * A fake Graph API.
 *
 * **This mock is deliberately written against the platform, not against our
 * code.** On the system this repository is modelled on, seventeen green
 * assertions certified a publisher that could not post to Facebook at all — the
 * code passed the user token to Page endpoints, and the mock had been written
 * from the same misunderstanding, so it accepted it. A mock that shares the
 * code's assumptions tests nothing and certifies everything.
 *
 * So this file models the parts of the real API that our code is most likely to
 * get wrong, and it refuses them:
 *
 *   - Page endpoints reject the user token. Always. (`code: 200`)
 *   - Instagram publishing endpoints reject the user token too, because the IG
 *     account hangs off the Page.
 *   - `/me/accounts` can return an empty list while the token holds every scope
 *     — the two-click authorisation trap. Set `pagesGranted: false`.
 *   - `debug_token` omits `expires_at` when a token inspects itself.
 *   - A media container is IN_PROGRESS before it is FINISHED.
 *   - A URL that does not serve an image fails with the platform's real,
 *     unhelpful message.
 *
 * If a change to the publisher makes a test here fail, the default assumption
 * should be that the publisher is wrong, not the mock.
 */

const DEFAULTS = {
  userToken: 'USER-TOKEN',
  pageToken: 'PAGE-TOKEN',
  pageId: '111111111111111',
  pageName: 'Floral Image Canberra',
  igUserId: '222222222222222',
  pagesGranted: true,       // false models the skipped Page-selection click
  containerDelay: 1,        // how many status checks return IN_PROGRESS first
};

function oauthError(message, code = 200, subcode) {
  return {
    status: 400,
    body: { error: { message, type: 'OAuthException', code, error_subcode: subcode, fbtrace_id: 'MOCKTRACE' } },
  };
}

function createMockGraph(options = {}) {
  const cfg = { ...DEFAULTS, ...options };

  const state = {
    calls: [],
    containers: new Map(),   // id -> { checks, kind, url }
    published: new Map(),    // id -> record
    comments: [],
    pagePosts: [],
    counter: 0,
  };

  const nextId = (prefix) => `${prefix}_${++state.counter}`;

  /** The one rule the real API enforces that code most often gets wrong. */
  const isPageToken = (token) => token === cfg.pageToken;

  /** Model the platform's own URL fetch. It does not care what we intended. */
  function urlIsUsableImage(url) {
    if (!url) return false;
    if (/\.(html?|json|txt)(\?|$)/i.test(url)) return false;
    if (/\b(404|error|missing|notfound)\b/i.test(url)) return false;
    return /\.(jpe?g|png)(\?|$)/i.test(url);
  }

  async function mockFetch(rawUrl, init = {}) {
    const method = (init.method || 'GET').toUpperCase();
    const url = new URL(rawUrl);
    const params = new URLSearchParams(
      method === 'GET' ? url.search : (init.body || ''),
    );
    const token = params.get('access_token');
    // Strip the version prefix so paths read the same as in the code.
    const path = url.pathname.replace(/^\/v\d+\.\d+/, '');

    state.calls.push({ method, path, token, params: Object.fromEntries(params) });

    const reply = (status, body) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
      headers: { get: () => 'application/json' },
    });
    const fail = ({ status, body }) => reply(status, body);

    if (!token) {
      return fail(oauthError('An access token is required to request this resource.', 104));
    }
    if (token !== cfg.userToken && token !== cfg.pageToken) {
      return fail(oauthError('Invalid OAuth access token - Cannot parse access token.', 190));
    }

    // --- /me/accounts : where Page tokens come from -------------------------
    if (path === '/me/accounts') {
      if (isPageToken(token)) {
        // A Page token cannot enumerate accounts. Real API behaviour.
        return fail(oauthError('(#200) This endpoint requires a user access token.', 200));
      }
      if (!cfg.pagesGranted) {
        // The trap: every scope granted, no Page ticked. Empty list, HTTP 200.
        return reply(200, { data: [] });
      }
      return reply(200, {
        data: [{ id: cfg.pageId, name: cfg.pageName, access_token: cfg.pageToken }],
      });
    }

    // --- /debug_token : withholds expires_at on self-inspection -------------
    if (path === '/debug_token') {
      const input = params.get('input_token');
      const self = input === token;
      const data = { app_id: '900', type: 'USER', is_valid: true, scopes: ['pages_manage_posts', 'instagram_basic'] };
      if (!self) data.expires_at = 1793000000;
      return reply(200, { data });
    }

    if (path === '/me') {
      return reply(200, { id: '333333333333333', name: 'Token Owner' });
    }

    // --- Page endpoints : user token is NOT acceptable ----------------------
    if (path === `/${cfg.pageId}/photos` || path === `/${cfg.pageId}/feed`) {
      if (!isPageToken(token)) {
        return fail(oauthError(
          '(#200) If posting to a page, requires both manage_pages and publish_pages as an admin with sufficient administrative permission',
          200,
        ));
      }
      if (path.endsWith('/photos') && !urlIsUsableImage(params.get('url'))) {
        return fail(oauthError('(#324) Missing or invalid image file', 324));
      }
      const id = nextId('fbphoto');
      const postId = `${cfg.pageId}_${state.counter}`;
      state.pagePosts.push({ id, postId, caption: params.get('caption') || params.get('message') });
      return reply(200, { id, post_id: postId });
    }

    // --- Instagram : also a Page-token surface ------------------------------
    if (path === `/${cfg.igUserId}/media`) {
      if (!isPageToken(token)) {
        return fail(oauthError(
          '(#200) Requires instagram_content_publish permission on the Page access token',
          200,
        ));
      }
      const mediaType = params.get('media_type');
      const imageUrl = params.get('image_url');

      if (mediaType !== 'CAROUSEL' && !urlIsUsableImage(imageUrl)) {
        // The real, famously unhelpful message.
        return fail(oauthError('Only photo or video can be accepted as media type', 9004, 2207052));
      }
      if (mediaType === 'CAROUSEL') {
        const children = (params.get('children') || '').split(',').filter(Boolean);
        if (children.length < 2 || children.length > 10) {
          return fail(oauthError('(#100) Carousels must contain between 2 and 10 items', 100));
        }
        for (const child of children) {
          if (!state.containers.has(child)) {
            return fail(oauthError(`(#100) Invalid carousel child ${child}`, 100));
          }
        }
      }
      const id = nextId('container');
      state.containers.set(id, { checks: 0, kind: mediaType || 'IMAGE', url: imageUrl });
      return reply(200, { id });
    }

    if (path === `/${cfg.igUserId}/media_publish`) {
      if (!isPageToken(token)) {
        return fail(oauthError('(#200) Requires a Page access token', 200));
      }
      const creationId = params.get('creation_id');
      const container = state.containers.get(creationId);
      if (!container) return fail(oauthError(`(#100) Invalid creation_id ${creationId}`, 100));
      if (container.checks < cfg.containerDelay) {
        // Publishing too early is a real failure, not a no-op.
        return fail(oauthError('(#9007) The media is not ready for publishing, please wait', 9007));
      }
      const id = nextId('igmedia');
      state.published.set(id, { containerId: creationId, kind: container.kind });
      return reply(200, { id });
    }

    // --- container status ---------------------------------------------------
    const containerMatch = state.containers.get(path.slice(1));
    if (containerMatch && method === 'GET') {
      containerMatch.checks += 1;
      const done = containerMatch.checks > cfg.containerDelay;
      return reply(200, { status_code: done ? 'FINISHED' : 'IN_PROGRESS', id: path.slice(1) });
    }

    // --- comments -----------------------------------------------------------
    const commentMatch = path.match(/^\/(igmedia_\d+)\/comments$/);
    if (commentMatch) {
      if (!isPageToken(token)) return fail(oauthError('(#200) Requires a Page access token', 200));
      if (!state.published.has(commentMatch[1])) {
        return fail(oauthError(`(#100) Unknown media ${commentMatch[1]}`, 100));
      }
      const id = nextId('comment');
      state.comments.push({ id, mediaId: commentMatch[1], message: params.get('message') });
      return reply(200, { id });
    }

    return fail({ status: 404, body: { error: { message: `Unknown endpoint ${path}`, type: 'GraphMethodException', code: 100 } } });
  }

  return { fetch: mockFetch, state, config: cfg };
}

/** A fake image host, for preflight tests. */
function createMockImageHost({ ok = true, status = 200, contentType = 'image/jpeg' } = {}) {
  return async () => ({
    ok,
    status,
    headers: { get: (h) => (h.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => '',
  });
}

module.exports = { createMockGraph, createMockImageHost, DEFAULTS };
