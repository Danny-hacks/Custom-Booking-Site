import Link from "next/link";
import { db } from "@/lib/db";
import { eur, fmtDate } from "@/lib/dates";
import { SourceBadge } from "@/components/admin/Badges";

export const metadata = { title: "Bookings" };

const tabs = [["all", "All"], ["direct", "Direct"], ["airbnb", "Airbnb"], ["cancelled", "Cancelled"]];

export default async function Bookings({ searchParams }: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const f = typeof sp.f === "string" ? sp.f : "all";
  const where =
    f === "cancelled" ? { status: "cancelled" } :
    f === "direct" || f === "airbnb" ? { source: f, status: { not: "cancelled" } } :
    { source: { not: "block" }, status: { not: "hold" } };
  const rows = await db.booking.findMany({ where, orderBy: { checkIn: "desc" }, take: 200, include: { property: true } });

  return (
    <div>
      <h1 className="text-3xl">Bookings</h1>
      <div className="mt-5 flex gap-2" role="tablist">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`/admin/bookings?f=${k}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${f === k ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink"}`}>{l}</Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
            <tr><th className="p-3">Ref</th><th className="p-3">Guest</th><th className="p-3">Stay</th><th className="p-3">Source</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink-soft">Nothing here yet.</td></tr>}
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-canvas/60">
                <td className="p-3 font-mono text-sm"><Link className="underline" href={`/admin/bookings/${b.ref}`}>{b.ref}</Link></td>
                <td className="p-3">{b.guestName}<span className="block text-xs text-ink-soft">{b.adults + b.children} guests</span></td>
                <td className="p-3 whitespace-nowrap">{fmtDate(b.checkIn, "en")} → {fmtDate(b.checkOut, "en")}<span className="block text-xs text-ink-soft">{b.nights} nights</span></td>
                <td className="p-3"><SourceBadge source={b.source} /></td>
                <td className="p-3"><SourceBadge status={b.status} /></td>
                <td className="p-3 text-right tabular-nums">{b.total ? eur(b.total) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
