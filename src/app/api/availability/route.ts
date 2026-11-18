import { after } from "next/server";
import { db } from "@/lib/db";
import { blockedNights } from "@/lib/availability";
import { syncIfStale } from "@/lib/channel";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const p = await db.property.findUnique({ where: { slug }, select: { id: true } });
  if (!p) return Response.json({ error: "not_found" }, { status: 404 });
  const blocked = await blockedNights(p.id);
  // Refresh from Airbnb after answering, so the calendar is never slowed down but is fresher for the next visitor.
  after(() => syncIfStale(p.id, 60));
  return Response.json({ blocked });
}
