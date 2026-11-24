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
Guests who finished a confirmed stay see a **Leave a review** form under that booking in their account (1–5 stars + text). It is saved as *pending*, the owner gets a notification, and nothing is public until you press **Approve and publish** in Admin → Reviews (a badge in the menu counts the waiting ones). Rejected reviews stay hidden. You can also add reviews by hand (copy from Airbnb with the guest's OK). Reviews appear on the home page (top three by priority), the property page and the full /reviews page, next to the Airbnb rating (edit `RATING` in `src/lib/reviews.ts`).

**Placeholder testimonials** (`src/lib/testimonials.ts`) are approved so the section is not empty while testing. They are not real guests: replace them with real ones before launch (publishing invented reviews is illegal in France). `npx tsx --env-file=.env scripts/seed-reviews.mts` re-adds them; `update-content.mts` adds them only while there are no real reviews.

After pulling this change run `npx prisma db push` against the production database once (it adds three optional columns to reviews).

## The area guide (Ségala)
The Area page is the guide to the Ségala and the wider Aveyron. Every place lives in `src/lib/area.ts` (English + French text, category, approximate drive time from Centrès, optional photo and official link) and gets its own page at `/area/<slug>`, listed in the sitemap. To add a place, add one entry there (and a photo, see below).

**Content rules.** The text is written by us from public facts. Do not copy text or photos from the tourist offices: destinationsegala.fr reserves its content, excludes commercial use and forbids extracting its database; tourisme-aveyron.com requires written permission to reproduce texts or illustrations. To reuse their words or photos, get written permission first. The open alternative for events and points of interest is DATAtourisme (Licence Ouverte; free API key; the producer and last-update date must be credited next to each item, and every photo needs its own credit).

**Drive times** were computed with OpenStreetMap routing from the centre of Centrès and rounded. Re-check them from the exact address if you want to be precise.

## Guides and things to do
- **Guides** (`/guides`): articles the owners write in Admin → Guides (English + French, cover photo, places mentioned, draft/scheduled/published). Article text is plain text with `## headings`, `- bullets`, `**bold**` and `[links](url)`; it is rendered without HTML, so nothing pasted in can run as code. Four starter articles are added once by `scripts/seed-posts.mts` (only while the Guides is empty).
- **Things to do**: every place in `src/lib/area.ts` has activity tags (rainy day, with children, swim, walks, free, taste, history & art) that drive the filter on the Area page, plus ready-made day plans (`PLANS`). Place pages show their position with a link to OpenStreetMap and directions from the estate.
- **Database updates are automatic on Vercel**: the production build runs `scripts/sync-db.mjs`, which applies new tables/columns (`prisma db push`, additive only; it fails the build rather than delete data) and adds the starter guides if there are none. It is skipped locally and on preview deployments. To do the same by hand against another database: `npx prisma db push` then `npx tsx scripts/update-content.mts`.

## Area photos and credits
The area photos are from Wikimedia Commons (CC BY-SA / public domain). Authors and licences are in `src/lib/area-credits.json` and listed on the **Photo credits** page (`/credits`, linked from the footer); each place page also carries a small credit caption on its picture. Small square copies (240 px) for the map and lists live in `public/img/area/thumbs/`: when you add or replace an area photo, regenerate its thumbnail too. The map skeleton (rivers, roads, borders, lakes) is OpenStreetMap data baked into `src/lib/map-geo.json` and credited on the map and the credits page.

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
2. In Beds24: Settings → Marketplace → API → create an invite code with read+write access to bookings, bookings-personal and **inventory** (inventory is needed to send prices; scopes cannot be added to an existing code later), and exchange it for a **refresh token** (Beds24 access tokens last 24 h; the site renews them itself from the refresh token).
3. Site settings: `CHANNEL_PROVIDER=beds24`, `BEDS24_REFRESH_TOKEN`, `BEDS24_WEBHOOK_SECRET` (a long random string); Admin → Calendar sync → Advanced: the Beds24 room id.
4. In Beds24: Settings → Properties → Access → Booking webhooks (version 2, POST): `https://YOUR-SITE/api/webhooks/beds24?secret=BEDS24_WEBHOOK_SECRET&property=your-property-slug`.
5. In Beds24, make sure the room's first daily price (price1) is enabled for Airbnb and Booking.com (Prices → Daily price rules), since that is the price the site writes.
6. Run `npx tsx --env-file=.env scripts/beds24-test.mts` any time: it tests our side against a pretend Beds24 (token renewal, paging, price, errors, webhook, no double imports, price push, owner blocks, nightly job).

**Prices from the admin.** In Beds24 mode, saving a property sends the next 365 nights (base price, seasons, minimum stay) to Beds24 with `POST /inventory/rooms/calendar`, one entry per night; Beds24 passes them to Airbnb and Booking.com. The property's "Airbnb / Booking.com markup (%)" raises those prices to cover the platforms' commission (Airbnb's host-only fee for software-connected listings is about 15.5%); offers stay direct-only. The scheduled job re-sends once a day so the window keeps moving, and Admin → Calendar sync has a "Send prices now" button and shows the last result. A failure is recorded there and emails the owner. Owner blocks and manual bookings made in Admin → Calendar are sent to Beds24 too (blocks as blackouts), so the owner never needs to touch the Airbnb calendar.

**Not yet verified:** the connection has never talked to a real Beds24 account (Beds24 has no sandbox), and Beds24's pages do not say how fast a booking sent through their API reaches Airbnb. First real run: use dates far in the future, watch Admin → Calendar sync and the Airbnb calendar, and cancel the test booking afterwards. If a send ever fails, the guest's booking still stands and the owner gets an "ACTION NEEDED: block these dates on Airbnb" email.

## Photos and the warm look
- The professional photo shoot supplied by the owners lives in `public/img/photos/` (106 web-sized pictures, named `<room-type>-<frame number>.jpg`) and is catalogued, with English and French captions, in `src/lib/photos.ts`. To add one: drop the file in that folder and add one line to the catalogue. Admin → Properties can also upload photos, which then appear under "All" in the photo tour.
- `npx tsx scripts/import-photos.mts <folder>` rebuilds the web-sized files from the photographer's originals (resizes to 1800 px, compresses).
- The site look follows the owners' flyer: cream paper, espresso-brown lettering, gold line details, a single clean sans-serif (Figtree) for headings and text. Colours are tokens in `src/app/globals.css`.
- **Moving an existing database to the new photos and wording** (the seed does this for fresh databases): `npx tsx --env-file=.env scripts/update-content.mts` locally, or in production `DATABASE_URL="postgres://…" npx tsx scripts/update-content.mts`. It touches only photos, cottage pictures, the tagline and the sample offers' pictures, never bookings, rates or users.
- The old Airbnb pictures in `public/img/site/` are no longer used by the pages except the two area photos (`area-*.jpg`); delete the rest once production has run the update script.
