import { db } from "@/lib/db";
import { channel, isBeds24, pushRatesSafely } from "@/lib/channel";

/**
 * Pulls Airbnb's calendar for every published property. Schedule it every 10-15 minutes.
 * Authorised either by `?secret=CRON_SECRET` (cron-job.org etc.) or by `Authorization: Bearer CRON_SECRET` (Vercel Cron).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || given !== secret) return new Response("Forbidden", { status: 403 });
  const props = await db.property.findMany({ where: { status: "published" } });
  const out = [];
  for (const p of props) {
    const row: Record<string, unknown> = { slug: p.slug, ...(await channel().pull(p)) };
    // once a day the price window moves forward by a day, so a full year stays bookable on Airbnb and Booking.com
    if (isBeds24() && p.beds24Id && (!p.ratesPushedAt || Date.now() - p.ratesPushedAt.getTime() > 20 * 3600_000)) row.rates = (await pushRatesSafely(p)).note;
    out.push(row);
  }
  return Response.json(out);
}
