# Your kitchen bench, every month

**Status: draft. Not approved. Sam approves, by name, in `publish.json`.**

The first real post. Its job is to prove the publisher works end to end — feed
post, first comment, Story, Facebook crosspost, media IDs committed back — not to
demonstrate the finished design system. The grid treatment (kicker and headline
baked into the image) arrives with the render pipeline in Phase 6. This one is a
photograph, deliberately.

## Where it came from

`social/ideas/2026-09-17-nobody-in-charge-of-the-flowers.md`, turned around from
B2B to B2C. The original line is about offices; the home version is the same
observation — a small, real, unglamorous annoyance that nobody else's copy names.

## The image

| | |
|---|---|
| Source | `kitchen table flowers.jpg`, Drive → `Residential Photos` |
| Original | 2500 × 1667, professional lifestyle photography |
| Feed | 1080 × 1350, cropped `1333×1667+380+0`, resized, quality 88, EXIF stripped |
| Story | 1080 × 1920, the feed image centred on Paper `#fbf8f3` |
| Generated? | **No.** No AI involvement at any stage. |

Crop recorded, not just the filename: two posts from one *staging* are a grid
problem even when the files differ (`facts/catalogue.md`).

Both files were opened at full size after rendering and before the alt text was
written. The crop keeps the arrangement as the hero, leaves the wall clear in the
upper left, and lets the cooktop anchor the frame as a real kitchen rather than a
studio.

## Claim table

| Claim | Verified against |
|---|---|
| "every month" | `facts/service.md` — monthly refresh, both business and home |
| "a different design each time" | `facts/product.md` — confirmed framing, Aaron 2026-09-17 |
| "we bring the new one and take the old one away" | `facts/product.md` — the refresh cycle |
| "No water to change" | `facts/product.md` — practical benefits |
| "Nothing wilting by Thursday" | `facts/product.md` — never wilt |
| "Hand made" | `facts/product.md` — every arrangement is hand made |
| "allergy-free" | `facts/product.md` — head office approved, **verbatim wording** |
| "good for five years" | `facts/product.md` — 5-year lifespan |
| "homes and workplaces across Canberra and the surrounding region" | `facts/service.md` — coverage |

No number in this post comes from memory or from the website. Every line above
traces to a file with a commit and a date.

## Left out on purpose

**The price.** The obvious closing line is "from $13 a week" — and it cannot run
here. `facts/offer.md` records $13 / $15 / $17 as **corporate** refresh rates, and
marks home pricing ⚠ not supplied. A B2C post carrying a B2B price is exactly the
kind of small, confident, wrong detail this system exists to stop.

⚠ **Aaron: what is the home rate?** Once it is in `facts/offer.md` the price can
go into the next home post.

**The location.** The caption never says this kitchen is in Canberra, because
nobody has confirmed where the photograph was taken. It is written in the second
person — *your* kitchen bench — which is both safer and the better ad. The first
comment makes a claim about *the service* covering Canberra, which is true, rather
than about *the photograph*, which is unverified.

**Reviews, "600+", and the 80× carbon figure.** Blocked or conditional, and none
of them belongs on a first post. See `facts/proof.md` and `facts/sustainability.md`.

**Materials.** No material is named. Aaron's account (silk, matched per flower) and
the 2019 LCA inventory (polypropylene, polyester, resin) disagree, and until head
office resolves it no caption names one.

## Consent

No people in either image. No client named, no client premises, no recognisable
third-party brand beyond an incidental cookbook on a shelf. Nothing here needs a
release.

## Alt text

**Written last, from the finished image, not from the brief.**

> A small arrangement of pale pink garden roses and deep pink tulips with green
> foliage, in a low round glass vase on a white kitchen benchtop. A grey
> herringbone tile splashback and a red cookbook stand behind it; a gas cooktop
> fills the bottom right.

It does not mention water. The vase appears to hold liquid; that is part of the
design, and describing it as water would state something about the product that
nobody has confirmed.

## Compliance checklist

- [x] No client name, logo or premises
- [x] No agent gifting
- [x] No generated person, and no person at all
- [x] No blocked claim (600+, Trustpilot, 80×, six weeks, any material)
- [x] No superlative — no "best", "only", "Canberra's favourite"
- [x] "allergy-free" in its approved wording, not escalated
- [x] No place claim attached to an unverified photograph
- [x] No price, because the home price is not in `facts/`
- [x] Alt text written from the finished image
- [x] `source_images` recorded (not absent, not empty)
- [x] `imagecheck.js` passes
- [ ] URL returns 200 and `image/jpeg` — **cannot be checked until merged to `main`**
- [ ] Approved by Sam

## Before this can post

1. **Merge to `main`.** GitHub Pages serves `main` (`deploy.sh` pushes there), so
   the image URLs 404 until then. The Graph API fetches the URL itself, and a
   404 fails with a message that never mentions URLs.
2. **Credentials.** `publisher/SETUP.md`, then `node publisher/whoami.js`.
3. **Dry run.** `node publisher/publish.js --dry-run --package social/queue/2026-09-19-your-kitchen-bench`
4. **Sam approves** — sets `status: "approved"` and `approved_by: "Sam"` by hand.
5. **Post**, with both of us watching.
