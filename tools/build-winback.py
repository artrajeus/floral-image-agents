#!/usr/bin/env python3
"""
Build the win-back landing page data + Klaviyo link sheet from a Salesforce
"Total Closed Won and Lost" export plus the industry/suburb classification file.

  python3 tools/build-winback.py \
      --xlsx  ~/Downloads/Total_Closed_Won_and_Lost.xlsx \
      --classified ~/Drive/winback/winback-classified.json \
      --out-dir ~/Drive/winback

Writes:
  winback-data.js              → into the repo (current clients shown on welcome-back.html;
                                 business names only, no contact details)
  <out-dir>/winback-links.csv  → one row per closed-lost contact with their personal URL,
                                 ready to import into Klaviyo (contains emails: keep it
                                 OUT of the repo — it's gitignored)
  <out-dir>/winback-summary.md → counts by industry × suburb so you can sanity-check

The classification file is a JSON list of {id, industry, suburb, kind, closed, ...}
keyed to the row order of the export (id = 1-based row index among deal rows). Rows
missing from it are treated as industry "other", suburb "" (unknown). To exclude a
current client from ever being displayed, add its exact name to EXCLUDE below.
"""
import argparse, csv, json, os, re, sys, urllib.parse, collections, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://artrajeus.github.io/floral-image-agents/welcome-back.html"

# Current clients who should never be named on the page (exact cleaned name).
EXCLUDE = set([
    # "Some Client Pty Ltd",
])
# Display-name fixes for current clients (CRM name → what the page shows). Map to "" to hide.
DISPLAY = {
    "Gulson Canberra Pre-Owned (Bill under Autosports Leichhardt Pty Ltd from Jun 2026)": "Gulson Canberra Pre-Owned",
    "AUTOSPORTS LEICHHARDT PTY LTD": "Autosports Canberra",
    "JONES LANG LASALLE (ACT) PTY LTD": "JLL Canberra",
    "HWL EBSWORTH": "HWL Ebsworth",
    "ORD MINNETT": "Ord Minnett",
    "LEADR GROUP Automobiles": "Leadr Group Automobiles",
    "Belluci's": "Bellucci's",
    "Thai Cornar Restaurant": "Thai Corner Restaurant",
    "Kippax Vet Hospotal": "Kippax Vet Hospital",
    "Parker Financal Services Pty Ltd": "Parker Financial Services",
    "Covenant Christian School Gorden": "Covenant Christian School",
    "Australia Medical council": "Australian Medical Council",
    "Australian Institute of Company's": "Australian Institute of Company Directors",
    "Embraces orthodontists Belconnen": "Embrace Orthodontics Belconnen",
    "Embrace Orthodontists Gungahlin": "Embrace Orthodontics Gungahlin",
    "Supersmiles - Canberra City": "Supersmile Canberra City",
    "Sleigh Pec Chartered accountants": "Sleigh Pec Chartered Accountants",
    "Warrigal Sterling": "Warrigal Stirling",
    "Goodwin Crace - Health and Wellness": "Goodwin Crace",
    "Goodwin Crace - Reception": "Goodwin Crace",
    "Goodwin Monash - David Harper House": "Goodwin Monash",
    "Goodwin Lifestyle": "Goodwin Aged Care",
    "Goodwin Residential Care": "Goodwin Aged Care",
    "Calvary John James Hospital Admissions": "Calvary John James Hospital",
    "Calvary John James": "Calvary John James Hospital",
    "Canberra Imaging Group Deakin HO": "Canberra Imaging Group Deakin",
    "Canberra Imaging Group belconnen": "Canberra Imaging Group Belconnen",
    "Canberra Imaging Group Canberra Uni": "Canberra Imaging Group UC Bruce",
    "Canberra Imaging Group Super Centre": "",
    "Ochre Health Pty Limited - Garran": "Ochre Health Garran",
    "Ochre Medical Center - Bruce": "Ochre Medical Centre Bruce",
    "Ochre Medical Centre - Cooma": "Ochre Medical Centre Cooma",
    "Ochre Health Medical Casey": "Ochre Health Casey",
    "Title Company Gunning District Community & Health Service": "Gunning District Community & Health Service",
    "Meyer Vandenberg Lawyers - MV Management Pty Ltd": "Meyer Vandenberg Lawyers",
    "Centuria Investment Management (CMA) No. 2 Pty Ltd": "Centuria",
    "Centuria Property Funds Limited": "Centuria",
    "Benjamin Hennessey": "",
    "Gillian Beaumont": "",
    "Sam Catanzaroti": "",
    "Brod Industries": "",
    "Ucevents - conference hall": "UC Events",
    "Advice Unisuper": "UniSuper Advice",
    "Aussie Franchise Principal": "Aussie Home Loans Queanbeyan",
    "Latte Lounge Phillip Pty Ltd": "Latte Lounge Phillip",
    "Italian and sons": "Italian & Sons",
    "Cancer Council Act": "Cancer Council ACT",
    "Housing Industry": "Housing Industry Association",
    "The Group of Eight Ltd": "Group of Eight",
    "Focus Eyewear - Ross Hiew Dickson": "Focus Eyewear Belconnen",
    "Focus Eyewear": "",
    "Canberra Hospital Foundation (Adolescent Ward)": "Canberra Hospital Foundation",
    "IMH Deakin Private Hospital Pty Ltd": "Deakin Private Hospital",
    "Gastroract": "GastroACT",
    "Amentum Australia Proprietary Limited": "Amentum Australia",
    "Kellogg Brown and Root": "KBR",
    "L3 Communications": "L3Harris",
    "Villaggio Sant’ Antonio": "Villaggio Sant'Antonio",
    "Adina Serviced Apartments Canberra James Court": "Adina Apartments James Court",
    "Bulk Billing Medical Practice": "Murrumbateman Bulk Billing Medical Practice",
    "Dr. Felicity Brims": "Dr Felicity Brims",
    "Dr. William Vass": "Dr William Vass",
    "Dr David O’Rourke": "Dr David O'Rourke",
    "Physio TM": "TM Physio",
    "The Walking Clinic": "",
    "Southern Cross Care NSW & ACT": "Southern Cross Care",
    "Toyota service gungahlin": "Toyota Service Gungahlin",
    "Maloney Property manager": "Maloney's Property",
    "Whittles": "Whittles Strata",
    "Luscombe Solutions Australia (LSA) Pty. Ltd.": "Luscombe Solutions",
    "Capital Education & Migration": "Capital Education & Migration",
    "Hall & Wilcox": "Hall & Wilcox",
    "Stc legal": "STC Legal",
    "Zed3 medical group": "Zed3 Medical Group",
    "H20 Spa": "H2O Spa",
    "Christ Church Hawker": "Christ Church Hawker",
}
ACRONYMS = set("ISPT ACT RSL IRT CPA HWL MGI RSM DFK KJB MLCOA IMH UMI MSS APIR CIE MPS TSA KDN LJ PRD HIVE NAATI AIDF SRC SAP CEA RLB NSW JLL MV STC UC GPG HCC AC TM EU MG KBR SHAPE NATROAD".split())
SMALL = set("and of the at by on in for to a an & de la".split())


