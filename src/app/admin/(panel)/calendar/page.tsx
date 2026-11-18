import Link from "next/link";
import { db } from "@/lib/db";
import { eachNight, iso, today } from "@/lib/dates";
import { adminDeleteBlock, adminManualBooking } from "../../actions";

export const metadata = { title: "Calendar" };

const color: Record<string, string> = {
  direct: "bg-leaf text-white",
  airbnb: "bg-[#d5483e] text-white",
  manual: "bg-navy text-white",
  block: "bg-[#b9ad98] text-ink",
};

export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  const sp = await searchParams;
  const props = await db.property.findMany({ orderBy: { createdAt: "asc" } });
  const pid = typeof sp.p === "string" ? sp.p : props[0]?.id;
  const offset = Number(typeof sp.m === "string" ? sp.m : 0) || 0;
  if (!pid) return <p>Add a property first.</p>;
  const bookings = await db.booking.findMany({
    where: { propertyId: pid, OR: [{ status: "confirmed" }, { status: "hold", holdExpiresAt: { gt: new Date() } }] },
  });
  const byNight = new Map<string, (typeof bookings)[number]>();
  for (const b of bookings) for (const n of eachNight(b.checkIn, b.checkOut)) byNight.set(n, b);

  const t0 = new Date();
  const months = [0, 1, 2].map((i) => new Date(Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth() + offset + i, 1)));
  const now = today();
  const fmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const err = typeof sp.err === "string" ? sp.err : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Calendar</h1>
        <div className="flex gap-2 text-sm font-semibold">
          <Link className="btn-ghost !min-h-9" href={`/admin/calendar?p=${pid}&m=${offset - 3}`}>Earlier</Link>
          <Link className="btn-ghost !min-h-9" href={`/admin/calendar?p=${pid}&m=${offset + 3}`}>Later</Link>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-3 text-sm">
        {Object.entries(color).map(([k, c]) => <li key={k} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-sm ${c.split(" ")[0]}`} /> <span className="capitalize">{k}</span></li>)}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {months.map((m) => {
          const lead = (m.getUTCDay() + 6) % 7;
          const days = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
          const cells: (string | null)[] = Array(lead).fill(null);
          for (let i = 1; i <= days; i++) cells.push(iso(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), i))));
          return (
            <section key={m.toISOString()} className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="serif mb-3 text-lg capitalize">{fmt.format(m)}</h2>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink-soft">{["M", "T", "W", "T", "F", "S", "S"].map((x, i) => <span key={i}>{x}</span>)}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const b = byNight.get(d);
                  const cls = b ? color[b.source] ?? "bg-line" : d < now ? "bg-canvas text-ink-soft/50" : "bg-canvas";
                  const inner = <span className={`grid h-10 place-items-center rounded-md text-sm ${cls} ${b?.status === "hold" ? "opacity-60" : ""}`} title={b ? `${b.guestName} (${b.source})` : undefined}>{Number(d.slice(8))}</span>;
                  return b ? <Link key={d} href={`/admin/bookings/${b.ref}`}>{inner}</Link> : <span key={d}>{inner}</span>;
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-8 max-w-3xl rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-xl">Add a block or manual booking</h2>
        <p className="text-sm text-ink-soft">Blocks and manual bookings are included in the calendar feed that Airbnb imports.</p>
        {err && <p role="alert" className="mt-3 text-sm text-danger">{err === "clash" ? "Those dates overlap an existing booking." : "Check the dates."}</p>}
        <form action={adminManualBooking} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="propertyId" value={pid} />
          <div><label className="label" htmlFor="kind">Type</label><select id="kind" name="kind" className="field"><option value="block">Block dates</option><option value="manual">Manual booking</option></select></div>
          <div><label className="label" htmlFor="from">From</label><input id="from" name="from" type="date" required className="field" /></div>
          <div><label className="label" htmlFor="to">To (departure)</label><input id="to" name="to" type="date" required className="field" /></div>
          <div><label className="label" htmlFor="name">Guest / note</label><input id="name" name="name" className="field" /></div>
          <button className="btn sm:w-fit">Save</button>
        </form>
        <ul className="mt-5 divide-y divide-line text-sm">
          {bookings.filter((b) => ["block", "manual"].includes(b.source) && b.checkOut >= now).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2"><span>{b.guestName}: {b.checkIn} → {b.checkOut}</span>
              <form action={adminDeleteBlock.bind(null, b.ref)}><button className="font-semibold text-danger underline">Remove</button></form></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
