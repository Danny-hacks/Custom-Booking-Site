import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate, today } from "@/lib/dates";
import { Icon } from "@/components/Icon";
import { SyncPanel } from "@/components/admin/SyncPanel";
import { CopyField } from "@/components/admin/CopyField";
import { saveSyncSettings, syncNow, testFeed, connectDemoFeed } from "../../actions";

export const metadata = { title: "Calendar sync" };

function ago(d: Date) {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

function health(p: { icalImportUrl: string | null; lastSyncAt: Date | null; lastSyncNote: string | null }) {
  if (!p.icalImportUrl) return { label: "Not connected yet", tone: "bg-line text-ink-soft", detail: "Follow the two steps below to connect Airbnb." };
  if (p.lastSyncNote?.startsWith("Sync failed")) return { label: "Problem", tone: "bg-[#fdecea] text-danger", detail: p.lastSyncNote.replace("Sync failed: ", "") };
  if (!p.lastSyncAt) return { label: "Connected, not run yet", tone: "bg-[#fdf1d6] text-[#7a5200]", detail: "Press “Sync now” to bring Airbnb’s dates in." };
  if (Date.now() - p.lastSyncAt.getTime() > 60 * 60_000) return { label: "Out of date", tone: "bg-[#fdf1d6] text-[#7a5200]", detail: `Last checked ${ago(p.lastSyncAt)}. The automatic check is not running (see “Run it automatically” below).` };
  return { label: "Working", tone: "bg-[#dff3e8] text-leaf", detail: `Last checked ${ago(p.lastSyncAt)}. ${p.lastSyncNote ?? ""}` };
}

export default async function SyncPage({ searchParams }: PageProps<"/admin/sync">) {
  const sp = await searchParams;
  const props = await db.property.findMany({ orderBy: { createdAt: "asc" } });
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  const local = /localhost|127\.0\.0\.1/.test(site);
  const dev = process.env.NODE_ENV !== "production";

  const data = await Promise.all(
    props.map(async (p) => ({
      p,
      imported: await db.booking.findMany({
        where: { propertyId: p.id, externalUid: { not: null }, status: "confirmed", checkOut: { gte: today() } },
        orderBy: { checkIn: "asc" },
        take: 6,
      }),
      sending: await db.booking.count({
        where: { propertyId: p.id, externalUid: null, source: { in: ["direct", "manual", "block"] }, status: "confirmed", checkOut: { gte: today() } },
      }),
    })),
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl">Calendar sync</h1>
      <p className="mt-1 text-ink-soft">Keeps Airbnb and this website from selling the same dates twice. Dates booked on one show up as booked on the other.</p>

      {sp.saved && <p role="status" className="mt-5 rounded-xl bg-[#dff3e8] p-3 text-leaf">Saved. The first sync has run, see the result below.</p>}
      {sp.synced && <p role="status" className="mt-5 rounded-xl bg-[#dff3e8] p-3 text-leaf">Sync finished.</p>}
      {sp.err && <p role="alert" className="mt-5 rounded-xl bg-[#fdecea] p-3 text-danger">That does not look like a web link. It should start with https://</p>}

      {/* the picture in one glance */}
      <div className="mt-6 grid items-center gap-3 rounded-2xl border border-line bg-paper p-5 text-center text-sm sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl bg-tint p-3"><p className="font-bold">Airbnb</p><p className="text-ink-soft">your Airbnb bookings</p></div>
        <div className="space-y-1 text-ink-soft"><p>→ <strong className="text-ink">Step 2</strong>: Airbnb copies our dates →</p><p>← <strong className="text-ink">Step 1</strong>: we copy Airbnb’s dates ←</p></div>
        <div className="rounded-xl bg-tint p-3"><p className="font-bold">This website</p><p className="text-ink-soft">direct bookings</p></div>
      </div>

      {data.map(({ p, imported, sending }) => {
        const h = health(p);
        return (
          <section key={p.id} className="mt-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl">{p.name}</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${h.tone}`}>{h.label}</span>
            </div>
            <p className="-mt-2 text-ink-soft">{h.detail}</p>

            <div className="rounded-2xl border border-line bg-paper p-5">
              <h3 className="flex items-center gap-2 text-lg"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm text-white">1</span> Bring Airbnb’s bookings here</h3>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] text-ink-soft">
                <li>In Airbnb, open your listing’s <strong className="text-ink">Calendar</strong>, then <strong className="text-ink">Availability settings</strong>, then <strong className="text-ink">Connect calendars</strong>.</li>
                <li>Choose <strong className="text-ink">Export calendar</strong> and copy the link.</li>
                <li>Paste it below, press <strong className="text-ink">Test this link first</strong>, then <strong className="text-ink">Save and sync now</strong>.</li>
              </ol>
              <div className="mt-4">
                <SyncPanel
                  url={p.icalImportUrl ?? ""}
                  beds24Id={p.beds24Id ?? ""}
                  save={saveSyncSettings.bind(null, p.id)}
                  test={testFeed.bind(null, p.id)}
                />
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">Currently imported from Airbnb {imported.length > 0 && <span className="font-normal text-ink-soft">(next {imported.length})</span>}</p>
                  <form action={syncNow.bind(null, p.id)}><button className="btn-ghost !min-h-10" disabled={!p.icalImportUrl}><Icon name="sync" size={16} /> Sync now</button></form>
                </div>
                {imported.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-soft">Nothing imported yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {imported.map((b) => (
                      <li key={b.id} className="flex flex-wrap justify-between gap-2 py-2">
                        <span>{fmtDate(b.checkIn, "en")} → {fmtDate(b.checkOut, "en")} · {b.nights} night{b.nights === 1 ? "" : "s"}</span>
                        <span className="text-ink-soft">{b.source === "airbnb" ? "Airbnb reservation" : "Blocked on Airbnb"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-5">
              <h3 className="flex items-center gap-2 text-lg"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm text-white">2</span> Send our bookings to Airbnb</h3>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] text-ink-soft">
                <li>Copy the link below.</li>
                <li>In Airbnb, <strong className="text-ink">Connect calendars</strong>, then <strong className="text-ink">Import calendar</strong>. Paste the link, name it “Direct website”, and save.</li>
              </ol>
              <div className="mt-4"><CopyField label="Our calendar link" value={`${site}/api/ical/${p.icalToken}.ics`} /></div>
              <p className="mt-2 text-sm text-ink-soft">
                Right now it shares <strong className="text-ink">{sending}</strong> upcoming booking{sending === 1 ? "" : "s"} or block{sending === 1 ? "" : "s"}.{" "}
                <a href={`${site}/api/ical/${p.icalToken}.ics`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">Preview it</a>
              </p>
              {local && (
                <p className="mt-3 flex gap-2 rounded-xl bg-[#fdf1d6] p-3 text-sm text-[#7a5200]"><Icon name="warn" size={18} className="mt-0.5 shrink-0" /> <span>This link points to <code>{site}</code>, which Airbnb cannot reach. It will work once the site is online and <code>SITE_URL</code> is set to the real address.</span></p>
              )}
              <p className="mt-3 flex gap-2 rounded-xl bg-tint p-3 text-sm"><Icon name="info" size={18} className="mt-0.5 shrink-0 text-brand" /> <span>Airbnb only re-reads our link every few hours (that is Airbnb’s own limit, we cannot speed it up). For instant two-way sync later, switch on the Beds24 option.</span></p>
            </div>
          </section>
        );
      })}

      <section className="mt-8 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-xl">Run it automatically</h2>
        <p className="mt-1 text-[15px] text-ink-soft">Step 1 only happens when something asks for it. Set up a scheduled job to call this address every 15 minutes (a free service such as cron-job.org works, or Vercel Cron):</p>
        <p className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-sm">{site}/api/cron/sync?secret=<span className="text-ink-soft">your CRON_SECRET</span></p>
        <p className="mt-2 text-sm text-ink-soft">The secret is the <code>CRON_SECRET</code> value in the site settings. If this job stops, the status at the top turns to “Out of date”.</p>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-xl">How to check that it really works</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-[15px] text-ink-soft">
          <li><strong className="text-ink">Airbnb to this site.</strong> In Airbnb, block two future dates (select them in the calendar and mark them not available). Press <em>Sync now</em> here. A “Blocked on Airbnb” line appears above and the dates turn unavailable on the booking page. Unblock them in Airbnb, sync again, and they free up.</li>
          <li><strong className="text-ink">This site to Airbnb.</strong> In <Link href="/admin/calendar" className="font-semibold text-brand underline">Calendar</Link>, add an owner block on a far-away date. Check it appears when you press “Preview it” in step 2. Airbnb will show it as unavailable after its next refresh (a few hours). Delete the block afterwards.</li>
          <li><strong className="text-ink">No loops.</strong> After a day, make sure no dates are duplicated in the Calendar and that removing the test block also frees the date on Airbnb.</li>
        </ol>
        {dev && props[0] && (
          <div className="mt-5 rounded-xl border border-dashed border-brand/50 bg-tint p-4">
            <p className="font-semibold">Developer test (hidden on the live site)</p>
            <p className="mt-1 text-sm text-ink-soft">No Airbnb account needed: this points step 1 at a pretend Airbnb calendar with one reservation, one block, and an echo of one of our own bookings. Use the extra links to simulate a cancellation, a date change and a broken link, then press Sync now.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <form action={connectDemoFeed.bind(null, props[0].id)}><button className="btn-ghost !min-h-10">Use the pretend Airbnb calendar</button></form>
              <a className="text-sm font-semibold text-brand underline" href="/api/dev/airbnb-mock" target="_blank">normal</a>
              <a className="text-sm font-semibold text-brand underline" href="/api/dev/airbnb-mock?drop=res" target="_blank">cancelled</a>
              <a className="text-sm font-semibold text-brand underline" href="/api/dev/airbnb-mock?shift=1" target="_blank">dates moved</a>
              <a className="text-sm font-semibold text-brand underline" href="/api/dev/airbnb-mock?broken=1" target="_blank">broken link</a>
            </div>
            <p className="mt-2 text-xs text-ink-soft">To try a variation, paste e.g. <code>{site}/api/dev/airbnb-mock?drop=res</code> into the Airbnb link field and save.</p>
          </div>
        )}
      </section>
    </div>
  );
}
