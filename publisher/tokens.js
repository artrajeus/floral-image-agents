'use strict';

/**
 * Token expiry tracking.
 *
 * Long-lived Meta tokens last 60 days. You cannot simply ask the API when one
 * expires: `debug_token` omits `expires_at` when a token is used to inspect
 * itself, which is exactly the case here, because this repo only ever holds the
 * one token.
 *
 * So expiry is counted from a first-seen date that the repository records. The
 * file stores a SHA-256 hash of the token, never the token — it is committed to
 * a public repo. A new token produces a new hash and therefore a new clock,
 * which is the behaviour we want: rotating the token resets the countdown
 * without anyone having to remember to edit a date.
 *
 * Without this file, the expiry warning can never fire, and the first sign of
 * trouble is a post that silently fails to go out.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_FILE = path.join(__dirname, 'token-first-seen.json');
const LIFETIME_DAYS = 60;
const WARN_AT_DAYS_REMAINING = 14;

const fingerprint = (token) => crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);

function readState(file = STATE_FILE) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state, file = STATE_FILE) {
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}

/**
 * Record the token if it has not been seen, and report how long it has left.
 * `now` is injectable so the tests do not depend on the calendar.
 */
function trackToken(token, { now = new Date(), file = STATE_FILE, write = true } = {}) {
  const id = fingerprint(token);
  const state = readState(file);
  let firstSeen = state[id];

  if (!firstSeen) {
    firstSeen = now.toISOString().slice(0, 10);
    state[id] = firstSeen;
    if (write) writeState(state, file);
  }

  const elapsedDays = Math.floor((now - new Date(`${firstSeen}T00:00:00Z`)) / 86400000);
  const daysRemaining = LIFETIME_DAYS - elapsedDays;

  return {
    fingerprint: id,
    firstSeen,
    daysRemaining,
    expired: daysRemaining <= 0,
    shouldWarn: daysRemaining <= WARN_AT_DAYS_REMAINING,
  };
}

module.exports = { trackToken, fingerprint, STATE_FILE, LIFETIME_DAYS, WARN_AT_DAYS_REMAINING };
