# facts/ — the source of truth

Every number, spec, claim and price that appears in a social caption or in an
image must trace to a line in this directory. Not to memory, not to the
website, not to something said in a chat session that has since ended.

## Why this exists

Floral Image Canberra has no product API. A Shopify store would be the source of
truth for a retailer; for a service business the equivalent has to be built, and
this is it: markdown, one file per claimable area, so that every claim has a
commit, an author and a date.

The failure this prevents is not lying. It is staleness. A figure that was true
when someone typed it into a caption, and false by the time the post went out.

## The rules

1. **A claim not in these files does not go in a post.** Not softened, not
   hedged, not "roughly" — cut it, or mark it ⚠ and ask Sam.
2. **Never infer a fact from what is generally true of the category.** Artificial
   flowers are usually polyester; ours are chosen per-flower to match how the
   real one feels, which is why silk appears where silk is right. The departures
   from the obvious version are the brand. They are also exactly what a
   confident guess gets wrong.
3. **Every file carries `verified` and `verified_by`.** A file older than the
   staleness window is treated as unverified and its numbers cannot be used
   until someone re-confirms them.
4. **⚠ marks an open question.** A ⚠ is useful. A smooth sentence covering a
   fact nobody checked is not.
5. **Approved wording is quoted exactly.** Where head office has approved a form
   of words ("allergy-free"), that wording is reproduced verbatim and not
   paraphrased into something stronger.

## Staleness window

**90 days.** ⚠ Proposed default, not yet confirmed by Sam. Prices, client
counts and review figures drift; design counts and material facts do not. If 90
days proves annoying, the right fix is a per-file window, not a longer global
one.

## Files

| File | Covers |
|---|---|
| `offer.md` | Trials, pricing, terms, what "no contract" means |
| `product.md` | The range, materials, lifespan, the reuse cycle |
| `service.md` | Coverage, run days, who turns up, response times |
| `proof.md` | Client counts, ratings, review counts — the contested numbers |
| `sustainability.md` | The 2019 LCA, the 80x figure, and its conditions |
| `people-and-images.md` | Who may appear, which assets are real, which are generated |
| `compliance.md` | What may never be said, and why |

## How to update

Edit the file, update `verified` and `verified_by`, commit with a message that
says what changed and who confirmed it. Do not update the date without actually
re-checking — a refreshed date on an unchecked number is worse than a stale one,
because it launders a guess into a fact.
