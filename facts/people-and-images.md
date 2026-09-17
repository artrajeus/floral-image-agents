---
verified: 2026-09-17
verified_by: Aaron (interview) + visual inspection
---

# People and images

## Consent

| Who | Status |
|---|---|
| People in the head-office photo shoot | ✅ Consented — "they're head office people so they're fine being in the ads" |
| Sam, Albert | ⚠ Not explicitly confirmed for social. Confirm before either appears. |
| Clients, client staff, client premises | ❌ **Never.** See `compliance.md`. |

## The existing photographs in `img/`

Head office organised the shoot and these are cleared for social use.

**Aaron, 2026-09-17: the flower handover image is the real one.**

| File | Status | Notes |
|---|---|---|
| `refresh-handoff.jpg` | ✅ **Real** — confirmed by Aaron | The handover across the reception desk |
| `van-crew.jpg` | ⚠ **Conflict — see below** | |
| `office-smile.jpg` | ❌ Treat as generated | |
| `trial-arrangement.jpg` | ❌ Treat as generated | Van wrap renders as a soft rainbow gradient; the real van carries a hard-edged triangular mosaic |

### ⚠ The van-crew conflict

Aaron's account is that one of the four is real and the rest are generated, which
makes `van-crew.jpg` generated. Visual inspection disagrees, with high
confidence: 1800px native, NSW plate `FPI-11Q`, a Maughan Thiem dealer frame,
reflections consistent across every body panel, and a crisp legible wordmark at
a size where a model would be redesigning it.

Both readings cannot be right. Recorded here rather than silently resolved —
**head office knows, and should be asked.** Interim: `van-crew.jpg` may be used,
because the worst case is that it is a generated image of a van, which carries no
consent exposure. It contains no person presented as anyone in particular.

### `office-smile.jpg` is the one that matters

On the live site it carries the alt text *"A client smiling beside her Floral
Image arrangement in a Canberra office."* On the evidence above she is generated,
which means **the site currently describes an AI person as a client.**

Two things follow:
1. **Fix the alt text on `welcome-back.html`** regardless of what head office
   says. She is not a client and the alt text must not say she is.
2. **The image does not run on social** while it is unresolved.

## Generated imagery

Permitted, under `compliance.md` rule 2, with one hard line: **a generated
person is never presented as a real person.** Styled advertising imagery with
people in it is fine. A generated person captioned as a customer, a client, a
staff member or a testimonial is not.

The test is the caption, not the pixels.

- ✅ A woman at a kitchen bench beside an arrangement, captioned *"Your kitchen
  bench, every month, without you thinking about it."*
- ❌ The same image captioned *"Sarah in Ainslie has hers refreshed monthly."*

## The van wrap

Reference: `img/van-crew.jpg`. A **hard-edged triangular mosaic** in full
spectrum, running from the rear across the sliding door, on a black Hyundai
Staria. Wordmark "FLORAL IMAGE" in a wide geometric face on bonnet and door
panel.

Any generated image containing the van must be checked at 1:1 against this
photograph. The wrap is precisely the kind of detail a model redesigns rather
than reproduces — and `trial-arrangement.jpg` appears to be an existing example
of exactly that.


## Where rendered images are hosted

**Decision, Aaron 2026-09-17: the repository**, served over GitHub Pages at
`social/rendered/<package-slug>/`.

The Graph API fetches a URL — it will not accept a local file — so every image
must be publicly reachable, stable, and serving a real `image/jpeg` content type
before it can be posted.

**The accepted tradeoff:** anything pushed is publicly viewable at a guessable
path from the moment of the push, drafts included, and git history keeps it even
after deletion. Nobody is going to go looking, and the alternative cost a new
service and a new credential for a risk that rounds to nothing.

**What follows from it:** do not push a rendered image until its package is worth
someone seeing. Render locally, QC at 1:1, then push — the push is publication.

⚠ **The social catalogue has not been received.** The Drive folder found on
2026-09-17 turned out to be the seasonal selection, which is never advertised.
Nothing image-related begins until the real one arrives. See `catalogue.md`.
