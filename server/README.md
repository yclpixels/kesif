# Keşif photo server

Lets travellers share views of places with each other. Cloudflare Worker + KV or R2 (pictures) + D1 (list),
Workers AI or Google Vision (second check), Turnstile (bots). Runs on Cloudflare's free plan. Until it is deployed, the app keeps
photos on the phone only.

## One-time setup (≈15 minutes, no payment card needed)

1. **Cloudflare account** (free): https://dash.cloudflare.com/sign-up
2. In this folder:
   ```
   npm install
   npx wrangler login
   npx wrangler kv namespace create PHOTOS_KV     # copy the id into wrangler.toml
   npx wrangler d1 create kesif-photos            # copy the database_id into wrangler.toml
   npm run db:remote
   ```
3. **Turnstile** (Cloudflare dashboard → Turnstile → Add widget, domain `yclpixels.github.io`, mode
   Invisible). Put the *site key* in `js/share.js` (`TURNSTILE_SITEKEY`) and the secret here:
   `npx wrangler secret put TURNSTILE_SECRET`
4. **Review key** (optional page): `npx wrangler secret put ADMIN_KEY`
5. `npm run deploy` → it prints `https://kesif-photos.<account>.workers.dev`. Put that address in
   `js/share.js` (`PHOTO_API_LIVE`), fill in the brackets in `gizlilik.html` and `kosullar.html`,
   bump `sw.js` VERSION and publish the site.

The second photo check uses Cloudflare Workers AI (free daily allowance, already in `wrangler.toml`).
Later, with a budget: Google Vision SafeSearch is more accurate (`npx wrangler secret put VISION_API_KEY`),
and R2 gives more space than KV's 1 GB (uncomment the R2 block).

## How moderation works without approving every photo

Like Google Maps, Instagram and iNaturalist, it runs in layers by itself:

| Layer | What it does |
|---|---|
| Phone check | nudity → refused; only selfies and views of places |
| Server check | Workers AI (or Google Vision) looks again; a modified app can't skip it |
| Trust | new phones: 5 shared photos a day, **one report hides** their photo; phones with 5 photos live for a week without reports: 20 a day, three reports |
| Strikes | two hidden photos in 30 days → that phone can't share any more |
| Clean-up | hidden photos are deleted after 30 days (daily job) |

The review page (`/admin`) is optional: open it when you have time to restore a photo hidden unfairly.

## Local test

```
npm install
npm run db:local
printf 'ADMIN_KEY=test-admin-key\n' > .dev.vars
npm run dev                      # http://localhost:8787, SafeSearch skipped (ALLOW_UNCHECKED)
```
In the app's browser console: `localStorage.setItem('damga:api', '"http://localhost:8787"')`, reload.

## Other rules

- JPEG only, ≤ 2.5 MB, taken in Türkiye.
- The owner can delete their photo any time (token kept on their phone).
