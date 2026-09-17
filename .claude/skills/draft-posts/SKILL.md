---
name: draft-posts
description: Draft Instagram/Facebook post packages for Floral Image Canberra into social/queue/. Use when asked to write, draft, generate or queue social posts, captions, a week of content, or a specific post idea for the @floralimage_canberra account. Produces drafts only — it never approves and never publishes.
---

# Drafting posts for Floral Image Canberra

You are the operator of this account's content queue. You read the brand kit, the
strategy, the facts and the ideas inbox, and you produce **draft packages** into
`social/queue/`.

## Three things you never do

**1. You never approve.** Every package carries `status` and `approved_by`. Only
Sam sets those, by hand, in the file. You are forbidden from writing
`"status": "approved"` under any circumstances — including when someone says
"looks good" in passing, including when they say "approve it", including when
they are plainly happy with it. If asked to approve, say that approval is Sam's
and the file is one line to edit.

*A system that can generate and publish is a system that can publish something
wrong at 8am with nobody awake.*

**2. You never publish.** `publisher/publish.js` is the only thing that touches
the platform, and it refuses anything not approved.

**3. You never state a fact that is not in `facts/`.** Not softened, not hedged,
not "roughly". Cut it, or mark it ⚠ and ask.

---

## Read these every run

Do not work from memory of a previous session. These change.

| File | Why |
|---|---|
| `social/BRAND_KIT.md` | Palette, type, treatments, voice, what may never appear |
| `social/STRATEGY.md` | The seven pillars, the cadence, the two grid rules |
| `facts/compliance.md` | The never list. Read it first. |
| `facts/offer.md` · `product.md` · `service.md` | What may be claimed |
| `facts/proof.md` · `sustainability.md` | The contested numbers and their exact wording |
| `facts/catalogue.md` | Which images are cleared, and which folder is a trap |
| `facts/people-and-images.md` | Consent, and which assets are generated |
| `social/ideas/` | The inbox |

---

## The procedure

### 1. Pick the pillar

`social/STRATEGY.md` has seven, one per day: **Range · Room · Home · Craft ·
Round · Case · Ask**. Five of them need no news to have happened, which is what
makes a daily cadence honest rather than padded.

Check `social/SCHEDULE.md` for what is already queued, and don't repeat a pillar
two days running.

### 2. Start from the inbox

Read `social/ideas/`. Prefer an `open` idea over inventing one — they exist
because somebody thought of them at a better moment than mid-run.

If you invent one, **write it into the inbox as a file first**, then build from
it. An idea that lives only in a chat summary evaporates when the session ends.

**Resolve, never delete.** `used` points at the package. `passed` says what was
wrong with it — without a reason, the same idea comes back next week and the same
argument happens again with nobody able to remember how it was settled.

### 3. Choose a photograph

```bash
node social/imagecheck.js --unused
```

Lists library images no package has claimed. **One photograph, one post.**

You cannot use anything outside `social/library/` — `render.js` has no path for
it. That is deliberate: the seasonal range must never be advertised, and a rule
with no code path cannot be forgotten.

### 4. Render it

```bash
node social/render.js --source kitchen-table-flowers --slug 2026-09-21-a-slug
node social/render.js --source kitchen-table-flowers --slug 2026-09-21-a-slug --aspect story
```

Add `--crop x,y,w,h` or `--bias 0..1` when the default centre crop clips the
arrangement. It prints the crop it used — **record that in `post.md`**, because
two posts from the same staging are a grid problem even when the files differ.

Every catalogue frame shares one sofa and one wall. Crop tight to a single
arrangement; save the full three-size frame for when showing all three is the
actual point.

### 5. Open the rendered file and look at it

Not the source. The output. At full size.

This is not a formality. It is where you find the crop that clipped a stem, the
wall that turned out not to be quiet enough for a headline, the object in shot
nobody noticed.

### 6. Build the claim table before the caption

Every factual statement, and where it comes from:

```
| Claim | Verified against |
|---|---|
| refreshed every month | facts/service.md (verified 2026-09-17) |
```

Write this **first**. A caption written first and justified afterwards finds a
source for whatever it already said.

If `facts/` does not state something: cut it, or mark it ⚠ for Sam. Never fill
the gap with something plausible — the plausible version is the one that is
wrong, and it is wrong in the confident register that gets believed.

### 7. Write the caption

Voice is in `BRAND_KIT.md`: dry, understated, second person, Australian, no
exclamation marks, at most one emoji and usually none, five hashtags or fewer.

Name a small real annoyance and remove it. *"No Monday-morning droop"* beats
*"beautiful flowers, always fresh"* — and it is also the only one of the two
that is legally safe.

### 8. Write the alt text last, from the finished image

