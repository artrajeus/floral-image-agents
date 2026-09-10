#!/usr/bin/env python3
"""
Insert the Meta Pixel (ID 1260088292957175) into the floralimagecanberra.com.au
landing pages downloaded from HostPapa.

Usage:
    python3 install-pixel.py <folder-with-downloaded-html>            # writes to <folder>/patched/
    python3 install-pixel.py <folder-with-downloaded-html> --in-place # overwrites the files

What it does, per page:
    * Inserts the base pixel code (init + PageView + <noscript> fallback) straight
      after the opening <head> tag.
    * Adds a page-specific event where one is needed (see PAGE_EVENTS below).
    * Skips any page that already has fbq('init', ...) so quiz.html is left alone
      and the pixel is never installed twice.
It is safe to run more than once.
"""
import re
import sys
from pathlib import Path

PIXEL_ID = "1260088292957175"
CURRENCY = "AUD"
SUBSCRIPTION_VALUE = "70.00"  # monthly subscription price used for checkout/purchase values

# Pages that must carry the pixel, and the extra event (if any) fired after PageView.
PAGE_EVENTS = {
    "for-home.html": None,
    "home-flowers.html": None,
    "the-monthly-swap.html": None,
    "the-monthly-swap": None,
    "subscribe.html": ("InitiateCheckout", {"value": SUBSCRIPTION_VALUE, "currency": CURRENCY}),
    "success.html": ("Purchase", {"value": SUBSCRIPTION_VALUE, "currency": CURRENCY}),
    "quiz.html": ("Lead", None),
    "seasonal-selection.html": None,
}

MARKER = "<!-- Meta Pixel Code -->"

BASE_CODE = f"""{MARKER}
<script>
!function(f,b,e,v,n,t,s)
{{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{PIXEL_ID}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={PIXEL_ID}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->"""


def event_snippet(name, params):
    if params:
        body = ", ".join(f"{k}: {v}" if k == "value" else f"{k}: '{v}'" for k, v in params.items())
        return f"<script>fbq('track', '{name}', {{{body}}});</script>"
    return f"<script>fbq('track', '{name}');</script>"


def patch(html, page):
    if "fbq('init'" in html or 'fbq("init"' in html or MARKER in html:
        return html, "already has the pixel - left unchanged"
    m = re.search(r"<head[^>]*>", html, flags=re.IGNORECASE)
    if not m:
        return html, "ERROR: no <head> tag found - paste the snippet in by hand"
    insert_at = m.end()
    # Keep <meta charset> as the first thing in <head>; go in straight after it.
    head_end = re.search(r"</head>", html, flags=re.IGNORECASE)
    charset = re.search(r"<meta[^>]*(charset|http-equiv=[\"']?content-type)[^>]*>", html[m.end():head_end.start() if head_end else len(html)], flags=re.IGNORECASE)
    if charset:
        insert_at = m.end() + charset.end()
    block = BASE_CODE
    ev = PAGE_EVENTS.get(page)
    if ev:
        block += "\n" + event_snippet(*ev)
    patched = html[:insert_at] + "\n" + block + "\n" + html[insert_at:]
    label = f"PageView{' + ' + ev[0] if ev else ''}"
    return patched, f"pixel inserted ({label})"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    in_place = "--in-place" in sys.argv
    out_dir = src if in_place else src / "patched"
    out_dir.mkdir(exist_ok=True)
    missing = []
    for page in PAGE_EVENTS:
        f = src / page
        if not f.exists():
            missing.append(page)
            continue
        html = f.read_text(encoding="utf-8", errors="surrogateescape")
        new_html, note = patch(html, page)
        (out_dir / page).write_text(new_html, encoding="utf-8", errors="surrogateescape")
        print(f"{page:28s} {note}")
    for page in missing:
        if page not in ("the-monthly-swap", "the-monthly-swap.html"):
            print(f"{page:28s} not found in {src} - download it from HostPapa first")
    print(f"\nPatched files are in: {out_dir}")


if __name__ == "__main__":
    main()
