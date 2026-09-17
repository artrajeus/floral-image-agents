'use strict';

/**
 * A very small Meta Graph API client.
 *
 * The one design decision that matters here: **the token is always an explicit
 * argument.** There is no ambient "current token" and no default.
 *
 * That is deliberate. The most common first-run failure on this platform is
 * publishing as a Page with the *user's* token instead of the Page's own token,
 * and the usual cause is a client that holds one token and quietly uses it for
 * everything. If every call has to name its token, the mistake has to be made on
 * purpose.
 */

const API_VERSION = 'v21.0';
const DEFAULT_BASE = `https://graph.facebook.com/${API_VERSION}`;

class GraphError extends Error {
  constructor(status, body, context) {
    const api = body && body.error ? body.error : {};
    super(api.message || `Graph API error (HTTP ${status})`);
    this.name = 'GraphError';
    this.status = status;
    this.code = api.code;
    this.subcode = api.error_subcode;
    this.type = api.type;
    this.fbtrace_id = api.fbtrace_id;
    this.context = context;
    this.body = body;
  }

  /** Errors that mean "you used the wrong token", as opposed to "you sent bad data". */
  get isTokenProblem() {
    return this.code === 190 || this.code === 200 || this.code === 10 || this.code === 102;
  }
}

function createGraph({ baseUrl = DEFAULT_BASE, fetchImpl = fetch } = {}) {
  async function call(method, path, params, token) {
    if (!token) {
      throw new Error(`No token supplied for ${method} ${path}. Every Graph call names its own token.`);
    }

    const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    const payload = { ...params, access_token: token };

    let response;
    if (method === 'GET') {
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
      response = await fetchImpl(url.toString(), { method: 'GET' });
    } else {
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && v !== null) form.set(k, String(v));
      }
      response = await fetchImpl(url.toString(), {
        method,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    }

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      // A non-JSON body from graph.facebook.com means something upstream is
      // wrong (a proxy, an outage). Surface the raw text rather than a parse error.
      throw new GraphError(response.status, { error: { message: `Non-JSON response: ${text.slice(0, 300)}` } }, { method, path });
    }

    if (!response.ok || body.error) {
      throw new GraphError(response.status, body, { method, path });
    }
    return body;
  }

  return {
    baseUrl,
    get: (path, params, token) => call('GET', path, params, token),
    post: (path, params, token) => call('POST', path, params, token),
  };
}

module.exports = { createGraph, GraphError, API_VERSION, DEFAULT_BASE };
