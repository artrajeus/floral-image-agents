# Publishing

How a post reaches the feed, and every incident as it happens.

**Status: built and scheduled. Never yet run against the real API.**

Phases 2–5 are complete: `publisher/` holds the code, the workflow runs hourly,
the generator skill is in `.claude/skills/draft-posts/`, and 59 tests pass. What has **not** happened is Phase 3 — no credentials exist,
`whoami.js` has never been pointed at the real account, and nothing has been
posted.

So Phase 4's checkpoint — *a scheduled post lands within the hour we expected* —
**cannot be met yet**, and will not be until a real post has gone out. The cron is
in place and idle. It is not evidence that anything works.

A green suite proves the publisher behaves correctly against a model of the
platform. It does not prove the model is right.

Incidents get appended at the bottom of this file as they occur, with what they
cost.

---

## The intended path

```
social/queue/<date>-<slug>/publish.json   status: approved
        │
        ▼
.github/workflows/publish.yml  (hourly cron + push trigger)
        │
        ▼
publisher/publish.js ──► Instagram Graph API ──► feed post
        │                                    └─► first comment
        │                                    └─► Story
        └──► publisher/facebook.js ──► Page crosspost
        │
        ▼
media IDs committed back to publish.json   [skip ci]
```

The repository is the record of what actually went out.

---

## Platform facts, known in advance

### A Page token is not a user token
Publishing as a Page requires the Page's **own** token, fetched from
`/me/accounts`. A user token with every scope in the world will still be
rejected on Page endpoints. This is the single most common first-run failure.

### Facebook grants a scope and a Page in two separate clicks
It silently skips the second. A token can carry every scope and see **zero
Pages**. The page-selection dialog only reappears when you request a scope the
token has not seen before — so **adding any new scope forces the dialog back**.
That is the fix, and it is not discoverable from the error message.

### Tokens expire every 60 days
`debug_token` withholds `expires_at` when a token inspects itself. So expiry must
be counted from a **first-seen date the repo records**, keyed on a hash of the
token. Without that, the expiry warning can never fire, and the first sign of
trouble is a silent failure to post.

### `backdated_time` does not work
Backfilled posts land stamped with their creation time. If we ever backfill, the
dates will be wrong. Record that honestly rather than reporting a success.

### GitHub Actions cron is not the schedule you asked for
`*/15` on a private repo has been measured at a **median 66-minute gap, worst
case 162**. Asking for four runs an hour does not get you four runs an hour; it
gets you the same lateness with most of the runs dropped. So:

- ask for **hourly**, at **minute 30** — the top of the hour is the platform's
  busiest minute and is itself a cause of delay
- **schedule each package ~30 minutes before the slot you want**, because
  delivery runs late far more often than early
- add a `push` trigger so an empty commit can nudge a late run
  (`./publisher/nudge.sh`)
- make publishing **idempotent**, so nudging can never double-post
- put **`[skip ci]`** on the record-back commit, or it loops

### An hourly job that fails every hour is worse than no job
Twenty-three hours out of twenty-four nothing is due. Those runs must be cheap
and green: the workflow asks `publish.js --due` first, which needs no credentials
and no network, and stops there when the answer is nothing.

The reason is not tidiness. A workflow that goes red every hour trains everyone
to ignore it, and then the failure that matters lands in an inbox nobody reads.
So an empty queue is a green tick — and a package that **is** due with missing
credentials fails loudly, because that one is real.

### A scheduled post cannot re-check anything when it fires
Not stock, not weather, not a countdown. Perishable figures stay out of the
creative. Anything that must be current runs as a one-shot job ahead of the post,
while somebody is awake.

### Timezones
Canberra is `Australia/Sydney` and **observes daylight saving**. Convert to UTC
against the offset in effect **on the posting date**, not today's. Hand-computing
this eventually posts at the wrong hour, in public, with no undo. `schedule.js`
does the conversion; nobody does it by hand.

---

## The mock

`publisher/mock.js` must model the platform's **actual** behaviour, including the
parts the real code currently gets wrong — specifically the separate Page token.

The reason: on the system this is modelled on, seventeen green assertions
certified a publisher that could not post to Facebook at all, because the mock
had been written from the same misunderstanding as the code. A mock that shares
the code's assumptions tests nothing and certifies everything.

---

## Pre-flight, before any URL enters a package

- `curl` the image URL and assert **both** `200` **and** `Content-Type:
  image/jpeg`. A post once failed because the URL served an HTML error page, and
  the only diagnostic the platform gave was *"Only photo or video can be accepted
  as media type"*.
- Open the rendered image and confirm the display face is Cormorant Garamond. A
  broken font file falls back to a system face **silently, without erroring**,
  and has shipped a whole batch that way.
- Write alt text **last, from the finished image**. Alt text written from the
  brief once described a headline that had since been rewritten.

---

## Incidents

*None yet. Append here, newest first, with the date, what broke, what it cost,
and what changed so it cannot happen again.*
