---
verified: 2026-09-17
verified_by: Aaron (interview)
---

# Compliance — what may never be said

Every rule here exists because of a specific exposure. The reason matters more
than the rule, because a rule without its reason gets argued away in six months.

## 1. No client names. Ever.

No client business name, no client logo, no recognisable client premises, no
identifiable client staff. In any post, any image, any caption, any comment, any
Story.

**Decided by Aaron, 2026-09-17.**

`winback-data.js` in this repository contains a list of named current clients —
dental practices, medical centres, law firms — used as social proof on a
`noindex` page. **None of that list may cross into social.** Naming a business
as your client in advertising without their agreement is a real exposure in
Australia, and more so for healthcare practices, which have their own
advertising rules on top.

## 2. AI never draws the product, unreferenced.

Two sanctioned paths, and only two:

- **Composite or edit a real photograph** of a real arrangement.
- **Generate from a reference image** of an actual arrangement in the
  catalogue — image-to-image, never text-prompted "make a flower arrangement".

A text-prompted arrangement is a plausible, generic, invented product. It is not
what the client receives, and the person most likely to notice is the customer
who owns that design.

**Every generated image is checked at 1:1 native pixels against its reference
before it enters a package.** Not on a contact sheet, not at feed size. Wrong
petal colour, invented stem structure, a vase that is not ours — none of it is
visible at thumbnail size, and all of it is visible on a phone held close, or in
a screenshot, or on a product page later.

**Under roughly 150px on a 2k render, a model stops reproducing branding and
starts designing it.** The fix is compositional — bring the camera closer, put
one branded object in frame, list explicitly what must not be invented. It is
never a re-roll at the same composition.

## 3. AI people are never presented as real people.

See `people-and-images.md`. The line is the claim, not the pixels.

This constrains a content direction that was explicitly requested: *"local posts
about how Canberra mums are getting flowers delivered every week."* The imagery
is fine. The framing must be **second person** — "your kitchen bench" — not a
third-person claim about a person who does not exist. No name, no suburb
attached to a face, no invented quote, no "meet".

Real Google reviews may be quoted verbatim. See `proof.md`.

## 4. Real-estate agent gifting stays off social.

**Decided by Aaron, 2026-09-17.** The program, the agents, the agencies and the
gifting mechanic are not social content in any form.

## 5. Claims that are blocked pending evidence

| Claim | Why blocked |
|---|---|
| "80× more sustainable over 5 years" | Quantified environmental claim, unsourced. Greenwashing is a current ACCC enforcement priority. |
| "600+ businesses" unqualified | Lifetime figure presented as current. Misleading as worded. |
| "5★ Trustpilot · 1,400+ reviews" on Canberra material | National brand's reviews, Canberra context. |
| "Six weeks free" | Contradicts the stated 1-week/2-week trial. Unresolved. |

## 6. Claims that are approved, in their exact wording

- **"allergy-free"** — head office approved. Never escalated to
  "hypoallergenic", "safe for asthmatics", or anything clinical.
- **"from $13 a week"**, **"no contract, cancel any time"**.
- **Hand made.** **5 years.** **Hundreds of designs.** **No water, never wilt.**

## 7. Free-offer presentation

The trial is free with a condition — if the client does not continue, we collect
the arrangement. Under Australian Consumer Law the condition travels with the
word "free": same image or same caption, not a follow-up post, not a reply in
the comments, not only on the landing page.

## 8. Health, environmental and superlative claims

No claim about health, allergies, air quality, wellbeing or environmental impact
beyond the exact approved wording above. No "best", "only", "number one",
"Canberra's favourite" — unsubstantiated superlatives are the easiest ACL
finding there is.

## 9. Scope of every figure travels with it

A national figure is labelled national. A lifetime figure is labelled lifetime.
An estimate is not presented as a count. This single rule would have prevented
both of the contested numbers in `proof.md`.
