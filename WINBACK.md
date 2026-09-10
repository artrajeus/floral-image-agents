# Win-back campaign — `welcome-back.html`

One landing page that reads the URL and rebuilds itself for whoever clicked: a dentist from
Braddon sees **the dentists in Braddon who use Floral Image**, then **their Braddon neighbours**,
then the free six-week trial form with their details already filled in. No page is generated per
segment; the page assembles the right one on the fly from `winback-data.js`, so a new export from
the CRM is one command away from being live.

**Live:** https://artrajeus.github.io/floral-image-agents/welcome-back.html

## The pieces

| File | What it is |
|---|---|
| `welcome-back.html` | The landing page (hero → businesses like yours → your neighbours → why come back → how the trial works → the honest bit → form → FAQ) |
| `winback.js` | Reads the URL, picks the right clients to show, personalises the copy, posts the form |
| `winback-data.js` | **Generated.** The 427 current clients as `{name, industry, suburb}` plus the industry and region tables. Business names only, never contact details. |
| `tools/build-winback.py` | Rebuilds `winback-data.js` and the Klaviyo link sheet from a fresh CRM export |
| `tools/industries.json` | The 26 industry slugs and their labels (`i=` values) |
| `tools/regions.json` | Canonical suburb spellings grouped into 13 regions (`s=` values) |
| `apps-script/Code.gs` → `handleWinback_` | Backend: writes to the **Win-back Trials** tab of the Sheet, emails the team, confirms to the client |

## How a link works

```
welcome-back.html?i=dental&s=braddon&b=Braddon+Smiles&n=Peter&src=winback-email
```

| Param | Meaning | Where it shows up |
|---|---|---|
| `i` | industry slug (see `tools/industries.json`) | "Dental practices in Braddon who use Floral Image", the trust count, form payload |
| `s` | suburb (any spelling; matched against `tools/regions.json`) | neighbours section, headline, form placeholder |
| `b` | their business name | eyebrow, lede, form heading, prefilled form |
| `n` | first name | "Hi Peter," and the prefilled form |
| `e` | email (optional) | prefilled form |
| `src` | tracking tag | recorded on the submission (default `winback-email`) |

**Matching falls back gracefully.** For the "businesses like yours" section it tries, in order:
same industry + same suburb → same industry + same region (e.g. Inner North) → same industry
anywhere in Canberra → any workplace nearby. The neighbours section tries same suburb → same
region, and hides itself if there's nothing to show. `i=home` switches to the home-customer copy
and shows the businesses near them instead. No params at all gives a sensible generic page.

