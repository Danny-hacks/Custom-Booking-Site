import { db } from "@/lib/db";
import { blockedNights } from "@/lib/availability";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const p = await db.property.findUnique({ where: { slug }, select: { id: true } });
  if (!p) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ blocked: await blockedNights(p.id) });
}
