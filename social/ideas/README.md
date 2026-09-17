# The ideas inbox

One idea, one file, `YYYY-MM-DD-slug.md`. Adding is cheap. **Deleting is not
allowed.**

## Front matter

```yaml
---
status: open | used | passed | parked
pillar: range | room | home | craft | round | case | ask
audience: b2b | b2c | both
created: YYYY-MM-DD
resolved: YYYY-MM-DD        # when status leaves `open`
package: queue/YYYY-MM-DD-slug   # `used` only
reason:                     # `passed` only — what was wrong with it
blocker:                    # `parked` only — what it is waiting on
---
```

## Why nothing is ever deleted

An idea is **resolved**, never removed.

- `used` points at the package it became, so a finished post traces back to
  where it came from.
- `passed` says what was wrong with it. **This is the one that matters.** A
  passed idea with a reason stops the same idea coming back next week. A passed
  idea without one guarantees it does — and worse, guarantees the same argument
  again, with nobody able to remember how it was settled the first time.
- `parked` names the blocker, so when the blocker clears, somebody knows what
  to go and unpark. Most of the current parked ideas are waiting on one thing:
  a sourced figure in `facts/`.

## Ideas that surface mid-run get written here

Not into a chat summary. A session ends and takes its summary with it; the
inbox survives. If a good idea comes up while building something else, it costs
thirty seconds to write a file and it is the difference between having a queue
in six months and starting from nothing again.

## An idea is not a post

An idea is a reason to make something. It becomes a post only when a package is
built from it, and only Sam approves that package.
