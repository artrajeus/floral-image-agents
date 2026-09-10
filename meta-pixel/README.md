# Meta Pixel install kit — floralimagecanberra.com.au

Pixel ID: **1260088292957175**

The main site lives on HostPapa (not in this repo), so the pixel has to be added
through HostPapa's cPanel File Manager. This folder gives you two ways to do it.

## Pages that need the pixel

| Page | Events |
|---|---|
| `/for-home.html` | PageView |
| `/home-flowers.html` | PageView |
| `/the-monthly-swap.html` | PageView |
| `/seasonal-selection.html` | PageView |
| `/subscribe.html` | PageView + **InitiateCheckout** (value 70.00 AUD) |
| `/success.html` | PageView + **Purchase** (value 70.00 AUD) |
| `/quiz.html` | already has PageView + Lead — leave as is |

## Option A — patch the files with the script (recommended)

1. HostPapa dashboard → **cPanel** → **File Manager** → open `public_html`.
2. Select the six pages above (not quiz.html), click **Download**, and put them in
   one folder on your computer, e.g. `~/Desktop/fi-site`.
3. In Terminal:
   ```
   python3 install-pixel.py ~/Desktop/fi-site
   ```
   The patched copies are written to `~/Desktop/fi-site/patched/`. The script
   never installs the pixel twice, so re-running it is safe.
4. Back in File Manager, click **Upload**, drag in the files from `patched/`, and
   choose overwrite when asked.

## Option B — paste by hand in the File Manager editor

For each page: right-click the file → **Edit** → paste the contents of
`snippets/1-base-code-every-page.html` straight after the `<meta charset>` line
inside `<head>` → **Save Changes**. Then also paste:

- `snippets/2-subscribe-initiate-checkout.html` after the base code on `subscribe.html`
- `snippets/3-success-purchase.html` after the base code on `success.html`

## Verify

1. Open each page in Chrome with the **Meta Pixel Helper** extension. Click the
   icon: it should list PageView for that page, and InitiateCheckout or Purchase
   on subscribe/success.
2. Events Manager → your pixel → **Test events** → enter a page URL → the events
   appear within a few seconds.
3. Confirm the site's URL in Events Manager is `www.floralimagecanberra.com.au`.

## Things to check before launch

- **Purchase value.** The snippets hard-code 70.00 AUD. If the campaign sells the
  $22 trial, or subscribe.html offers more than one price, change
  `SUBSCRIPTION_VALUE` at the top of `install-pixel.py` (or edit the snippet).
- **Does Stripe actually land on success.html?** The Purchase event only fires
  if Stripe Checkout's success URL points at
  `https://www.floralimagecanberra.com.au/success.html`. Check the Stripe
  Payment Link / Checkout Session settings.
- **Existing InitiateCheckout / Purchase events** in your pixel data came from
  somewhere other than these pages. Once the site fires them too, dedupe by
  checking the event source URL in Events Manager.
