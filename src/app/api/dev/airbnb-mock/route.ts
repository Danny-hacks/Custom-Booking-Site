import { db } from "@/lib/db";
import { addDays, today } from "@/lib/dates";
import { buildIcs } from "@/lib/ical";

/**
 * DEVELOPMENT ONLY. A pretend Airbnb calendar so the sync can be tried without an Airbnb account.
 *   (no params)  one reservation, one owner block, and one echo of our own booking
 *   ?drop=res    the reservation is gone (a guest cancelled on Airbnb)
 *   ?shift=1     the reservation moved one day later (dates changed on Airbnb)
 *   ?broken=1    answers with a web page instead of a calendar (a wrong link)
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  if (q.get("broken")) return new Response("<html><body>Please log in</body></html>", { headers: { "Content-Type": "text/html" } });

  const t = today();
  const shift = Number(q.get("shift") ?? 0);
  const events = [];
  if (q.get("drop") !== "res") {
    events.push({ uid: "demo-reservation-1@airbnb.com", start: addDays(t, 40 + shift), end: addDays(t, 44 + shift), summary: "Reserved" });
  }
  events.push({ uid: "demo-block-1@airbnb.com", start: addDays(t, 70), end: addDays(t, 72), summary: "Airbnb (Not available)" });

  // Airbnb publishes dates blocked by an imported calendar back as "Not available". Mimic that for our first direct booking.
  const own = await db.booking.findFirst({
    where: { externalUid: null, source: "direct", status: "confirmed", checkOut: { gte: t } },
    orderBy: { checkIn: "asc" },
  });
  if (own) events.push({ uid: "demo-echo-1@airbnb.com", start: own.checkIn, end: own.checkOut, summary: "Airbnb (Not available)" });

  return new Response(buildIcs("Airbnb demo", events), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
}
