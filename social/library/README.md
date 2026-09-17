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
| `catalogue/` | Drive → `refresh range 2026` | 2 |

## What is NOT here, and why

**The Drive connector refuses any file over 10MB.** That is a hard limit on the
tool, not a choice, and it excludes:

- **All the Adelaide print masters** (`PRINT-HI-5072_*`), 9–19MB each
- **All the Sydney shoot** (`*_Floral_image_SYD_*`), 12–32MB each
- **Five `Residential Photos` files**: `Flowers_on_buffet`, `flowers on buffet`,
  `Proteas_on_buffet_2`, `flowers on decorative table`, `Coffee table flowers2`
- **58 of the 60 catalogue designs** — these are only ~2.4MB and are perfectly
  reachable; the connector simply dropped its session partway through the pull

### Adding the rest

The fastest route by a wide margin is GitHub's own uploader, which takes a whole
folder by drag-and-drop:

1. github.com/artrajeus/floral-image-agents → **Add file → Upload files**
2. Drag `refresh range 2026` in, targeting `social/library/catalogue/`
3. Commit

Then re-run the manifest build so the hashes cover the new files. Two minutes,
against an hour of one-file-at-a-time pulls that a dropped session can interrupt.

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
