---
verified: 2026-09-17
verified_by: Claude (read directly from the connected Google Drive)
status: ⚠ Aaron to confirm this is the intended folder
---

# The catalogue

**No upload is needed.** The Google Drive connector is authorised against
`floralimagecanberra@gmail.com`, and the catalogue is already reachable.

## Location

**`AA Mitchell Available Flowers`** — Drive folder `1OGhceWgwKCJT9wTzjicN8WpC_poFEUSR`

| Subfolder | Drive ID | Counted |
|---|---|---|
| `Small` | `1T0mw-msa4HDUlqbiYIhFPWhF9MATa9FI` | 43 files |
| `Medium and Large` | `1P1qwY2hBSPVxDkz9zlJcEWb8Eid3IQ5L` | 30+ (not fully paginated) |
| `BRAND NEW ARRANGEMENTS` | `1uKrz_zdGsTfQnyoSnlZvVLCVEW0NsAdO` | 15 files |

⚠ Confirm with Aaron that this is the folder he meant before it is treated as
canonical. The naming and contents match his description — "some home images as
well as business ones", plus the newest arrangements — but nobody has said so.

## What the files are

Studio reference shots. One arrangement, plain white backdrop, white cloth
beneath, lit flat, with a **numbered ID card in the frame** giving the design
number. Verified by opening `BRAND NEW ARRANGEMENTS/3.JPG` at full size.

**They are references, not content.** The numbered card, the clinical lighting
and the crumpled cloth mean none of them can be posted as-is. What they are is
exactly the right input for the sanctioned generation path in
`compliance.md` rule 2: image-to-image from a real arrangement, never a
text-prompted invention.

## Naming

Design number first, then a size and view suffix:

```
3.JPG           915-Front.jpg      459-S-Front.png      109.jpeg
```

`-S-` appears to mark the small version of a design. ⚠ Unconfirmed.

## ⚠ The catalogue contains duplicate files, and this breaks the duplicate check

The `Small` folder holds **two separate files for the same design** in at least
six cases — `915-Front.jpg`, `804-Front.jpg`, `911-Front.jpg`, `750-Front.jpg`,
`777-Front.jpg` and `786-Front.jpg` each appear twice, under different Drive IDs,
at identical file sizes.

**So `imagecheck.js` must key on the design number parsed from the filename, not
on the filename and not on the Drive ID.** Keying on either lets the same
arrangement appear in two posts while the check passes — which is the same defect
that rule 6 exists to prevent, arriving from a direction the original rule did not
anticipate. The check is on the *design*, because the design is what a customer
recognises.

⚠ The duplicates may also be genuinely different photographs of the same design.
Worth an eye before the rule is written into code.

## How references are used

1. Pull the reference from Drive by design number.
2. Generate with it as an image reference — never text-prompted.
3. **QC at 1:1 native pixels against that same reference.** Not on a contact
   sheet, not at feed size.
4. Record the design number in the package's `source_images`.

## Where the references live

**Drive, not the repository.** They are working reference material, several
hundred files, and the repo is public. Only *rendered* social images are
committed, per `people-and-images.md`.

The stable identifier in a package is the **design number** — it survives file
renames, duplicate copies and folder reorganisation, which no path does.
