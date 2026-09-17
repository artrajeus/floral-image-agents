---
verified: 2026-09-17
verified_by: Claude (read from Drive, two files opened at full resolution)
---

# The catalogue

Two distinct sets of arrangements exist. **Confusing them is a live risk**, because
one must never appear in advertising — and it is the one a search finds first.

## ✅ The social catalogue — the regular refresh range

**`refresh range 2026`** — Drive folder `1WZbJywxH5unW7gRcdJLB963y4iCencUw`, at the
top level of My Drive. Uploaded by Aaron 2026-09-17 from head office.

| | |
|---|---|
| Designs | **60** |
| Naming | `P20TS25001.JPG` … `P20TS25060.JPG`, sequential, no gaps |
| Structure | Flat. No subfolders. |
| Duplicates | **None.** 60 files, 60 distinct design numbers. |
| Resolution | 4032 × 3024 stored, **3024 × 4032 as displayed** — see EXIF below |
| Camera | iPhone 15 Pro |

**This is the only set used for social content.**

### What each shot contains

**Three sizes of the same design, staged together in a real interior.** Verified by
opening `P20TS25001` (red gladioli, lilies, cream peonies) and `P20TS25042` (king
protea, pincushion, yellow eremurus, palm).

Consistent staging across both:

- Large arrangement — **left**, tall clear cylinder vase
- Medium — **right**, tall clear vase
- Small — **front centre**, short wide jar
- White oval coffee table on pale timber legs, grey two-seater sofa behind, pale
  off-white wall, grey carpet

⚠ **Confirm the size mapping with Aaron.** Large/medium/small almost certainly map
to **Wow Factor / Conversation Starter / Splash of Colour**, but nobody has said so,
and the whole pricing post depends on getting it right.

### Why this set is much better than a studio reference

These are not clinical product shots. They are already staged in a room, there is no
ID card in frame, and **the upper third of every frame is plain wall** — a genuine
quiet region, exactly what `BRAND_KIT.md` requires for the kicker and headline to sit
in. That requirement is usually the hardest thing to get out of a generated image,
and here it arrives for free.

The three-sizes-in-one-frame format also directly serves the pricing post: three
sizes, three names, three prices, one real photograph, nothing generated.

### ⚠ EXIF Orientation 6 — this will produce sideways images

Every file is stored **landscape 4032 × 3024** with **EXIF Orientation 6** (rotate
90° clockwise). Correct display is **portrait 3024 × 4032**.

Any tool that reads pixels without honouring the EXIF tag gets a rotated image and
does not error. That includes most image libraries by default, and it is the sort of
failure that survives all the way to a published post because the preview in the tool
that made it looked fine.

**So: normalise orientation on ingest, before anything else touches the file.** Then
verify by opening the result, not by trusting the step.

### ⚠ All 60 share one background

Same sofa, same table, same wall, in every shot. Distinct arrangements, identical
room.

Sixty posts of that set, uncropped, produce a grid that reads as a catalogue export
rather than a feed. The rule in `STRATEGY.md` — no source photograph in two posts —
holds each file to one post, but it does not catch *this*, because every file is
technically different.

Mitigations, in order of preference: crop tight to a single arrangement so the room
mostly leaves frame; vary the crop and orientation between posts; use the full
three-size frame **sparingly**, where showing all three is the point; and use
generation to place arrangements in genuinely different settings.

**Record the crop in `post.md`**, not just the file. Two posts from one file are
still one file too many, but two posts from the same *staging* are a grid problem
even when the files differ.

## ❌ The seasonal selection — NEVER advertised

**`AA Mitchell Available Flowers`** — Drive folder `1OGhceWgwKCJT9wTzjicN8WpC_poFEUSR`,
subfolders `Small`, `Medium and Large`, `BRAND NEW ARRANGEMENTS`.

**Aaron, 2026-09-17:** *"that is the one that we use for the seasonal selection which
we do not advertise. those are old arrangements that we sell a subscription for $197
per year. we do not advertise those at all and we will not advertise them."*

**Hard exclusion. No image from this folder tree is used as a reference, a composite
source, or content, in any post, ever.**

Including — especially — the subfolder called `BRAND NEW ARRANGEMENTS`. That label is
"new" relative to the seasonal set, not to the refresh range. It is precisely what
looks like the right folder to someone skimming, and on 2026-09-17 it was provisionally
recorded as the catalogue before Aaron corrected it. **The folder is named here so
that the next run does not repeat the mistake.**

The $197/year seasonal subscription is likewise not a social offer. See `compliance.md`
section 4.

## Keying

`source_images` records the **design number** — `P20TS25042` — not a path and not a
Drive file ID. It survives renames, re-uploads and folder reorganisation, which no
path does.

The seasonal set held six designs as two files each, identical sizes, different Drive
IDs. `refresh range 2026` has no duplicates today, but a future re-export from head
office may, so the rule stands regardless.

## Where references live

**Drive, not the repository.** Working reference material, and the repo is public.
Only rendered social images are committed.
