#!/usr/bin/env node
'use strict';

/**
 * Ask the real Graph API who we are.
 *
 * Run this before trusting anything. A green test suite proves the publisher
 * behaves correctly against a model of the platform; only this proves the
 * credentials point at the right account.
 *
 *   node publisher/whoami.js
 *
 * What you are looking for: the Page named below is Floral Image Canberra's
 * Facebook Page, and the Instagram account is @floralimage_canberra. If either
 * names something else, stop — publishing would go to the wrong place.
 */

const { createGraph, GraphError } = require('./graph');
const { trackToken } = require('./tokens');

async function main() {
  const userToken = process.env.META_USER_TOKEN;
  const wantPageId = process.env.FB_PAGE_ID;
  const wantIgId = process.env.IG_USER_ID;

  if (!userToken) {
    console.error('META_USER_TOKEN is not set. See publisher/SETUP.md.');
    process.exitCode = 1;
    return;
  }

  const graph = createGraph();
  let problems = 0;

  // --- who owns the token -------------------------------------------------
  const me = await graph.get('/me', { fields: 'id,name' }, userToken);
  console.log(`token owner   : ${me.name} (${me.id})`);

  // --- how long it has left ----------------------------------------------
  const age = trackToken(userToken, { write: true });
  const state = age.expired ? 'EXPIRED' : `${age.daysRemaining} days left`;
  console.log(`token age     : first seen ${age.firstSeen} — ${state}`);
  if (age.expired || age.shouldWarn) {
    console.log('                run publisher/renew-token.sh');
    if (age.expired) problems += 1;
  }

  // debug_token withholds expires_at on self-inspection, which is why the line
  // above counts from a recorded date instead. Shown for completeness.
  try {
    const dbg = await graph.get('/debug_token', { input_token: userToken }, userToken);
    const scopes = (dbg.data && dbg.data.scopes) || [];
    console.log(`scopes        : ${scopes.join(', ') || '(none reported)'}`);
    if (dbg.data && dbg.data.expires_at === undefined) {
      console.log('                (expires_at withheld — a token inspecting itself never sees it)');
    }
  } catch {
    console.log('scopes        : (debug_token unavailable)');
  }

  // --- pages --------------------------------------------------------------
  const accounts = await graph.get('/me/accounts', { fields: 'id,name,access_token' }, userToken);
  const pages = (accounts && accounts.data) || [];

  if (pages.length === 0) {
    problems += 1;
    console.log('pages         : NONE VISIBLE');
    console.log('');
    console.log('  This is the most common first-run failure and it is almost never a');
    console.log('  missing scope. Facebook grants permissions and Page access in two');
    console.log('  separate clicks, and silently skips the second — so a token can hold');
    console.log('  every scope and still see no Pages.');
    console.log('');
    console.log('  The fix: re-authorise while requesting a scope this token has never');
    console.log('  been granted. A previously unseen scope forces the Page-selection');
    console.log('  dialog to reappear. Tick the Page there.');
  } else {
    for (const p of pages) {
      const mark = String(p.id) === String(wantPageId) ? ' <- FB_PAGE_ID' : '';
      console.log(`page          : ${p.name} (${p.id})${mark}`);
    }
    if (wantPageId && !pages.some((p) => String(p.id) === String(wantPageId))) {
      problems += 1;
      console.log(`                FB_PAGE_ID ${wantPageId} is not in that list.`);
    }
  }

  // --- instagram ----------------------------------------------------------
  const target = pages.find((p) => String(p.id) === String(wantPageId)) || pages[0];
  if (target && target.access_token) {
    try {
      const linked = await graph.get(
        `/${target.id}`,
        { fields: 'instagram_business_account{id,username,followers_count}' },
        target.access_token,
      );
      const acct = linked.instagram_business_account;
      if (!acct) {
        problems += 1;
        console.log('instagram     : no Business account linked to that Page');
      } else {
        const mark = String(acct.id) === String(wantIgId) ? ' <- IG_USER_ID' : '';
        console.log(`instagram     : @${acct.username} (${acct.id})${mark}`);
        if (typeof acct.followers_count === 'number') {
          console.log(`followers     : ${acct.followers_count}`);
        }
        if (wantIgId && String(acct.id) !== String(wantIgId)) {
          problems += 1;
          console.log(`                IG_USER_ID is set to ${wantIgId}, which is not this account.`);
        }
      }
    } catch (err) {
      problems += 1;
      console.log(`instagram     : could not read — ${err.message}`);
    }
  }

  console.log('');
  console.log(problems === 0
    ? 'OK — credentials resolve to a Page and an Instagram account.'
    : `${problems} problem${problems === 1 ? '' : 's'} above. Do not publish until they are clear.`);
  if (problems) process.exitCode = 1;
}

main().catch((err) => {
  if (err instanceof GraphError) {
    console.error(`Graph API error ${err.code || ''}: ${err.message}`);
    if (err.isTokenProblem) console.error('This is a token problem. See publisher/SETUP.md.');
  } else {
    console.error(err.message);
  }
  process.exitCode = 1;
});
