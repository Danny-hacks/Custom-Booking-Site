import Link from "next/link";
import { db } from "@/lib/db";
import { addDays, eachNight, eur, fmtDate, today } from "@/lib/dates";
import { Icon } from "@/components/Icon";
import { SourceBadge } from "@/components/admin/Badges";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const now = today();
  const horizon = addDays(now, 60);
  const [upcoming, props, paid, refunds, recent] = await Promise.all([
    db.booking.findMany({ where: { status: "confirmed", checkOut: { gte: now } }, include: { property: true }, orderBy: { checkIn: "asc" } }),
    db.property.findMany(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    db.refund.aggregate({ _sum: { amount: true } }),
    db.booking.findMany({ where: { source: "direct" }, orderBy: { createdAt: "desc" }, take: 6, include: { property: true } }),
  ]);

  const booked = new Set<string>();
  for (const b of upcoming) for (const n of eachNight(b.checkIn, b.checkOut)) if (n >= now && n < horizon) booked.add(n);
  const occupancy = Math.round((booked.size / (60 * Math.max(1, props.length))) * 100);
  const next = upcoming[0];
  const bySource = upcoming.reduce<Record<string, number>>((a, b) => ({ ...a, [b.source]: (a[b.source] ?? 0) + 1 }), {});
  const net = (paid._sum.amount ?? 0) - (refunds._sum.amount ?? 0);

  const stat = (icon: string, label: string, value: string, sub?: string) => (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-tint text-brand-deep"><Icon name={icon} size={22} /></span>
      <p className="mt-4 text-sm text-ink-soft">{label}</p>
      <p className="serif text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl">Overview</h1><p className="text-ink-soft">All channels, one calendar.</p></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat("calcheck", "Upcoming stays", String(upcoming.length), Object.entries(bySource).map(([k, v]) => `${v} ${k}`).join(" · ") || undefined)}
        {stat("sun", "Next arrival", next ? fmtDate(next.checkIn, "en", { day: "numeric", month: "short" }) : "None", next ? `${next.guestName} · ${next.nights} nights` : undefined)}
        {stat("chart", "Occupancy, next 60 days", `${occupancy}%`)}
        {stat("euro", "Direct revenue (net)", eur(net), `${eur(refunds._sum.amount ?? 0)} refunded`)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-xl">Recent direct bookings</h2>
          <ul className="mt-3 divide-y divide-line">
            {recent.length === 0 && <li className="py-4 text-ink-soft">No direct bookings yet.</li>}
            {recent.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/bookings/${b.ref}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-canvas/60">
                  <span><strong>{b.guestName}</strong> <span className="text-ink-soft">· {fmtDate(b.checkIn, "en")} → {fmtDate(b.checkOut, "en")}</span></span>
                  <span className="flex items-center gap-3"><span className="text-sm">{eur(b.total)}</span><SourceBadge status={b.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-xl">Airbnb calendar</h2>
          <ul className="mt-3 space-y-4">
            {props.map((p) => (
              <li key={p.id} className="text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-ink-soft">{p.icalImportUrl ? (p.lastSyncNote?.startsWith("Sync failed") ? "Problem with the Airbnb link" : "Connected to Airbnb") : "Not connected yet"}</p>
                <p className="text-ink-soft">{p.lastSyncAt ? `Checked ${p.lastSyncAt.toLocaleString("en-GB")}` : "Never checked"}</p>
              </li>
            ))}
          </ul>
          <Link href="/admin/sync" className="btn-ghost mt-4 !min-h-10"><Icon name="sync" size={16} /> Open calendar sync</Link>
        </section>
      </div>
    </div>
  );
}
