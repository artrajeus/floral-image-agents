---
verified: 2026-09-17
verified_by: Claude (read from Drive; five files opened at full resolution)
---

# Image sources

Everything the generator may draw on, and everything it must not. **Read this
before selecting any image.**

Aaron's direction, 2026-09-17: *"use those more primarily for posts, and then use
some of the catalog stuff just to say 'look, this is what we've got.'"*

So the real photography leads. The catalogue is for showing the range.

---

## 1. `Residential Photos` — primary B2C source

Drive `1Psd9cNw6wzgz72hSgAMzz992VYGpzGeH` · **31 files**

Professionally shot lifestyle photography in real homes, named by placement:

`kitchen table flowers` · `Flowers on bench` · `maroon flowers on bench` ·
`flowers on buffet` · `Proteas_on_buffet_1–3` · `coffee table flowers 1–2` ·
`Lounge room flowers` · `TV unit flowers` · `Bedside table flowrs` ·
`entranceway flowers` · `flowers in bathroom` · `Bathroom vanity flowers` ·
`orange lily table centrepiece` · `flowers on decorative table` ·
`Flower Delivery 1–4` · `flowers being refreshed` · `lady holding flowers` ·
`FLORALIMAGE_HOME_WebRes_130`

**Verified by opening two:**

- **`kitchen table flowers.jpg`** — 2500×1667. A small pink rose and tulip
  arrangement on a white benchtop beside a gas cooktop, herringbone splashback,
  wine fridge behind. Warm, real, aspirational. **The upper-left wall is a clean
  quiet region** for the kicker and headline. This is the B2C pillar in one frame.
- **`flowers being refreshed.jpg`** — 2500×1667. A handover at a front garden: a
  man in a Floral Image gilet passing an arrangement to a woman in a black
  cardigan, brick house and hedge behind. Sunlit, natural, entirely real.

**This is the strongest material in the whole library.** No generation needed for
most B2C posts — these are already better than anything a model would produce.

### ⚠ Consent, before any of these run

`flowers being refreshed.jpg` and `lady holding flowers.jpg` contain
**identifiable people**, and the folder mixes provenance — some files date from a
2020 head-office shoot, others from 2026.

Aaron has said head-office shoot people are cleared. **That has not been
established for these two specifically**, and the woman in the handover reads as
a client at her own home rather than a model. Confirm who she is and whether a
release exists before either appears. The rest of the folder has no people in it
and is unaffected.

---

## 2. `Photos for marketing` — primary B2B / hero source

Drive `1PNVK9HYRy8sXmZRPclrDQPW_61IQSEYP` · **60+ files**

Two professional sets, plus a handful of catalogue duplicates:

| Pattern | What it is | Size |
|---|---|---|
| `PRINT-HI-5072_NNN.jpg` | High-resolution print masters | 9–19 MB |
| `NNNN_Floral_image_SYD_6thAUG2025.jpg` / `7thAUG2025` | A **Sydney** shoot, August 2025 | 12–32 MB |
| `P20TS250NN.JPG` | Copies of catalogue files — ignore, use `refresh range 2026` | 2.5 MB |

### ⚠ The Sydney shoot is not Canberra

Files marked `_SYD_` were shot in Sydney. They are Floral Image brand imagery and
fine to use as such.

**They must never be captioned as a Canberra location, a Canberra client, or a
Canberra workplace.** The entire premise of this account is that it is local; a
Sydney office presented as a Canberra one is the sort of thing a local recognises
instantly, and it costs exactly the credibility the account is being built for.

Generic framing is fine — a reception desk is a reception desk. A claim of place
is not. If a post needs to say Canberra, it needs a photograph taken here.

⚠ Provenance of the `PRINT-HI-5072_*` set is unconfirmed. Ask head office where it
was shot before any of it carries a place claim.

---

## 3. `refresh range 2026` — the design catalogue

Drive `1WZbJywxH5unW7gRcdJLB963y4iCencUw` · **60 designs**, `P20TS25001`–`P20TS25060`

Flat, sequential, no duplicates. Each frame shows **all three sizes of one
design** on a white coffee table with a grey two-seater behind:

| Position | Size | Product | Price |
|---|---|---|---|
| Left | Large | **Wow Factor** | $17/week |
| Right | Medium | **Conversation Starter** | $15/week |
| Front centre | Small | **Splash of Colour** | $13/week |

**Confirmed by Aaron 2026-09-17.**

**Used for range and pricing posts** — "this is what we've got", "three sizes,
three prices" — and as the image-to-image reference when a specific design must be
rendered. Not the primary source for lifestyle content.

### ⚠ EXIF Orientation 6 — will produce sideways images

Stored **landscape 4032 × 3024**, correct display **portrait 3024 × 4032**. A tool
that reads pixels without honouring the tag returns a rotated image **and does not
error**. Normalise orientation on ingest, before anything else touches the file,
then verify by opening the result.

(The `Residential Photos` files carry no EXIF orientation tag and need no
normalisation — which is exactly why the rule has to be applied per-file rather
than assumed for the library.)

### ⚠ All 60 share one background

Same sofa, same table, same wall. Sixty posts of that room reads as a catalogue
export, not a feed. Crop tight to a single arrangement; reserve the full
three-size frame for when showing all three is the point. **Record the crop in
`post.md`**, not just the filename — two posts from the same staging are a grid
problem even when the files differ.

---

## ❌ Excluded — never advertised

### `AA Mitchell Available Flowers`
Drive `1OGhceWgwKCJT9wTzjicN8WpC_poFEUSR` — subfolders `Small`,
`Medium and Large`, `BRAND NEW ARRANGEMENTS`.

**Aaron, 2026-09-17:** *"that is the one that we use for the seasonal selection
which we do not advertise. those are old arrangements that we sell a subscription
for $197 per year. we do not advertise those at all and we will not advertise
them."*

Note the subfolder called `BRAND NEW ARRANGEMENTS`. That label is "new" relative
to the seasonal set, not to the refresh range, and on 2026-09-17 it was
provisionally recorded as the catalogue before Aaron corrected it. **Named here so
the next run does not repeat it.**

### `AA Seasonal Selection Available Flowers`
Drive `1jF0PpBea1tc_y4pVsIsyBoZQZvFiW_Tm`

⚠ Not examined. The name puts it squarely in the excluded seasonal set, so it is
excluded by default. **Confirm with Aaron**; treat as off-limits until he says
otherwise.

### Also not examined, status unknown — do not use
`A Photos that need editing` · `Available Smalls 15/3` ·
`Current available small arrangements`

The last two read as seasonal small-arrangement availability lists. **Anything not
positively cleared above is not used.**

---

## Keying

`source_images` records a stable identifier:

- Catalogue → the design number, `P20TS25042`
- Photography → the filename stem, `kitchen table flowers`

Not a path, not a Drive file ID. The seasonal set held six designs as two files
each under different IDs; a check keyed on either would let one arrangement run
twice and still pass.

## Where they live

**Drive, not the repository.** Working reference material, and the repo is public.
Only rendered social images are committed.
