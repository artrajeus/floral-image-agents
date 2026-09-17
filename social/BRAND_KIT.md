# Brand kit — Floral Image Canberra

Read this every run, before writing a caption or generating an image.

This file describes what may and may not appear. It is not a mood board. Where
something here is marked ⚠ it is a gap, and a gap is filled by asking Sam, never
by choosing something plausible.

---

## Accounts

| | |
|---|---|
| Instagram | **@floralimage_canberra** |
| Facebook Page | **@floralimagecanberra** |
| Website / link target | **floralimagecanberra.com.au** |
| Approver | **Sam** — the only person who may set `status: approved` |
| Timezone | `Australia/Sydney` (observes DST — never hand-compute UTC) |

Head office runs a separate national account. We reference it for ideas and we
do not imitate it. The whole point of this account is that it is Canberra's.

⚠ `floralimagecanberra.com.au` has not been checked to confirm it resolves and
is the intended destination. Verify before the first link goes in a Story.

---

## Palette

Lifted from `styles.css` — the site and the feed must be the same system.

| Token | Hex | Use |
|---|---|---|
| Paper | `#fbf8f3` | The default ground. Most tiles. |
| Ink | `#161513` | Body text, headlines on paper |
| Muted | `#5d6257` | Secondary text only |
| Eucalypt | `#2f4a3a` | The brand green. Reversed grounds, buttons, kickers |
| Eucalypt deep | `#243a2d` | Hover / depth only |
| Eucalypt soft | `#edf0e6` | Tinted panels |
| Gold | `#f0b840` | Accent. Kickers on green. Sparingly. |
| Peony | `#e25b7a` | Accent. Sparingly. |
| Line | `#e4ddd0` | Rules and borders |

### The mosaic

```
#e8843a  #f0b840  #c8d34a  #2dc1a4  #5fc8d4  #6b9bd2  #c47bbf  #e25b7a
```

Eight equal bands, in that order, left to right. On the site it is a 5px ribbon.

**It is the brand's one piece of pure identity and it echoes the van wrap.** Note
that the *physical* van carries a hard-edged triangular mosaic in full spectrum,
not flat bands — see `img/van-crew.jpg`. The ribbon is the flat translation of
it. Do not let a generative model reinterpret either one.

---

## Typefaces

| Role | Face | Notes |
|---|---|---|
| Display | **Cormorant Garamond**, 600 | Headlines, numerals, the step numbers |
| Body | **Inter**, 400/600/700 | Everything else, including all-caps kickers |

Kicker style: Inter 700, uppercase, `letter-spacing: .18em`, 12px equivalent.

**Both must be vendored into the repo as `@font-face` files before any tile is
rendered.** Not linked from Google Fonts. A headless browser that cannot reach a
font silently falls back to a system face and renders a whole batch in the wrong
type without erroring. Verify the rendered output, not the stylesheet.

---

## The three treatments

Every asset lands in exactly one. ⚠ **Names proposed by Claude, not yet
confirmed by Sam** — the naming is a decision, and it should be theirs.

### 1. Paper
Ground `#fbf8f3`. Ink text. Mosaic ribbon at the top edge, full width, 5px
equivalent. The default, and the one the grid reads as "Floral Image".

### 2. Forest
Ground `#2f4a3a`. Paper text. Gold kicker. Used for the strongest single
statement in a trio — never two in a row, or the grid goes heavy and stops
feeling like flowers.

### 3. Photo
A photograph or generated image, full bleed, carrying the **same kicker and
headline treatment** as the type tiles. This is what makes the grid read as one
system rather than a mixed feed.

**Which means every image needs a quiet region** — empty wall, plain ceiling,
out-of-focus background, blank desk surface — sized and positioned for the type
to sit in. An image prompt that does not ask for a quiet region produces a
beautiful frame that cannot carry a headline, and it gets rejected at QC.

---

## Voice

⚠ **Inferred from the existing site copy, not confirmed.** Sam should confirm or
correct — this is the most consequential ⚠ in the file, because voice is the
thing a generator will smooth away first.

The register in `welcome-back.html` is distinctive and worth keeping:

> "No vases to clean, no Monday-morning droop, no one in the office quietly in
> charge of the flowers."

> "The honest bit — why is it free?"

> "We collect them with a smile. No card, no contract, no chasing."

What that is:

- **Dry. Understated. Slightly self-aware.** It describes a small annoyance
  precisely and then removes it.
- **Second person.** "Your front desk", "your kitchen bench".
- **Specific over superlative.** "No Monday-morning droop" beats "beautiful
  flowers, always fresh" — and it is also the only one of the two that is
  legally safe.
- **Australian.** Australian spelling. No exclamation marks.
- **It names the awkward thing.** "The honest bit" is the best line on the site
  because it does something no competitor's copy does.

What it is not: no hype, no "transform your space", no "elevate", no emoji
strings, no hashtag walls, no "✨". At most one emoji per caption and usually
none. Hashtags: five or fewer, at the end, genuinely relevant, Canberra-weighted.

---

## Never appears

Drawn from `facts/compliance.md`. This list is the short version; that file is
the authority.

- Client names, client logos, recognisable client premises, client staff
- The real-estate agent gifting program, in any form
- A generated person presented as real — named, quoted, or called a customer
- An invented testimonial
- Any blocked claim: "80× more sustainable", unqualified "600+", the national
  Trustpilot figures, "six weeks free"
- Superlatives: "best", "only", "Canberra's favourite", "number one"
- A product rendered without a catalogue reference image

---

## Logo

`img/logo-black.png` on Paper and Photo. `img/logo-white.png` on Forest.

⚠ No minimum size or clear-space rule supplied. Interim: never below 90px wide
on a 1080px tile, with clear space of at least the wordmark's cap height on all
sides. Replace with head office's real rule when someone asks them for it.

The wordmark is a wide geometric face and it is **never regenerated, redrawn,
or produced by an image model** — it is composited from the PNG, always.
