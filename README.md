# La Bastide de Lestrebaldie: direct booking site

Next.js 16 · Prisma (SQLite locally, Postgres in production) · Stripe · FR/EN.

## Run
```
npm install
npx prisma db push && npm run db:setup   # creates dev.db and seeds demo data
npm run dev                              # http://localhost:3000
```
- Admin: http://localhost:3000/admin  (ADMIN_EMAIL / ADMIN_PASSWORD from `.env`)
- Demo guest: guest@example.com / guest1234
- Logic test: `npx tsx --env-file=.env scripts/flow-test.mts` (needs the dev server running)

## Without any accounts it already works
- **Payments**: with `STRIPE_SECRET_KEY` empty, checkout uses a built-in demo pay page. Add the Stripe key + `STRIPE_WEBHOOK_SECRET` (webhook endpoint `/api/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.expired`) to go live. Refunds go through Stripe automatically.
- **Email**: with `RESEND_API_KEY` empty, every message is stored in Admin → Notifications.
- **Airbnb sync (free, iCal)**: Admin → **Calendar sync** walks through it in two steps (paste Airbnb's *export* link; give Airbnb our calendar link) with a "Test this link first" button, status, and a list of what was imported. A scheduled job must call `/api/cron/sync?secret=CRON_SECRET` every 15 min (cron-job.org, or Vercel Cron via the included `vercel.json`, which needs a plan that allows 15-minute crons). Airbnb itself only re-reads our link every few hours; for instant two-way sync use Beds24 (below).
- **Beds24 (real-time)**: set `CHANNEL_PROVIDER=beds24`, `BEDS24_TOKEN`, and each property's Beds24 room id. `src/lib/channel/beds24.ts` is written from the public docs and NOT yet verified against a live account.

## Offers
Admin → Offers: percentage or fixed discounts, automatic or with a promo code, optional booking window, stay window and minimum nights. Each offer can show as a top banner, a pop-up (once a week per visitor) and/or cards on the home, Offers and property pages. The best single offer applies at checkout (no stacking) and is stored on the booking. `npx tsx --env-file=.env scripts/seed-offers.mts` adds three samples.

## Adding a property
Admin → Properties → Add property: details, photos (upload), prices and seasons, cancellation tiers, amenities, FR/EN text, channel URLs. Publish and it appears on the site, in search and the sitemap-ready routes with no code change.

## Before launch (placeholders to confirm with the client)
Rates, cleaning fee, tourist tax, cancellation tiers, house rules, check-in/out times, legal pages (SIRET, address, VAT), which photo belongs to which cottage, owner email, real pool photos (none in the Airbnb gallery).

## Known limits
- v1 sells the whole estate only (one Airbnb listing). Cottage-level sales need separate Airbnb listings.
- Uploaded photos are stored in `public/uploads` (fine locally; use object storage such as S3/Cloudinary/Vercel Blob in production, and Postgres instead of SQLite).
- Payment is full amount at booking; deposit/balance not built.
- Admin sessions are signed cookies; add rate limiting and 2FA before production.

## Reviews
Admin → Reviews: add real reviews (copy from Airbnb with the guest's OK). The three highest-priority published ones show on the home and property pages next to the 4.83 / 12 Airbnb rating (edit `RATING` in `src/lib/reviews.ts`). Reviews flagged "Placeholder" never show in production. `npx tsx --env-file=.env scripts/seed-reviews.mts` adds three placeholders.

## QA scripts (dev server running)
- `npx tsx --env-file=.env scripts/flow-test.mts`: booking logic (holds, overlaps, refunds, iCal).
- `node scripts/e2e.mjs <out-dir>`: guest journey in a headless browser at phone width (checkout, demo pay, confirmation).
- `node --env-file=.env scripts/shot.mjs jobs.json`: full-page screenshots (phone or desktop, optionally signed in) plus a sideways-overflow report.
- `npx tsx --env-file=.env scripts/clean-test-data.mts`: removes the bookings those scripts leave behind.

## Testing the Airbnb sync
- **No Airbnb needed:** `npx tsx --env-file=.env scripts/sync-test.mts` plays a fake Airbnb (new booking, changed dates, cancellation, wrong link, server error, echoed bookings, loop check) against a throwaway property. Also `node --env-file=.env scripts/e2e-sync.mjs <out-dir>` clicks through the Calendar sync page.
- **By hand, in development:** Admin → Calendar sync → "Use the pretend Airbnb calendar", then Sync now. Variations: `/api/dev/airbnb-mock?drop=res` (cancelled), `?shift=1` (dates moved), `?broken=1` (wrong link). The mock is disabled in production.
- **With the real Airbnb, once the site is online:** block two future dates in Airbnb and press Sync now (they must appear here and become unbookable); add an owner block in Admin → Calendar and check it shows in "Preview it" and, after Airbnb's next refresh, on Airbnb. Remove the test blocks afterwards.

## Database: SQLite locally, Postgres in production
One schema, two databases. `scripts/prisma-provider.mjs` runs before dev/build/install and picks the Prisma provider from `DATABASE_URL`: `file:./dev.db` uses SQLite (no setup), anything `postgresql://…` uses Postgres. To try the production path locally:
```
docker compose up -d                                   # Postgres on localhost:5444
DATABASE_URL="postgresql://lb:lb@localhost:5444/lestrebaldie" npm run db:setup
DATABASE_URL="postgresql://lb:lb@localhost:5444/lestrebaldie" npm run dev
npx tsx --env-file=.env scripts/race-test.mts          # 12 simultaneous bookings, exactly 1 may win (set DATABASE_URL as above)
```
Bookings take a per-property database lock on Postgres, so two guests can never get the same dates even at the same millisecond. All test scripts pass on both databases.

## Deploying to Vercel (test deployment)
1. **Database.** Vercel dashboard → Storage → add **Neon** (Postgres), region Frankfurt, and connect it to the project. This adds `DATABASE_URL`.
2. **Image storage.** Storage → add a **Blob** store and connect it (adds `BLOB_READ_WRITE_TOKEN`). Without it, uploading photos in the admin shows an error.
3. **Settings** (Project → Settings → Environment Variables): `SESSION_SECRET` (long random), `CRON_SECRET` (long random), `SITE_URL` (the deployment address, no trailing slash), `OWNER_EMAIL`, `MAIL_FROM`; optional `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`. See `.env.example`.
4. **Create the tables and the owner login, once**, from this folder, with the database's *direct* (non-pooled) connection string:
   ```
   DATABASE_URL="postgresql://…" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run db:setup
   ```
   This also loads the demo property and sample bookings. Delete them in the admin when the real data goes in.
5. **Deploy:** `npx vercel` from this folder (log in when asked; use `--prod` for the production URL), or import the Git repository in Vercel. The build generates the Prisma client by itself.
6. **Keep Airbnb synced:** `vercel.json` runs the sync daily, which every plan allows. For every 15 minutes, either change the schedule to `*/15 * * * *` (needs a paid Vercel plan) or point a free job at `https://YOUR-SITE/api/cron/sync?secret=CRON_SECRET` (e.g. cron-job.org).
7. **Test Airbnb for real:** Admin → Calendar sync. Make sure `SITE_URL` is the live address first, so the calendar link shown there is the one Airbnb can reach.

Notes: Vercel's free Hobby plan is for non-commercial use, so the client's real site needs a paid plan or another host. The pretend-Airbnb tool and the placeholder reviews are hidden automatically in production.

## Moving to Google Cloud later
Nothing in the app needs Vercel. The pieces map one to one:
| Now (Vercel) | Google Cloud | Change needed |
|---|---|---|
| Neon Postgres | Cloud SQL for PostgreSQL | only `DATABASE_URL`; same schema |
| Vercel Blob | Cloud Storage | add a Cloud Storage branch to `src/lib/storage.ts` (one function; `next.config.ts` already allows `storage.googleapis.com` images) |
| Vercel hosting | Cloud Run | add a Dockerfile (Next "standalone" output); not included yet |
| Vercel Cron | Cloud Scheduler | call `/api/cron/sync` with `?secret=` or an `Authorization: Bearer` header; same endpoint |
| Project env vars | Secret Manager / Cloud Run env | same variable names |
Stripe, email and the Airbnb calendar links are host-independent. `vercel.json` and the `@vercel/blob` driver are simply unused elsewhere.
