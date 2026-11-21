# Keşif photo server

Lets travellers share views of places with each other. Cloudflare Worker + R2 (pictures) + D1 (list),
Google Vision SafeSearch (second nudity check), Turnstile (bots). Until it is deployed, the app keeps
photos on the phone only.

## One-time setup (≈20 minutes)

1. **Cloudflare account** (free): https://dash.cloudflare.com/sign-up. R2 asks for a payment method;
   nothing is charged inside the free tier (10 GB storage, free downloads).
2. In this folder:
   ```
   npm install
   npx wrangler login
   npx wrangler r2 bucket create kesif-photos
   npx wrangler d1 create kesif-photos        # copy the database_id into wrangler.toml
   npm run db:remote
   ```
3. **Turnstile** (Cloudflare dashboard → Turnstile → Add widget, domain `yclpixels.github.io`, mode
   Invisible). Put the *site key* in `js/share.js` (`TURNSTILE_SITEKEY`) and the secret here:
   `npx wrangler secret put TURNSTILE_SECRET`
4. **Google Vision**: Google Cloud console → new project → enable "Cloud Vision API" → Credentials →
   API key (restrict it to Cloud Vision API). Then `npx wrangler secret put VISION_API_KEY`.
   First 1,000 checks a month are free, then $1.50 per 1,000.
5. **Review key**: `npx wrangler secret put ADMIN_KEY` (a long random password, only for you).
6. `npm run deploy` → it prints `https://kesif-photos.<account>.workers.dev`. Put that address in
   `js/share.js` (`PHOTO_API_LIVE`), fill in the brackets in `gizlilik.html` and `kosullar.html`,
   bump `sw.js` VERSION and publish the site.

Review reported photos at `https://kesif-photos.<account>.workers.dev/admin`.

## Local test

```
npm install
npm run db:local
printf 'ADMIN_KEY=test-admin-key\n' > .dev.vars
npm run dev                      # http://localhost:8787, SafeSearch skipped (ALLOW_UNCHECKED)
```
In the app's browser console: `localStorage.setItem('damga:api', '"http://localhost:8787"')`, reload.

## Rules built in

- JPEG only, ≤ 2.5 MB, taken in Türkiye; 20 uploads per phone per day.
- SafeSearch: adult, racy or violence LIKELY/VERY_LIKELY → refused.
- 3 reports from different phones → hidden until reviewed (keep / delete / delete and ban).
- The owner can delete their photo any time (token kept on their phone).