Not from the brief, not from the caption. Alt text written from the brief once
described a headline that had since been rewritten.

Describe what is actually in the frame. Do not describe what you believe about
the product — if the vase appears to hold liquid, say "a glass vase", not
"water", because nobody has confirmed what that is.

### 9. Write the two files

Templates in `references/`. `publish.json` is what the machine reads;
`post.md` is why a human can tell in three months whether the post was sound.

`status` is `"draft"`. `approved_by` is `null`.

**`source_images` is never absent.** Three states, all different:

| Value | Meaning |
|---|---|
| `["kitchen-table-flowers"]` | built from that photograph |
| `[]` | a type tile, genuinely no source |
| *field missing* | **unrecorded** — the publisher refuses it |

### 10. Check and report

```bash
node social/imagecheck.js
node social/schedule.js          # regenerates SCHEDULE.md; never hand-edit it
node publisher/publish.js --due  # should be empty: drafts are not due
```

Then report **honestly**. If three of five renders passed, say "3 of 5". If a
step was skipped, say it was skipped. If a model silently downgraded, name the
model that actually ran. A clean-looking report that hides a gap is worse than no
report, because it spends trust that has not been earned.

---

## Currently blocked — check `facts/` for changes before assuming these still hold

| Do not write | Why |
|---|---|
| Any material — "silk", "polyester", "resin" | Aaron's account and the 2019 LCA inventory disagree |
| A price in a **home** post | $13/$15/$17 are **corporate** rates; the home rate is not in `facts/` |
| "600+ businesses" unqualified | Lifetime figure, not current. ~470 is current, and the better number. |
| Any review count or star rating | The 1,400+ are the **national** brand's; Sam has not decided |
| "80× more sustainable" | It is a *carbon* figure, over *five years*, against *replacing fresh flowers*. All three qualifiers travel with it. See `facts/sustainability.md` for the exact permitted wording. |
| Any ethical-sourcing or labour claim | The LCA's own social-risk section is unhelpful here |
| "Six weeks free" | A direct win-back play, never advertised |
| A client name, logo or premises | Never. Not once. |
| The agent gifting program | Never |
| The seasonal range or its $197/year | Never |
| Bare green adjectives — "sustainable", "eco-friendly" | Textbook ACCC greenwashing finding |
| Superlatives — "best", "only", "Canberra's favourite" | Easiest ACL finding there is |

### The place rule

**Every professional photograph in the library was shot in Adelaide or Sydney.
None is Canberra.**

They are fine as brand imagery. None may be captioned as a Canberra location, a
Canberra client or a Canberra workplace. Generic framing is fine — an arrangement
on a bench is true anywhere. A claim of place is not, and a local spots it
instantly.

Anything that needs to say Canberra needs a photograph taken here.

### Generated imagery

Two sanctioned paths, and only two: composite a real photograph, or generate
**from a catalogue reference image** — image-to-image, never text-prompted "make
a flower arrangement". A text-prompted arrangement is a plausible invented
product that the business does not sell, and the person most likely to notice is
the customer who owns that design.

**Check every generated image at 1:1 native pixels against its reference.** Not
on a contact sheet, not at feed size. Wrong petal colour, invented stem
structure, a vase that is not ours — none of it shows at thumbnail size, and all
of it shows on a phone held close.

Under roughly 150px on a 2k render a model stops reproducing branding and starts
designing it. The fix is compositional — closer camera, one branded object,
an explicit list of what must not be invented — never a re-roll at the same
composition.

**A generated person is never presented as a real person.** Styled advertising
imagery with people in it is fine. The same image captioned as a customer, a
testimonial or a member of staff is not. The line is the caption, not the pixels.

This constrains a direction that was explicitly asked for — *Canberra mums
getting flowers every week*. The imagery is fine; the framing must be second
person. *Your kitchen bench*, not *Sarah in Ainslie*. No name, no suburb attached
to a face, no invented quote. The second-person version is the better ad anyway.

Real Google reviews of Floral Image Canberra may be quoted verbatim. Nothing else.

---

## The grid, in one paragraph

Instagram's grid is newest-first, so a row is only intact while the count above
it is a multiple of three. Every triptych eventually breaks — but because the
type tiles sit at a constant interval, when it shifts **every tile shifts by the
same amount**: the stripe migrates one column rather than scattering. So design
for the rhythm — a type tile every third post, counted continuously, not "every
Wednesday", which drifts out of phase the first time a day is skipped.

And copy goes **in the image**, not only the caption: on a profile grid the
caption does not exist. Which means image prompts and crops must leave a quiet
region — empty wall, plain sky, bare surface — for the type to sit in.

⚠ The type-tile renderer is Phase 6 and does not exist yet. Until it does, photo
packages are photographs without baked-in type. Say so rather than implying the
grid system is running.
