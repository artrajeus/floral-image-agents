'use strict';

/**
 * Checks that run before anything is sent to the platform.
 *
 * The URL check exists because of a specific failure: a post once failed with
 * the only diagnostic being *"Only photo or video can be accepted as media
 * type"*, because the image URL was serving an HTML error page. The platform
 * will not tell you that. So we look first, and we assert on the two things
 * that actually matter — a 200, and a real image content type.
 */

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg'];

class PreflightError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PreflightError';
  }
}

async function assertImageUrl(url, { fetchImpl = fetch } = {}) {
  let res;
  try {
    // GET rather than HEAD: some static hosts, GitHub Pages among them, answer
    // HEAD differently from GET, and GET is what the Graph API will issue.
    res = await fetchImpl(url, { method: 'GET' });
  } catch (err) {
    throw new PreflightError(`${url} could not be fetched at all: ${err.message}`);
  }

  if (res.status !== 200) {
    throw new PreflightError(`${url} returned HTTP ${res.status}. The Graph API needs a 200.`);
  }

  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ACCEPTED_TYPES.includes(type)) {
    throw new PreflightError(
      `${url} served content-type "${type || '(none)'}", not image/jpeg.\n` +
      'The platform rejects this with "Only photo or video can be accepted as media type",\n' +
      'which does not tell you the URL was the problem. It usually means the path is wrong\n' +
      'and something is serving an HTML error page.'
    );
  }

  return { status: res.status, contentType: type };
}

module.exports = { assertImageUrl, PreflightError, ACCEPTED_TYPES };
