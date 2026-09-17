'use strict';

/**
 * Instagram publishing via the Graph API.
 *
 * Instagram is two-step: build a media *container*, then publish it. The
 * container is processed asynchronously, so a publish attempted immediately
 * after creation can fail with the container still IN_PROGRESS. We poll.
 *
 * Note that Instagram Business publishing uses the **Page** token too, not the
 * user token — the IG account hangs off the Page. Same trap as facebook.js.
 */

const TERMINAL_STATUSES = new Set(['FINISHED', 'ERROR', 'EXPIRED', 'PUBLISHED']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createImageContainer(graph, token, igUserId, { imageUrl, caption }) {
  const res = await graph.post(`/${igUserId}/media`, { image_url: imageUrl, caption }, token);
  return res.id;
}

async function createCarouselItem(graph, token, igUserId, { imageUrl }) {
  const res = await graph.post(`/${igUserId}/media`, { image_url: imageUrl, is_carousel_item: 'true' }, token);
  return res.id;
}

async function createCarouselContainer(graph, token, igUserId, { childIds, caption }) {
  const res = await graph.post(
    `/${igUserId}/media`,
    { media_type: 'CAROUSEL', children: childIds.join(','), caption },
    token,
  );
  return res.id;
}

async function createStoryContainer(graph, token, igUserId, { imageUrl }) {
  const res = await graph.post(`/${igUserId}/media`, { image_url: imageUrl, media_type: 'STORIES' }, token);
  return res.id;
}

/**
 * Wait for a container to leave IN_PROGRESS.
 * `sleepImpl` is injectable so the tests do not actually wait.
 */
async function waitForContainer(graph, token, containerId, { attempts = 12, intervalMs = 5000, sleepImpl = sleep } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    const res = await graph.get(`/${containerId}`, { fields: 'status_code,status' }, token);
    last = res.status_code || res.status;
    if (TERMINAL_STATUSES.has(last)) {
      if (last === 'ERROR' || last === 'EXPIRED') {
        throw new Error(`Media container ${containerId} finished as ${last}: ${res.status || ''}`);
      }
      return last;
    }
    if (i < attempts - 1) await sleepImpl(intervalMs);
  }
  throw new Error(`Media container ${containerId} still ${last} after ${attempts} checks.`);
}

async function publishContainer(graph, token, igUserId, containerId) {
  const res = await graph.post(`/${igUserId}/media_publish`, { creation_id: containerId }, token);
  return res.id;
}

async function postComment(graph, token, mediaId, message) {
  const res = await graph.post(`/${mediaId}/comments`, { message }, token);
  return res.id;
}

module.exports = {
  createImageContainer,
  createCarouselItem,
  createCarouselContainer,
  createStoryContainer,
  waitForContainer,
  publishContainer,
  postComment,
};