Try a few: [dentist in Braddon](https://artrajeus.github.io/floral-image-agents/welcome-back.html?i=dental&s=braddon&b=Braddon+Smiles&n=Peter) ·
[law firm in Deakin](https://artrajeus.github.io/floral-image-agents/welcome-back.html?i=legal&s=deakin) ·
[café, suburb unknown](https://artrajeus.github.io/floral-image-agents/welcome-back.html?i=hospitality) ·
[home client in Gowrie](https://artrajeus.github.io/floral-image-agents/welcome-back.html?i=home&s=gowrie&n=Jess) ·
[nothing known](https://artrajeus.github.io/floral-image-agents/welcome-back.html)

## What the data says (export of 10 Sep 2026)

- 2,070 deals: 478 closed won, 1,592 closed lost. After removing won accounts flagged lost or
  collected, home customers and duplicates, **427 current business clients** are shown as social
  proof, **401 of them with a suburb**.
- **1,587 lost contacts, 1,392 with an email.** Every one has a personal URL in the link sheet.
- Match quality for the emailable lost contacts: 420 land on an exact industry-and-suburb page,
  336 on an industry-and-region page, 463 on an industry-only page (their suburb is unknown or has
  no client in that industry), 170 are home customers.
- Biggest lost segments with strong social proof: law firms in the City (8 current, 20 lost),
  medical in Deakin (14 current, 16 lost), hospitality in Kingston and the City, real estate
  (32 current, 89 lost), hair and beauty (19 current, 158 lost), schools (29 current, 107 lost).

Every business was tagged with an industry and suburb by name, email domain and web research.
About 300 lost businesses still have no suburb (the CRM had none and it couldn't be found
quickly); they get the industry-only page, which still shows their peers across Canberra.
The full tagging with confidence notes is in `winback-classified.json` (kept out of the repo).

## Sending it from Klaviyo

1. **Import `winback-links.csv`** (kept out of the repo; it holds emails) as a new list
   *Win-back 2026*. Map `Email`, `First Name`, `Last Name`, `Organization`, and keep every
   `wb_*` column as a custom profile property. The one that matters is **`wb_url`**.
2. **Build the campaign** with the copy below. The button links to
   `{{ person|lookup:'wb_url' }}`. Use `{{ person|lookup:'wb_industry_label'|default:'workplaces' }}`
   and `{{ person|lookup:'wb_suburb'|default:'Canberra' }}` for merge text.
3. **Segment before sending.** Suggested splits, all from the CSV columns:
   - `wb_kind = business` and `wb_lost_year ≥ 2020` first (freshest memory, ~600 contacts).
   - `wb_match_tier = industry+suburb` gets the "your neighbours" subject line; everything else gets
     the industry subject line.
   - `wb_kind = person` (home customers) gets the home email.
   - Skip anyone already on a current client list.
4. **Send in waves** of ~150 a week so the team can phone every trial request within a day, on
   the run days for that region (the CSV has `wb_region`).
5. Trial requests land in the Sheet tab **Win-back Trials** and in canberra@floralimage.com,
   with the segment and source on every row.

## Email copy

**Subject lines** (pick by `wb_match_tier`):

- industry+suburb: `{{ wb_suburb }}'s {{ wb_industry_short }} have flowers again. Want six weeks free?`
  e.g. *Braddon's dentists have flowers again. Want six weeks free?*
- industry / industry+region: `Six weeks of designer flowers, on us — welcome back, {{ organization }}`
- home: `{{ first_name }}, six weeks of flowers at home, on us`

**Preview text:** *It's been a while. Here's who near you has them now, and a no-strings six-week trial.*

**Body (business):**

> Hi {{ first_name|default:'there' }},
>
> A while back, {{ organization|default:'your workplace' }} had Floral Image flowers on the desk. We'd love another go at earning that spot.
>
> A lot has changed since. Our current range is premium, life-like and allergy-free, refreshed every month by our Canberra team, and we now style 600+ workplaces across the region, including a few {{ wb_industry_short|default:'businesses' }} you'll recognise in {{ wb_suburb|default:'your part of town' }}.
>
> So here's the offer: **six weeks of designer flowers, delivered and styled, free.** No card, no contract, nothing that rolls over. At the end we ask one question: keep them, or collect them?
>
> **[See who near you has flowers, and start your free six weeks →]({{ wb_url }})**
>
> Warmly,
> Aaron and the team, Floral Image Canberra
> Mitchell ACT · canberra@floralimage.com
>
> *P.S. If you left because of price or a bumpy delivery, tell us in the notes on the page. That's exactly what we want to fix.*

**Body (home customer):**

> Hi {{ first_name|default:'there' }},
>
> You had Floral Image flowers at home for a while, and we'd love to bring them back.
>
> Our van is already in {{ wb_suburb|default:'your suburb' }} every month, so here's a simple offer: **six weeks of designer flowers at home, on us.** We deliver, we swap them for something new along the way, and at the end you decide whether to keep them coming.
>
> **[Start my free six weeks →]({{ wb_url }})**
>
> Warmly,
> Aaron and the team, Floral Image Canberra

**Reminder (7 days later, non-clickers only):** subject *Still six weeks free, {{ first_name }}* with the same button and two lines: "No card, no contract, and we collect them if it's not for you. Here's the page again."

## Rebuilding after a new CRM export

```bash
python3 tools/build-winback.py \
  --xlsx ~/Downloads/Total_Closed_Won_and_Lost.xlsx \
  --classified ~/Drive/winback/winback-classified.json \
  --out-dir ~/Drive/winback
./deploy.sh "Refresh win-back data"
```

The classification file is keyed to row order in the export, so a new export with new rows needs
the new rows tagged (ask Claude: "tag the new rows in this export against tools/industries.json and
tools/regions.json"). Rows without a tag fall back to industry `other`, suburb unknown.

- **Hide a client from the page:** add their exact CRM name to `EXCLUDE` in `tools/build-winback.py`.
- **Fix how a name displays:** add it to `DISPLAY` in the same file (map to `""` to hide).
- **Add a suburb:** put the canonical spelling under its region in `tools/regions.json`.

## Guardrails

- Only business names are ever published. No people, no emails, no addresses, and home customers are
  never listed. If any client would rather not be named, add them to `EXCLUDE` and redeploy.
- `winback-links.csv`, `winback-summary.md` and `winback-classified*.json` are gitignored: keep them in
  Drive, not in this public repo.
- The page is `noindex`; it's for email clicks, not search.
