#!/bin/bash
# Add a real-estate agent (or whole agency) to the gifting portal and push live.
#
#   ./add-agent.sh "Jane Doe" "Ray White Belconnen" [logo.png] [jane@raywhite.com]
#
# - Copies the logo (png/svg/jpg/webp) into logos/
# - Adds the entry to agents.json
# - Commits + pushes (live on GitHub Pages ~1 min later)
# - Prints the agent's personal link to share
set -euo pipefail
cd "$(dirname "$0")"

AGENT="${1:?usage: ./add-agent.sh \"Agent Name\" \"Agency\" [logo-file] [email]}"
AGENCY="${2:?usage: ./add-agent.sh \"Agent Name\" \"Agency\" [logo-file] [email]}"
LOGO="${3:-}"
EMAIL="${4:-}"

SLUG=$(python3 - "$AGENT" "$AGENCY" <<'PY'
import re, sys
s = f"{sys.argv[2]} {sys.argv[1]}".lower()
print(re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-"))
PY
)

LOGOPATH=""
if [ -n "$LOGO" ]; then
  EXT="${LOGO##*.}"
  LOGOPATH="logos/${SLUG}.${EXT}"
  cp "$LOGO" "$LOGOPATH"
fi

python3 - "$SLUG" "$AGENT" "$AGENCY" "$LOGOPATH" "$EMAIL" <<'PY'
import json, sys
slug, agent, agency, logo, email = sys.argv[1:6]
with open("agents.json") as f: reg = json.load(f)
reg[slug] = {"agent": agent, "agency": agency, "logo": logo, "email": email}
with open("agents.json", "w") as f: json.dump(reg, f, indent=2, ensure_ascii=False); f.write("\n")
print(f"agents.json: added '{slug}'")
PY

git add -A
git commit -q -m "Add agent: ${AGENT} (${AGENCY})"
git push -q origin main

BASE=$(python3 -c "import re;print(re.search(r'SITE_BASE:\s*\"([^\"]+)\"', open('config.js').read()).group(1))")
echo ""
echo "✅ Live in ~1 minute:"
echo "   ${BASE}/gift.html?a=${SLUG}"
