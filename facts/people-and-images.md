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

Head office organised the shoot; Aaron's understanding is that these are cleared
for social use. Aaron also believes **one of the four is a real photograph and
three are AI generated**, without being sure which.

Visual inspection at full resolution, 2026-09-17:

| File | Assessment | Confidence |
|---|---|---|
| `van-crew.jpg` | **Real.** 1800px, NSW plate `FPI·11Q`, Maughan Thiem dealer frame, consistent reflections across body panels, crisp legible wordmark. | High |
| `office-smile.jpg` | **Probably real.** Natural depth-of-field falloff, wrist tattoo, plausible fabric and hair detail. | Medium |
| `refresh-handoff.jpg` | **Uncertain, leaning generated.** Low resolution, faces slightly plastic. | Low |
| `trial-arrangement.jpg` | **Leaning generated.** The van wrap renders as a soft rainbow gradient; the real van in `van-crew.jpg` carries a hard-edged triangular mosaic. A model without the wrap in reference redesigns it — the documented failure mode. | Medium |

**This is an assessment, not a determination.** Head office knows. Ask them.

### The live-site problem

`welcome-back.html` gives `office-smile.jpg` the alt text *"A client smiling
beside her Floral Image arrangement in a Canberra office"*. If that image is
generated, the site is currently presenting an AI person as a real client. Fix
the alt text regardless — she is not a named client and the alt text should not
imply she is.

### Until head office confirms

- `van-crew.jpg` — cleared for social.
- The other three — **not used in any post**, because a post is a fresh
  publication and republishing an unverified generated person as real is the
  exposure, not the original shoot.

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
