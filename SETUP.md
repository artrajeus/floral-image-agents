# Backend setup — 3 minutes, once

The pages are live but won't save submissions until this web app is deployed under your Google account. It creates the Google Sheet automatically and sends both emails (notification to canberra@floralimage.com + confirmation to the agent).

> **Which Google account?** The agent's confirmation email is sent **from** the account that deploys this. If canberra@floralimage.com is a Google Workspace login, deploy while signed into that. Otherwise use your Gmail — notifications still arrive at canberra@floralimage.com either way.

## Steps

1. Go to **https://script.google.com** → **New project**.
2. Name it `FI Agent Gifts` (click "Untitled project" top-left).
3. Delete the placeholder code in the editor, and paste in the full contents of **`apps-script/Code.gs`** from this folder. **Save** (⌘S).
4. Click **Deploy → New deployment**.
5. Click the gear next to "Select type" → choose **Web app**.
6. Set:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**  ← required so the public pages can post to it
7. Click **Deploy** → **Authorize access** → pick your account → if you see "Google hasn't verified this app", click **Advanced → Go to FI Agent Gifts (unsafe)** → **Allow**. (It's your own script; the scary screen is standard.)
8. Copy the **Web app URL** (ends in `/exec`).

## Wire it up

Tell Claude the URL (easiest), **or** do it yourself:

1. Open `config.js` in this folder and paste the URL: `ENDPOINT: "https://script.google.com/…/exec"`.
2. Run `./deploy.sh "wire backend"` to push it live.

## Test it

Open `https://artrajeus.github.io/floral-image-agents/gift.html?a=demo`, submit a test gift (use your own phone/address), then check:

- ✅ canberra@floralimage.com got the notification
- ✅ the agent email you entered got the confirmation
- ✅ a sheet named **"Floral Image Canberra — Agent Gifts"** appeared in the deploying account's Google Drive with the row in the **Gifts** tab

## Later changes

If you ever edit `Code.gs`, re-paste it and use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (the URL stays the same).
