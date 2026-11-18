import { db } from "@/lib/db";
import { buildIcs } from "@/lib/ical";

/**
 * Calendar feed for Airbnb (and any other platform) to import: our own direct, manual and held stays and owner blocks.
 * Dates we imported FROM Airbnb are excluded on purpose (externalUid is set on those). Sending them back would create
 * a loop where a cancelled booking's block never clears.
 */
export async function GET(_: Request, ctx: RouteContext<"/api/ical/[token]">) {
  const { token } = await ctx.params;
  const p = await db.property.findFirst({ where: { icalToken: token.replace(/\.ics$/, "") } });
  if (!p) return new Response("Not found", { status: 404 });
  const rows = await db.booking.findMany({
    where: {
      propertyId: p.id,
      externalUid: null,
      source: { in: ["direct", "manual", "block"] },
      OR: [{ status: "confirmed" }, { status: "hold", holdExpiresAt: { gt: new Date() } }],
    },
  });
  const ics = buildIcs(
    p.name,
    rows.map((b) => ({ uid: `${b.ref}@lestrebaldie`, start: b.checkIn, end: b.checkOut, summary: "Reserved" })),
  );
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
  });
}
