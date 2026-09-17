# Strategy — Floral Image Canberra

## What this account is for

**It is the landing page for the Meta ads.** Floral Image Canberra is running
paid on both Facebook and Instagram; a meaningful share of people who see an ad
will tap the profile before they do anything else, and decide there.

That has consequences the generator must internalise:

1. **The grid is the ad.** On a profile grid, captions do not exist. Whatever a
   post needs to say, the image says.
2. **The first nine tiles are the pitch.** Not the latest tile — the top three
   rows, read as a block, in about four seconds.
3. **Consistency beats individual brilliance.** A professional, consistent
   account that posts every day is the stated goal. A run of nine coherent tiles
   outperforms three brilliant ones among six strays.
4. **A cold visitor knows nothing.** No context, no sense of what "Floral Image"
   is. Every trio should leave them knowing it is flowers, they are life-like
   and hand made, they get swapped monthly, and it starts at $13 a week.

## Cadence

**Daily. Seven a week.**

Sam has asked for daily and daily is what gets built. Stating the tension once,
in the file where it belongs: a single-location service business does not have
365 pieces of news a year, and an account that tries to manufacture them starts
padding by the second week. The structural answer is that **daily has to be
mostly craft, product, place and case — not news.** Five of the seven pillars
below never require anything to have happened. That is what makes seven a week
honest rather than filler.

If the queue is ever short, **the correct failure is to post nothing that day**,
not to pad. A gap nobody notices costs less than a post that says nothing.

## The seven pillars

One per day of the week. Five require no news at all.

| # | Pillar | Audience | What it is | Needs news? |
|---|---|---|---|---|
| 1 | **The Range** | Both | One design, close, beautiful. Hundreds available; this is one of them. | No |
| 2 | **The Room** | B2B | An arrangement in a workplace — reception, waiting room, boardroom. | No |
| 3 | **The Home** | B2C | A kitchen bench, a hallway console, a dining table. | No |
| 4 | **The Craft** | Both | Hand made. Materials chosen to match how the real flower feels. The making. | No |
| 5 | **The Round** | Both | Canberra and the region. The van, the run days, the monthly trip to Cooma. | Sometimes |
| 6 | **The Case** | Both | Why it works: no water, never wilts, allergy-free, five years, rehomed and reused. | No |
| 7 | **The Ask** | Alternates | The offer. From $13 a week. No contract. A week on us / two weeks on us. | No |

### B2B / B2C balance

Pillars 2 and 3 split the audience directly. Pillar 7 alternates week to week.
Pillars 1, 4, 5 and 6 serve both. Net result is roughly **even**, with B2B
slightly ahead — which matches where the revenue is.

⚠ Sam should confirm the weighting. If homes are the growth priority, swap
pillar 7's alternation for a 2:1 bias toward B2C and say so here.

### The Ask is one in seven, and that is deliberate

An account that sells in every post gets scrolled past. One explicit ask a week,
with six posts that earn the right to make it, converts better than seven asks —
and the six are what a cold visitor from an ad actually needs.

## The two grid rules

### 1. Post in threes, with a type tile in the middle of every trio

Instagram's grid is newest-first, so a row stays intact only while the number of
posts above it is a multiple of three. Every triptych eventually breaks.

**But because the type tiles sit at a constant interval, when the grid shifts,
every tile shifts by the same amount.** The stripe does not scatter — it
migrates one column. The rhythm survives; a sentence spelled across nine squares
does not.

So: **design for the rhythm, never for a fixed arrangement.** A type tile every
third post, counted continuously — not "every Wednesday", which drifts out of
phase the first time a post is skipped.

The count lives in `SCHEDULE.md`, which is generated. Never hand-edited.

### 2. Copy goes in the image, not only the caption

Every tile carries a **kicker** (Inter, uppercase, tracked) and a **headline**
(Cormorant Garamond), photo tiles included. That is what makes the grid read as
one system.

**Therefore every image needs a quiet region** — empty sky, a plain wall, an
out-of-focus background, a bare surface — for the type to sit in. This is a
requirement of the image prompt, not something fixed afterwards. An image
without a quiet region is rejected at QC no matter how good it is.

## Format mix

| Format | Roughly | Notes |
|---|---|---|
| Single image | Most days | The default |
| Carousel | 1–2 a week | Best for The Craft and The Case — a claim per card |
| Reel | ⚠ Deferred | Not until the publisher has posted stills reliably for a fortnight |
| Story | Daily, mirroring the feed post | Where the link lives |

## Posting time

⚠ To be set from the account's own Insights, not from a general best-practice
article. Interim default **09:00 Australia/Sydney**, on the reasoning that the
B2B audience is at a desk and the ads are running during business hours.

The cron is set 30 minutes early and the schedule script converts to UTC against
the offset in effect **on the posting date** — Canberra observes daylight saving,
and a hand-computed UTC time eventually posts at the wrong hour, in public, with
no undo.

## What we do not do

- Trend-chasing audio or formats that have nothing to do with flowers
- Reposting head office's national content
- Engagement bait — "comment YES", "tag someone who"
- Anything in `facts/compliance.md`'s never list
- Posting a fourth time about a design already shown three times, because a
  source photograph runs in exactly one post (`imagecheck.js` enforces this)

## How success is judged

Not by likes. By whether someone arriving from an ad, seeing nine tiles and
reading none of the captions, comes away knowing what this is and wanting it.

⚠ Baseline metrics not captured. Before the first generated post goes out,
record current follower count, average reach and profile-visit-to-link-tap rate,
so there is something to measure against. Otherwise in three months nobody can
say whether any of this worked.
