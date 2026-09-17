'use strict';

/**
 * Facebook Page publishing.
 *
 * Two platform facts drive everything in this file, and each one costs about a
 * day to rediscover:
 *
 * 1. **A Page token is not a user token.** Publishing as a Page requires the
 *    Page's own token, fetched from `/me/accounts`. A user token carrying every
 *    scope in the world is still rejected on Page endpoints.
 *
 * 2. **Facebook grants a scope and a Page in two separate clicks, and silently
 *    skips the second.** A token can hold every scope and still see zero Pages.
 *    The Page-selection dialog only reappears when you request a scope the token
 *    has not seen before — so adding any new scope forces it back. That is the
 *    fix, and it is not discoverable from the error message, which is why
 *    `NoPagesError` carries it.
 */

const { GraphError } = require('./graph');

class NoPagesError extends Error {
  constructor(pageId) {
    super(
      `The user token can see no Pages, so the Page token for ${pageId} cannot be fetched.\n\n` +
      'This is almost never a scope problem. Facebook asks for permissions and for\n' +
      'Page access in two separate steps, and the second one is easy to skip — the\n' +
      'token then holds every scope and still sees nothing.\n\n' +
      'The fix: re-authorise while requesting a scope the token has not been granted\n' +
      'before. A previously unseen scope forces the Page-selection dialog to reappear.\n' +
      'Tick the Page there. See publisher/SETUP.md.'
    );
    this.name = 'NoPagesError';
    this.pageId = pageId;
  }
}

class PageNotGrantedError extends Error {
  constructor(pageId, available) {
    super(
      `Page ${pageId} was not among the Pages this token can see.\n` +
      `Visible Pages: ${available.map((p) => `${p.name} (${p.id})`).join(', ') || 'none'}\n` +
      'Either FB_PAGE_ID is wrong, or that Page was not ticked during authorisation.'
    );
    this.name = 'PageNotGrantedError';
    this.pageId = pageId;
    this.available = available;
  }
}

/**
 * Exchange a user token for the Page's own token.
 * Always call this before touching a Page endpoint. Never pass the user token on.
 */
async function resolvePageToken(graph, userToken, pageId) {
  const res = await graph.get('/me/accounts', { fields: 'id,name,access_token' }, userToken);
  const pages = (res && res.data) || [];

  if (pages.length === 0) throw new NoPagesError(pageId);

  const page = pages.find((p) => String(p.id) === String(pageId));
  if (!page) throw new PageNotGrantedError(pageId, pages);
  if (!page.access_token) throw new NoPagesError(pageId);

  return { token: page.access_token, name: page.name, id: String(page.id) };
}

/** Post a photo to the Page. `pageToken` must be the Page's token, not the user's. */
async function postPagePhoto(graph, pageToken, pageId, { url, caption }) {
  const res = await graph.post(`/${pageId}/photos`, { url, caption, published: 'true' }, pageToken);
  return { photoId: res.id, postId: res.post_id || null };
}

/** Post a link or plain status to the Page. */
async function postPageFeed(graph, pageToken, pageId, { message, link }) {
  const res = await graph.post(`/${pageId}/feed`, { message, link }, pageToken);
  return { postId: res.id };
}

module.exports = { resolvePageToken, postPagePhoto, postPageFeed, NoPagesError, PageNotGrantedError, GraphError };
