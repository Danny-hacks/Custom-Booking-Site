import { db } from "@/lib/db";
import { channel } from "@/lib/channel";

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
  for (const p of props) out.push({ slug: p.slug, ...(await channel().pull(p)) });
  return Response.json(out);
}
