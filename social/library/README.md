# The image library

Web-resolution copies of the cleared photography, committed so that building a
post does not depend on Google Drive being reachable — and so that
`imagecheck.js` can key on the actual bytes rather than trust a filename.

Long edge 2048px, quality 82, EXIF stripped, orientation applied on ingest.
`manifest.json` records each file's original title, source folder, original byte
count and **SHA-256 of the original**.

## What is here

| Folder | Source | Files |
|---|---|---|
| `residential/` | Drive → `Residential Photos` | 18 |
| `catalogue/` | Drive → `refresh range 2026` | **60 — the complete range** |

All 60 designs, `p20ts25001`–`p20ts25060`, no gaps. Verified: every catalogue file
came out **portrait**, so the EXIF Orientation 6 trap was handled on ingest rather
than carried into the repo. One was opened at full size to confirm the image is
upright and not merely the right shape.

## What is NOT here, and why

**The Drive connector refuses any file over 10MB.** That is a hard limit on the
tool, not a choice, and it excludes:

- **All the Adelaide print masters** (`PRINT-HI-5072_*`), 9–19MB each
- **All the Sydney shoot** (`*_Floral_image_SYD_*`), 12–32MB each
- **Five `Residential Photos` files**: `Flowers_on_buffet`, `flowers on buffet`,
  `Proteas_on_buffet_2`, `flowers on decorative table`, `Coffee table flowers2`
The catalogue is now complete. It took three passes — the connector dropped its
session twice mid-pull — but all 60 designs are in.

### Adding the print masters, if they are ever wanted

Nothing over 10MB can come through the connector, so the Adelaide and Sydney sets
have to be added by hand:

1. github.com/artrajeus/floral-image-agents → **Add file → Upload files**
2. Drag the folder in, targeting `social/library/adelaide/`
3. Commit, then rebuild `manifest.json` so the hashes cover them

They are the lowest priority in the library: they are print-resolution, they are
out-of-town, and so they can never carry a Canberra place claim. The 78 files here
cover everyday posting.

## The finding that made this worth committing

`New_flowers_1.JPG` in `Residential Photos` is **byte-identical** to
`P20TS25001.JPG` in the catalogue — verified by hash, not inferred from the
matching file size. Same photograph, two folders, two names that share nothing.

`New_flowers_2`–`_6` match `P20TS25002`–`006` by size and are almost certainly
the same. Several `Proteas_on_buffet_*` and `*_on_buffet` files match Adelaide
print masters by size too, which means parts of `Residential Photos` are a
curated selection of the Adelaide shoot — and therefore **cannot carry a Canberra
place claim** either.

Keyed on filenames, two posts could have run the identical photograph and
`imagecheck.js` would have passed them both. That is the exact defect the rule
exists to prevent, one level deeper than the rule anticipated. The fix is in the
check: where the manifest knows a file's bytes, the bytes are the key.

⚠ The size matches for `New_flowers_2`–`_6` and the buffet files are **not yet
hash-verified** — only `New_flowers_1` is. Confirm when those files are added.
