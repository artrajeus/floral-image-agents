#!/usr/bin/env bash
#
# Nudge a late cron run.
#
# GitHub Actions cron is a best-effort queue. If a package is sitting approved
# and due and the hourly run has not arrived, an empty commit to main starts one
# immediately, because the workflow also triggers on push.
#
# This is only safe because publishing is idempotent: a package already marked
# `posted` is skipped, so nudging can never double-post. That property is what
# the nudge is built on, and it is tested — see "running twice does not post
# twice" in publisher/test.js.
#
#   ./publisher/nudge.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "On '$BRANCH'. The workflow only triggers on pushes to main." >&2
  exit 1
fi

echo "Due now:" >&2
node publisher/publish.js --due >&2 || true

git commit -q --allow-empty -m "Nudge the publisher"
git push -q origin main
echo "Pushed an empty commit. The publish workflow should start within a minute." >&2
