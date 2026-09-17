# The queue

One directory per package: `queue/YYYY-MM-DD-<slug>/`, containing exactly two
files.

## Two files, and the split is the point

### `publish.json` — what the machine reads

```jsonc
{
  "status": "draft",          // draft | approved | posted
  "approved_by": null,        // Sam, by name, with a date. Never set by Claude.
  "approved_on": null,
  "scheduled_utc": "2026-09-18T23:00:00Z",
  "pillar": "room",
  "audience": "b2b",
  "format": "image",          // image | carousel | reel | story
  "media": [{ "url": "https://…/1.jpg", "alt": "…" }],
  "caption": "…",
  "first_comment": "…",
  "link": "https://floralimagecanberra.com.au",
  "source_images": ["catalogue/conversation-starter-03.jpg"],
  "crosspost_facebook": true,
  "posted": { "ig_media_id": null, "fb_post_id": null, "story_id": null }
}
```

### `post.md` — what a human reads

Where the idea came from · the **claim table** · the consent record · what was
deliberately left out and why · the alt text · the compliance checklist.

This is the file that lets somebody come back in three months and know whether a
post was sound. `publish.json` says what went out; `post.md` says why it was
allowed to.

### The claim table

Every package carries one. No exceptions, including packages with no numbers in
them — an empty table is a statement that the copy makes no factual claims, and
that is worth recording.

```
| Claim | Verified against |
|---|---|
| from $13 a week | facts/offer.md (verified 2026-09-17) |
| hand made       | facts/product.md (verified 2026-09-17) |
```

If the source of truth does not state something, **cut it or mark it ⚠ for Sam.**
Never fill the gap with something plausible.

## `source_images` — three states, and they must stay distinguishable

| Value | Meaning |
|---|---|
| `["catalogue/x.jpg"]` | Built from that source photograph |
| `[]` | A type tile. Genuinely no source. |
| *field absent* | **Unrecorded.** A gap, reported as a gap. Never passed. |

Conflating the last two is how a duplicate check quietly passes on a queue it
cannot actually see.

## Why the check runs on sources, not outputs

Every tile is a composite — type, scrims and crop baked in. **Two posts built on
the same photograph produce two different files with two different names.** On
the system this is modelled on, comparing output files found 101 distinct files
and zero repeats, while the same photograph sat in two live posts.

`imagecheck.js` (Phase 2) enforces this on `source_images`, and runs before
anything queues.

## Status

- `draft` — Claude may create and edit this freely.
- `approved` — **Sam only.** Set by hand, with a name and a date, in the file.
  Claude is forbidden from setting this field under any circumstances, including
  when someone says "looks good" in passing.
- `posted` — set by the publisher, with the returned media IDs, committed back.

The publisher refuses to post anything that is not `approved`. A system that can
both generate and publish is a system that can publish something wrong at 8am
with nobody awake.
