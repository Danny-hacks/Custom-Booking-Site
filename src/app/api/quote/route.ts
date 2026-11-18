import { db } from "@/lib/db";
import { view } from "@/lib/property";
import { priceStay } from "@/lib/offers";
import { isAvailable } from "@/lib/availability";
import { syncIfStale } from "@/lib/channel";
import { diffDays, isValidISO, today } from "@/lib/dates";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const from = q.get("from"), to = q.get("to");
  const adults = Math.max(1, Math.min(20, Number(q.get("adults") ?? 2) || 2));
  const row = await db.property.findUnique({ where: { slug: q.get("slug") ?? "" } });
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  if (!isValidISO(from) || !isValidISO(to) || diffDays(from, to) < 1 || diffDays(from, to) > 60 || from < today())
    return Response.json({ error: "invalid_dates" }, { status: 400 });
  const p = view(row);
  await syncIfStale(p.id, 60); // check Airbnb's latest bookings before promising these dates
  if (!(await isAvailable(p.id, from, to))) return Response.json({ error: "unavailable" }, { status: 409 });
  const { quote: r, offer, codeInvalid } = await priceStay(p, from, to, adults, q.get("locale") === "fr" ? "fr" : "en", q.get("code") ?? undefined);
  return Response.json({
    ...r,
    avg: Math.round((r.accommodation - r.discount) / r.nights),
    offer: offer ? { title: offer.title, badge: offer.badge } : null,
    codeInvalid,
  });
}