def display_name(raw):
    if raw in DISPLAY:
        return DISPLAY[raw]
    n = raw
    n = re.sub(r"\s*\((bill|from|pause|on hold)[^)]*\)", "", n, flags=re.I)
    n = re.sub(r"\s*,?\s*(Pty\.?\s*Ltd\.?|Pty\.?\s*Limited|Proprietary Limited|Ltd\.?|Inc\.?)$", "", n, flags=re.I)
    words = n.split()
    out = []
    for i, w in enumerate(words):
        core = re.sub(r"[^A-Za-z]", "", w)
        if not core:
            out.append(w)
        elif core.upper() in ACRONYMS and core.isupper():
            out.append(w)
        elif core.isupper() and len(core) > 3:
            out.append(w.title() if "'" not in w else w[0] + w[1:].lower())
        elif core.islower() and (i == 0 or core not in SMALL):
            out.append(w[0].upper() + w[1:])
        else:
            out.append(w)
    return " ".join(out).strip()


# Industries never listed as social proof.
HIDDEN_INDUSTRIES = {"home"}
PERSONAL_DOMAINS = set("""gmail.com hotmail.com bigpond.com outlook.com yahoo.com icloud.com live.com
optusnet.com.au bigpond.net.au yahoo.com.au hotmail.com.au live.com.au no.com email.com iinet.net.au
tpg.com.au internode.on.net me.com grapevine.com.au westnet.com.au outlook.com.au msn.com""".split())


def clean_name(name):
    n = (name or "").strip()
    n = re.sub(r"\((LOST|COLLECT|COLLECTED|CANCELLED|PAUSE[^)]*|ON HOLD[^)]*)\)", "", n, flags=re.I)
    n = re.sub(r"\s*[-–]\s*(LOST|COLLECT|COLLECTED)\b.*$", "", n, flags=re.I)
    n = re.sub(r"\bLOST\b", "", n, flags=re.I)
    n = re.sub(r"[-–]\s*$", "", n).strip()
    return re.sub(r"\s{2,}", " ", n)


