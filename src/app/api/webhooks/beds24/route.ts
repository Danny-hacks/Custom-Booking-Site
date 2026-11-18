import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { beds24Channel } from "@/lib/channel/beds24";

/**
 * Beds24 calls this address when a booking is created or changed (Beds24 → Settings → Properties → Access →
 * Booking webhooks, version 2, POST). Beds24 does not sign its webhooks, so the address carries a secret:
 *   https://YOUR-SITE/api/webhooks/beds24?secret=BEDS24_WEBHOOK_SECRET&property=your-property-slug
 * We ignore the payload and read the property's bookings again, so a malformed or forged body can never change our data.
 */
function allowed(given: string | null) {
  const secret = process.env.BEDS24_WEBHOOK_SECRET ?? process.env.CRON_SECRET;
  if (!secret || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request) {
  const url = new URL(req.url);
  if (!allowed(url.searchParams.get("secret"))) return new Response("Forbidden", { status: 403 });
  const slug = url.searchParams.get("property");
  const props = await db.property.findMany({ where: { status: "published", beds24Id: { not: null }, ...(slug ? { slug } : {}) } });
  const results = [];
  for (const p of props) results.push({ slug: p.slug, ...(await beds24Channel.pull(p)) });
  return Response.json({ ok: true, results });
}

export const POST = handle;
export const GET = handle; // Beds24's older (version 1) webhooks use GET
