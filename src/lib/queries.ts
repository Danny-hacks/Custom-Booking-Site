import "server-only";
import { cache } from "react";
import { db } from "./db";
import { view } from "./property";

export const getProperty = cache(async (slug: string) => {
  const p = await db.property.findFirst({ where: { slug, status: "published" } });
  return p ? view(p) : null;
});

export const getFeatured = cache(async () => {
  const p = await db.property.findFirst({ where: { status: "published" }, orderBy: { createdAt: "asc" } });
  return p ? view(p) : null;
});

export const getPublished = cache(async () => {
  const rows = await db.property.findMany({ where: { status: "published" }, orderBy: { createdAt: "asc" } });
  return rows.map(view);
});

/** Lowest nightly rate across base and seasons, shown as "from €X". */
export const fromPrice = (p: { baseNight: number; seasons: { night: number }[] }) =>
  Math.min(p.baseNight, ...p.seasons.map((s) => s.night));
