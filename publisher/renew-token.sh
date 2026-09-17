#!/usr/bin/env bash
#
# Renew the long-lived Meta token.
#
# Long-lived tokens last 60 days. There is no way to extend one in place: you
# obtain a fresh short-lived token by hand and exchange it here for a new
# long-lived one.
#
# Usage:
#   META_APP_ID=... META_APP_SECRET=... ./publisher/renew-token.sh <short-lived-token>
#
set -euo pipefail

SHORT_TOKEN="${1:-}"

if [[ -z "$SHORT_TOKEN" ]]; then
  cat <<'USAGE'
Usage: ./publisher/renew-token.sh <short-lived-token>

To get a short-lived token:

  1. https://developers.facebook.com/tools/explorer
  2. Pick the Floral Image Canberra app, then "User Token".
  3. Request these scopes:
        pages_show_list
        pages_read_engagement
        pages_manage_posts
        instagram_basic
        instagram_content_publish
        business_management
  4. Generate Access Token.

  IMPORTANT — the two-click trap. Facebook asks for permissions and for Page
  access in two separate steps, and it is easy to complete the first and skip
  the second. The token then holds every scope and can still see zero Pages.

  If the Page-selection dialog does not appear, ADD A SCOPE THIS TOKEN HAS NEVER
  BEEN GRANTED (business_management is a good one to hold back for this) and
  generate again. A previously unseen scope forces the dialog back. Tick the
  Floral Image Canberra Page there.

  5. Copy the token and pass it to this script.
USAGE
  exit 64
fi

: "${META_APP_ID:?META_APP_ID is not set}"
: "${META_APP_SECRET:?META_APP_SECRET is not set}"

echo "Exchanging for a long-lived token..." >&2

RESPONSE=$(curl -sS -G 'https://graph.facebook.com/v21.0/oauth/access_token' \
  --data-urlencode 'grant_type=fb_exchange_token' \
  --data-urlencode "client_id=${META_APP_ID}" \
  --data-urlencode "client_secret=${META_APP_SECRET}" \
  --data-urlencode "fb_exchange_token=${SHORT_TOKEN}")

if echo "$RESPONSE" | grep -q '"error"'; then
  echo "Exchange failed:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

LONG_TOKEN=$(echo "$RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$LONG_TOKEN" ]]; then
  echo "No access_token in the response:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "" >&2
echo "New long-lived token:" >&2
echo "$LONG_TOKEN"
echo "" >&2
cat <<'NEXT' >&2
Next:

  1. Put it in the repository secret META_USER_TOKEN
     Settings -> Secrets and variables -> Actions -> META_USER_TOKEN

  2. Verify it resolves to the right account:
        META_USER_TOKEN=<new token> node publisher/whoami.js

  3. Commit publisher/token-first-seen.json.

     A new token has a new fingerprint, so the 60-day clock restarts by itself.
     The file stores a hash and never the token, which is why it is safe in a
     public repo — and without it the expiry warning can never fire, because
     debug_token withholds expires_at from a token inspecting itself.
NEXT
