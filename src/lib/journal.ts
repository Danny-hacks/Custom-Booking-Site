import { db } from "./db";
import type { Locale } from "./property";

export const POST_CATEGORIES = [
  { key: "guide", label: { en: "Guides", fr: "Guides" } },
  { key: "season", label: { en: "Seasons", fr: "Saisons" } },
  { key: "family", label: { en: "With children", fr: "En famille" } },
  { key: "food", label: { en: "Food & markets", fr: "Table & marchés" } },
] as const;

export type PostView = {
  id: string;
  slug: string;
  category: string;
  cover: string;
  coverCredit: string;
  places: string[];
  title: string;
  excerpt: string;
  body: string;
  publishedAt: Date;
};

type Row = Awaited<ReturnType<typeof db.post.findMany>>[number];

/** French falls back to English while a translation is missing, so a half-written post never shows blank. */
export function postView(p: Row, locale: Locale): PostView {
  const fr = locale === "fr";
  return {
    id: p.id,
    slug: p.slug,
    category: p.category,
    cover: p.cover,
    coverCredit: p.coverCredit,
    places: p.places.split(",").map((x) => x.trim()).filter(Boolean),
    title: (fr && p.titleFr) || p.titleEn,
    excerpt: (fr && p.excerptFr) || p.excerptEn,
    body: (fr && p.bodyFr) || p.bodyEn,
    publishedAt: p.publishedAt,
  };
}

export async function livePosts(locale: Locale, take?: number) {
  const rows = await db.post.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take }).catch(() => []);
  return rows.map((r) => postView(r, locale));
}

export async function livePost(slug: string, locale: Locale) {
  const r = await db.post.findFirst({ where: { slug, published: true, publishedAt: { lte: new Date() } } }).catch(() => null);
  return r ? postView(r, locale) : null;
}

export const slugify = (x: string) =>
  x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
