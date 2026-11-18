import "server-only";
import { db } from "./db";
import type { Locale } from "./property";

/** Headline numbers from the Airbnb listing. Update when the listing's rating changes. */
export const RATING = { score: 4.83, count: 12, url: "https://www.airbnb.com/rooms/1640826718603809309" };

export type ReviewView = {
  id: string; name: string; origin: string; stayLabel: string; rating: number; text: string; source: string;
};

/** Published reviews; placeholder (sample) ones are hidden in production so they can never go live by accident. */
export async function liveReviews(locale: Locale, take = 6): Promise<ReviewView[]> {
  const rows = await db.review.findMany({
    where: { published: true, ...(process.env.NODE_ENV === "production" ? { sample: false } : {}) },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map((r) => ({
    id: r.id, name: r.name, origin: r.origin, stayLabel: r.stayLabel, rating: r.rating, source: r.source,
    text: (locale === "fr" ? r.textFr : r.textEn) || r.textEn,
  }));
}
