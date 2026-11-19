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
- **Email**: set `BREVO_API_KEY` (free plan, good for testing) or `RESEND_API_KEY`, plus `MAIL_FROM` (an address verified with that service). With neither, every message is only stored in Admin → Notifications. Admin → Notifications has a "Send a test email" button that shows the provider's exact error if something is wrong.
- **Airbnb sync (free, iCal)**: Admin → **Calendar sync** walks through it in two steps (paste Airbnb's *export* link; give Airbnb our calendar link) with a "Test this link first" button, status, and a list of what was imported. A scheduled job must call `/api/cron/sync?secret=CRON_SECRET` every 15 min (cron-job.org, or Vercel Cron via the included `vercel.json`, which needs a plan that allows 15-minute crons). Airbnb itself only re-reads OUR link every few hours (its own limit, nothing we can change), so a direct booking is not visible on Airbnb straight away; the owner gets an email asking them to block those dates by hand. For instant two-way sync use Beds24 (below).
- **Beds24 (instant)**: see "Instant sync with Beds24" below.

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
3. **Settings** (Project → Settings → Environment Variables): `SESSION_SECRET` (long random), `CRON_SECRET` (long random), `SITE_URL` (the deployment address, no trailing slash), `OWNER_EMAIL`, `MAIL_FROM`; optional `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY` (or `RESEND_API_KEY`). See `.env.example`.
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

## What "instant" means, and what is already done in free mode
Airbnb has no public booking API: instant connections go through approved partners such as Beds24. With the free calendar links, two things are possible and are built in:
- **Airbnb → this site, as fresh as possible:** the site re-reads Airbnb's calendar the moment a guest checks a price or starts paying (at most every 30–60 s), plus whenever the scheduled job runs (set it to every 5 minutes).
- **This site → Airbnb, not instant:** Airbnb decides when to re-read our link (hours). So after every direct booking the owner receives an email: block these dates on Airbnb now. If Airbnb is ever updated too late, the next Airbnb booking on those dates shows up as a clash in Admin → Bookings.

## Instant sync with Beds24
With Beds24 (a certified Airbnb channel manager) a direct booking closes the dates on Airbnb within minutes and an Airbnb booking reaches us in about a minute through a webhook.
1. The client creates a Beds24 account and connects the Airbnb listing inside Beds24.
2. In Beds24: Settings → Marketplace → API → create an invite code with read+write access to bookings (and personal data), and exchange it for a **refresh token** (Beds24 access tokens last 24 h; the site renews them itself from the refresh token).
3. Site settings: `CHANNEL_PROVIDER=beds24`, `BEDS24_REFRESH_TOKEN`, `BEDS24_WEBHOOK_SECRET` (a long random string); Admin → Calendar sync → Advanced: the Beds24 room id.
4. In Beds24: Settings → Properties → Access → Booking webhooks (version 2, POST): `https://YOUR-SITE/api/webhooks/beds24?secret=BEDS24_WEBHOOK_SECRET&property=your-property-slug`.
5. Run `npx tsx --env-file=.env scripts/beds24-test.mts` any time: it tests our side against a pretend Beds24 (token renewal, paging, price, errors, webhook, no double imports).

**Not yet verified:** the connection has never talked to a real Beds24 account (Beds24 has no sandbox), and Beds24's pages do not say how fast a booking sent through their API reaches Airbnb. First real run: use dates far in the future, watch Admin → Calendar sync and the Airbnb calendar, and cancel the test booking afterwards. If a send ever fails, the guest's booking still stands and the owner gets an "ACTION NEEDED: block these dates on Airbnb" email.

## Photos and the "cocon" look
- The professional photo shoot supplied by the owners lives in `public/img/photos/` (108 web-sized pictures, named `<room-type>-<frame number>.jpg`) and is catalogued, with English and French captions, in `src/lib/photos.ts`. To add one: drop the file in that folder and add one line to the catalogue. Admin → Properties can also upload photos, which then appear under "All" in the photo tour.
- `npx tsx scripts/import-photos.mts <folder>` rebuilds the web-sized files from the photographer's originals (resizes to 1800 px, compresses).
- The site look follows the owners' flyer: cream paper, espresso-brown lettering, gold line details, a serif display font (Playfair Display) with a friendly sans (Figtree). Colours are tokens in `src/app/globals.css`.
- **Moving an existing database to the new photos and wording** (the seed does this for fresh databases): `npx tsx --env-file=.env scripts/update-content.mts` locally, or in production `DATABASE_URL="postgres://…" npx tsx scripts/update-content.mts`. It touches only photos, cottage pictures, the tagline and the sample offers' pictures, never bookings, rates or users.
- The old Airbnb pictures in `public/img/site/` are no longer used by the pages except the two area photos (`area-*.jpg`); delete the rest once production has run the update script.
