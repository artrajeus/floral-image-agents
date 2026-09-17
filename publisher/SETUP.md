# Publisher setup

Once, by Aaron or Sam. About twenty minutes, most of it waiting on Meta's app
review screens.

Nothing in this repository can post until these steps are done, and **Phase 3 is
the first time anything real goes out** — with a dry run first, and both of us
watching.

---

## What you need at the end

Four repository secrets, under
**Settings → Secrets and variables → Actions**:

| Secret | What it is |
|---|---|
| `META_USER_TOKEN` | A long-lived user token, 60 days |
| `FB_PAGE_ID` | The Floral Image Canberra Page's numeric ID |
| `IG_USER_ID` | The Instagram Business account's numeric ID |
| `META_APP_ID` / `META_APP_SECRET` | Only needed to renew the token |

---

## 1. The app

1. https://developers.facebook.com/apps → **Create app** → type **Business**.
2. Name it something recognisable — `Floral Image Canberra Publisher`.
3. Add the **Facebook Login** and **Instagram Graph API** products.

You do **not** need App Review for this. App Review is for acting on behalf of
*other people's* accounts. Publishing to a Page you administer works with a
token you generate yourself.

## 2. Connect Instagram to the Page

Instagram publishing runs through the Facebook Page, so the link has to exist
first.

1. The Instagram account must be a **Business** account, not Personal and not
   Creator. Instagram app → Settings → Account type.
2. It must be linked to the Facebook Page: Page → Settings → Linked accounts →
   Instagram.

If this is not right, everything below will appear to work and then fail at the
last step with an error about permissions.

## 3. Generate a token — and watch for the two-click trap

1. https://developers.facebook.com/tools/explorer
2. Choose your app, then **User Token**.
3. Request these scopes:

   ```
   pages_show_list
   pages_read_engagement
   pages_manage_posts
   instagram_basic
   instagram_content_publish
   business_management
   ```

4. **Generate Access Token.**

### The trap

> Facebook asks for **permissions** and for **Page access** in two separate
> steps, and it is easy to complete the first and skip the second. The token
> then holds every scope you asked for and can still see **zero Pages**.

This is the single most common first-run failure, it produces no useful error,
and the fix is not discoverable from the message.

**If the Page-selection dialog does not appear:** add a scope this token has
never been granted before, and generate again. A previously unseen scope forces
the dialog back. `business_management` is a good one to hold in reserve for
exactly this. **Tick the Floral Image Canberra Page when the dialog appears.**

## 4. Make the token long-lived

A token from the Explorer lasts about an hour. Exchange it:

```bash
export META_APP_ID=...
export META_APP_SECRET=...        # App settings -> Basic -> App Secret
./publisher/renew-token.sh <short-lived-token>
```

## 5. Check it points at the right account

**Do this before anything else. It is the only step that proves the credentials
are pointed at Floral Image Canberra rather than somewhere else.**

```bash
export META_USER_TOKEN=<long-lived token>
node publisher/whoami.js
```

Expect:

```
token owner   : <your name>
token age     : first seen 2026-09-17 — 60 days left
page          : Floral Image Canberra (1234567890)   <- FB_PAGE_ID
instagram     : @floralimage_canberra (9876543210)   <- IG_USER_ID
OK — credentials resolve to a Page and an Instagram account.
```

`whoami.js` prints the Page and Instagram IDs — those are the values for
`FB_PAGE_ID` and `IG_USER_ID`.

**If it says `pages : NONE VISIBLE`,** you hit the trap in step 3. Go back and
add an unused scope.

**If it names a different Page or a different Instagram account, stop.**
Publishing would go somewhere it should not.

## 6. Put the secrets in the repository

Settings → Secrets and variables → Actions → New repository secret, for each of
`META_USER_TOKEN`, `FB_PAGE_ID`, `IG_USER_ID`, `META_APP_ID`, `META_APP_SECRET`.

## 7. Commit the token clock

```bash
git add publisher/token-first-seen.json && git commit -m "record token first-seen"
```

`whoami.js` writes this. It holds a **hash** of the token and never the token,
which is why it is safe in a public repository.

It exists because `debug_token` **withholds `expires_at` when a token inspects
itself** — which is always the case here, since this repo only ever holds one
token. Without a recorded first-seen date the expiry warning can never fire, and
the first sign of trouble is a post that quietly fails to go out.

---

## Running it

```bash
node publisher/publish.js --dry-run     # preflight every URL, post nothing
node publisher/publish.js               # post everything approved and due
node publisher/publish.js --package social/queue/2026-09-18-a-slug
node --test publisher/test.js           # the suite, no network
```

A dry run still fetches every image URL, because a bad URL is the failure most
worth catching before it reaches the platform.

---

## What the publisher refuses to do

- **Post anything not `approved` with an `approved_by` name.** Only Sam sets
  that field, by hand, in the file. A system that can generate *and* publish is
  a system that can publish something wrong at 8am with nobody awake.
- **Post a package that is already posted.** Every run is safe to repeat, which
  is what makes nudging a late cron run safe.
- **Post a package whose `source_images` field is absent.** Absent and `[]` are
  different things: `[]` means a type tile with genuinely no source, absent means
  nobody recorded it. Treating the second as the first is how a duplicate check
  passes on a queue it cannot see.

---

## When something breaks

| Symptom | Almost certainly |
|---|---|
| `(#200) ... requires ... manage_pages` | The user token reached a Page endpoint. The Page token comes from `/me/accounts`. |
| `pages: NONE VISIBLE` | The two-click trap, step 3. |
| `Only photo or video can be accepted as media type` | The image URL is not serving an image — usually an HTML error page at a wrong path. `--dry-run` catches this. |
| `(#9007) media is not ready` | Published before the container finished. The publisher polls; if you see this, the poll budget was too short. |
| `Invalid OAuth access token` | Expired, or the wrong secret. `whoami.js` will say which. |
| Posted at the wrong hour | A UTC conversion done against today's offset instead of the posting date's. Canberra observes daylight saving. Never hand-compute it. |

Add anything new to the incident log in `social/PUBLISHING.md`, with what it
cost. That is what makes this survivable by someone who was not here.