def slug(s):
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", (s or "").lower().replace("&", " and ")))


def read_export(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    # find header row
    hi = next(i for i, r in enumerate(rows) if r and any(c == "Common Stage" for c in r))
    hdr = [str(c or "").strip() for c in rows[hi]]
    col = {h: i for i, h in enumerate(hdr)}
    need = ["Common Stage", "First Name", "Last Name", "Company / Account", "Opportunity Name", "City", "Start Date", "Lost Date", "Contact Email", "Email"]
    missing = [n for n in need if n not in col]
    if missing:
        sys.exit("Export is missing columns: %s" % missing)
    out = []
    for r in rows[hi + 1:]:
        stage = r[col["Common Stage"]]
        if stage not in ("Closed Won", "Closed Lost", "Temporary Closed No", "Collect/Cancel"):
            continue
        g = lambda k: (r[col[k]] if r[col[k]] is not None else "")
        email = (str(g("Email")) or str(g("Contact Email"))).strip().lower()
        if "@" not in email:
            email = str(g("Contact Email")).strip().lower()
        raw = (str(g("Company / Account")) + " " + str(g("Opportunity Name")))
        out.append({
            "id": len(out) + 1,
            "stage": stage,
            "name": clean_name(str(g("Company / Account"))) or clean_name(str(g("Opportunity Name"))),
            "first": str(g("First Name")).strip(),
            "last": str(g("Last Name")).strip(),
            "city": str(g("City")).strip(),
            "email": email if "@" in email and "no@email" not in email and "na@email" not in email else "",
            "start": str(g("Start Date")),
            "lost": str(g("Lost Date")),
            "won_but_lost": stage == "Closed Won" and (bool(re.search(r"LOST|COLLECT", raw, re.I)) or bool(g("Lost Date"))),
        })
    return out


def year(s):
    m = re.search(r"(\d{4})", s or "")
    return m.group(1) if m else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--classified", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--out-js", default=os.path.join(ROOT, "winback-data.js"))
    ap.add_argument("--site", default=SITE)
    a = ap.parse_args()

    industries = json.load(open(os.path.join(ROOT, "tools", "industries.json")))
    regions = json.load(open(os.path.join(ROOT, "tools", "regions.json")))
    sub2region = {}
    for rk, r in regions.items():
        for s in r["suburbs"]:
            sub2region[s] = rk
    cls = {c["id"]: c for c in json.load(open(a.classified))}
    deals = read_export(a.xlsx)
    os.makedirs(a.out_dir, exist_ok=True)

    # ---- current clients → winback-data.js
    seen, clients = set(), []
    for d in deals:
        c = cls.get(d["id"], {})
        if d["stage"] != "Closed Won" or d["won_but_lost"] or c.get("closed"):
            continue
        if c.get("kind", "business") != "business" or c.get("industry", "other") in HIDDEN_INDUSTRIES:
            continue
        if not d["name"] or d["name"] in EXCLUDE:
            continue
        shown = display_name(d["name"])
        if not shown:
            continue
        key = shown.lower()
        if key in seen:
            continue
        seen.add(key)
        clients.append({"n": shown, "i": c.get("industry", "other"), "s": c.get("suburb", ""), "_raw": d["name"]})
    # drop "X Something" when "X" already exists in the same suburb (Calvary John James / ... Hospital)
    names = [(c["n"].lower(), c["s"]) for c in clients]
    clients = [c for c in clients if not any(o != c["n"].lower() and c["n"].lower().startswith(o + " ") and s == c["s"] for o, s in names)]
    clients.sort(key=lambda c: c["n"].lower())
    with open(a.out_js, "w") as f:
        f.write("// Generated by tools/build-winback.py on %s — do not edit by hand.\n" % datetime.date.today().isoformat())
        f.write("// Current Floral Image Canberra clients shown as social proof on welcome-back.html.\n")
        f.write("// n = business name, i = industry slug (see industries), s = suburb (see regions).\n")
        f.write("window.FI_WINBACK = ")
        json.dump({"generated": datetime.date.today().isoformat(), "industries": industries, "regions": regions, "clients": clients}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("wrote %s: %d current clients" % (a.out_js, len(clients)))

    # ---- lost contacts → winback-links.csv
    idx_ind = collections.Counter(c["i"] for c in clients)
    idx_ind_sub = collections.Counter((c["i"], c["s"]) for c in clients)
    idx_ind_reg = collections.Counter((c["i"], sub2region.get(c["s"], "")) for c in clients)
    idx_sub = collections.Counter(c["s"] for c in clients)
    current_names = set(c["_raw"].lower() for c in clients)
    for c in clients:
        del c["_raw"]
    cols = ["Email", "First Name", "Last Name", "Organization", "wb_stage", "wb_kind", "wb_industry", "wb_industry_label",
            "wb_suburb", "wb_region", "wb_start_year", "wb_lost_year", "wb_match_tier", "wb_matches_suburb", "wb_matches_region",
            "wb_matches_industry", "wb_neighbours", "wb_confidence", "wb_url", "wb_note"]
    n_rows = n_email = 0
    tiers = collections.Counter()
    by_seg = collections.Counter()
    with open(os.path.join(a.out_dir, "winback-links.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for d in deals:
            if d["stage"] == "Closed Won" and not d["won_but_lost"]:
                continue
            if d["name"].lower() in current_names:
                continue  # also a current client under the same name — don't win back a live account
            c = cls.get(d["id"], {})
            ind = c.get("industry", "other")
            sub = c.get("suburb", "")
            reg = sub2region.get(sub, "")
            kind = c.get("kind", "business")
            params = {"i": ind}
            if sub: params["s"] = slug(sub)
            if d["name"] and kind == "business": params["b"] = d["name"]
            if d["first"] and d["first"].lower() not in ("sir/madam", "sir", "madam"): params["n"] = d["first"]
            params["src"] = "winback-email"
            url = a.site + "?" + urllib.parse.urlencode(params)
            ms, mr, mi, nb = idx_ind_sub[(ind, sub)] if sub else 0, idx_ind_reg[(ind, reg)] if reg else 0, idx_ind[ind], idx_sub[sub] if sub else 0
            tier = "industry+suburb" if ms else "industry+region" if mr else "industry" if mi else "suburb" if nb else "none"
            if ind == "home": tier = "home"
            tiers[tier] += 1
            by_seg[(ind, sub or "(unknown)")] += 1
            n_rows += 1
            n_email += bool(d["email"])
            w.writerow({
                "Email": d["email"], "First Name": d["first"], "Last Name": d["last"], "Organization": d["name"] if kind == "business" else "",
                "wb_stage": d["stage"], "wb_kind": kind, "wb_industry": ind, "wb_industry_label": industries.get(ind, {}).get("label", ""),
                "wb_suburb": sub, "wb_region": regions.get(reg, {}).get("label", ""), "wb_start_year": year(d["start"]), "wb_lost_year": year(d["lost"]),
                "wb_match_tier": tier, "wb_matches_suburb": ms, "wb_matches_region": mr, "wb_matches_industry": mi, "wb_neighbours": nb,
                "wb_confidence": c.get("confidence", ""), "wb_url": url, "wb_note": c.get("note", ""),
            })
    print("wrote winback-links.csv: %d lost contacts (%d with an email)" % (n_rows, n_email))
    print("match tiers:", dict(tiers))

    # ---- summary
    with open(os.path.join(a.out_dir, "winback-summary.md"), "w") as f:
        f.write("# Win-back data summary (%s)\n\n" % datetime.date.today().isoformat())
        f.write("Current clients shown: %d · Lost contacts: %d (%d emailable)\n\n" % (len(clients), n_rows, n_email))
        f.write("## Lost contacts by landing-page match tier\n\n")
        for k, v in tiers.most_common(): f.write("- %s: %d\n" % (k, v))
        f.write("\n## Current clients by industry (social proof available)\n\n| Industry | Current clients | Lost contacts |\n|---|---:|---:|\n")
        lost_ind = collections.Counter(k[0] for k in by_seg.elements())
        for ind, n in idx_ind.most_common():
            f.write("| %s | %d | %d |\n" % (industries.get(ind, {}).get("label", ind), n, lost_ind[ind]))
        f.write("\n## Current clients by suburb\n\n| Suburb | Region | Current clients | Lost contacts |\n|---|---|---:|---:|\n")
        lost_sub = collections.Counter(k[1] for k in by_seg.elements())
        for s, n in idx_sub.most_common():
            f.write("| %s | %s | %d | %d |\n" % (s or "(unknown)", regions.get(sub2region.get(s, ""), {}).get("label", ""), n, lost_sub[s or "(unknown)"]))
        f.write("\n## Segments with both current clients and lost contacts (industry × suburb)\n\n| Industry | Suburb | Current | Lost |\n|---|---|---:|---:|\n")
        for (ind, s), n in sorted(by_seg.items(), key=lambda kv: -kv[1]):
            cur = idx_ind_sub[(ind, s)]
            if cur and s != "(unknown)":
                f.write("| %s | %s | %d | %d |\n" % (industries.get(ind, {}).get("label", ind), s, cur, n))
    print("wrote winback-summary.md")


if __name__ == "__main__":
    main()
