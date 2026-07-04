#!/bin/bash
# Commit everything and push to GitHub Pages.
#   ./deploy.sh "message"
set -euo pipefail
cd "$(dirname "$0")"
git add -A
git commit -q -m "${1:-Update portal}" || echo "(nothing to commit)"
git push -q origin main
echo "✅ Pushed. Live at https://artrajeus.github.io/floral-image-agents/ in ~1 minute."
