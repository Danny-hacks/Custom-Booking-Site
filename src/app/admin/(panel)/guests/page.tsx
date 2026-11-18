import { db } from "@/lib/db";
import { eur, fmtDate } from "@/lib/dates";

export const metadata = { title: "Guests" };

export default async function Guests() {
  const bookings = await db.booking.findMany({ where: { source: "direct", status: "confirmed" }, orderBy: { checkIn: "desc" } });
  const map = new Map<string, { name: string; email: string; stays: number; spent: number; last: string }>();
  for (const b of bookings) {
    const g = map.get(b.guestEmail) ?? { name: b.guestName, email: b.guestEmail, stays: 0, spent: 0, last: b.checkIn };
    g.stays++; g.spent += b.total; if (b.checkIn > g.last) g.last = b.checkIn;
    map.set(b.guestEmail, g);
  }
  const users = await db.user.count({ where: { role: "guest" } });
  return (
    <div>
      <h1 className="text-3xl">Guests</h1>
      <p className="text-ink-soft">{users} registered accounts · direct-booking guests below.</p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[560px] text-left text-[15px]">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft"><tr><th className="p-3">Guest</th><th className="p-3">Stays</th><th className="p-3">Last stay</th><th className="p-3 text-right">Spent</th></tr></thead>
          <tbody className="divide-y divide-line">
            {[...map.values()].length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink-soft">No direct guests yet.</td></tr>}
            {[...map.values()].map((g) => (
              <tr key={g.email}><td className="p-3">{g.name}<span className="block text-xs text-ink-soft">{g.email}</span></td><td className="p-3">{g.stays}</td><td className="p-3">{fmtDate(g.last, "en")}</td><td className="p-3 text-right">{eur(g.spent)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
