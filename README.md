# Floral Image Canberra — Agent Gifting Portal

Free welcome-flowers gifting for Canberra real-estate agents. Agents log a gift on their personal page; Floral Image phones the client, delivers, and converts a slice into home subscribers. Part of the FY27 growth plan (System 2) — see `~/floral-image-canberra/STRATEGY.md`.

**Live site:** https://artrajeus.github.io/floral-image-agents/

## Pieces

| File | What it is |
|---|---|
| `index.html` | Marketing page that sells the program to agents + "get your link" signup form |
| `gift.html?a=<slug>` | The per-agent gift submission page (logo + prefill from `agents.json`) |
| `refer.html` | **Client referral page** — "Give a month, get a month" (prefill via `?n=&b=&e=`, source via `?src=`) |
| `dashboard.html` | **Team growth dashboard** — shared FY27 checklist for Aaron + Sam (PIN-gated; state lives in the Tasks tab of the Sheet; PIN set as `DASH_PIN` in Code.gs, default `flowers26`) |
| `qr-cards.html` / `qr-cards.pdf` | Print-ready A4 sheet of 8 referral QR cards — drivers leave one with every refresh |
| `agents.json` | Agent registry — slug → name, agency, logo, email |
| `portal.js` / `styles.css` | Shared logic + design system |
| `apps-script/Code.gs` | Backend: Google Sheet + notification email + agent confirmation email |
| `config.js` | `ENDPOINT` = the deployed Apps Script URL (see `SETUP.md`) |
| `add-agent.sh` | `./add-agent.sh "Jane Doe" "Ray White Belconnen" logo.png jane@rw.com` → live link |
| `deploy.sh` | Commit + push to GitHub Pages |

## Daily ops

- **New agent signup email arrives** → run `add-agent.sh` with their details (+ logo if they sent one) → email them their link.
- **New gift email arrives** → call the client, schedule delivery, set the row's `Status` in the sheet (`NEW → SCHEDULED → DELIVERED`).
- All data lands in one Google Sheet: **"Floral Image Canberra — Agent Gifts"** (auto-created in the deploying Google account's Drive; tabs: `Gifts`, `Agent Signups`).

## Guardrails (from the strategy)

Cap ~4 gifts/agent/month at launch · Canberra metro zones · aged-stock arrangements · batch deliveries on set run days · we always phone first · never a hard sell.

## Phase 2 (later)

Magic-link agent dashboards ("my gifts"), day-10 recipient follow-up automation via Klaviyo (`Settlement Gift Requested` events), delivered-notice automation, monthly agent impact digest.
