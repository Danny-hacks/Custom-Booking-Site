import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

/** Every public page in both languages, with hreflang alternates. Properties come from the database. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const props = await db.property.findMany({ where: { status: "published" }, select: { slug: true } }).catch(() => []);
  const paths = ["", "/properties", "/offers", "/area", "/reviews", "/faq", "/contact", "/legal/terms", "/legal/privacy", ...props.map((p) => `/properties/${p.slug}`)];
  return paths.flatMap((p) =>
    (["en", "fr"] as const).map((l) => ({
      url: `${base}/${l}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p.startsWith("/properties/") ? 0.9 : 0.6,
      alternates: { languages: { en: `${base}/en${p}`, fr: `${base}/fr${p}` } },
    })),
  );
}
