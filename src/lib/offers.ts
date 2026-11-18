import "server-only";
import { db } from "./db";
import { diffDays, today } from "./dates";
import { quote, type Quote } from "./pricing";
import type { PriceInput } from "./pricing";
import type { Locale } from "./property";

type Row = Awaited<ReturnType<typeof db.offer.findMany>>[number];

/** An offer resolved for one language, safe to hand to client components. */
export type OfferView = {
  id: string;
  title: string;
  body: string;
  badge: string;
  kind: "percent" | "fixed" | "none";
  value: number;
  code: string | null;
  minNights: number;
  bookTo: string | null;
  stayFrom: string | null;
  stayTo: string | null;
  propertyId: string | null;
  imageUrl: string | null;
  showBanner: boolean;
  showPopup: boolean;
  showCard: boolean;
};

export function offerView(o: Row, locale: Locale): OfferView {
  const fr = locale === "fr";
  const badge = (fr ? o.badgeFr : o.badgeEn) || (o.kind === "percent" ? `-${o.value}%` : o.kind === "fixed" ? `-${Math.round(o.value / 100)} €` : "");
  return {
    id: o.id,
    title: (fr ? o.titleFr : o.titleEn) || o.titleEn,
    body: (fr ? o.bodyFr : o.bodyEn) || o.bodyEn,
    badge,
    kind: o.kind as OfferView["kind"],
    value: o.value,
    code: o.code,
    minNights: o.minNights,
    bookTo: o.bookTo,
    stayFrom: o.stayFrom,
    stayTo: o.stayTo,
    propertyId: o.propertyId,
    imageUrl: o.imageUrl,
    showBanner: o.showBanner,
    showPopup: o.showPopup,
    showCard: o.showCard,
  };
}

/** Offers that can be booked today (active and inside their booking window). */
export async function liveOffers(locale: Locale, propertyId?: string) {
  const day = today();
  const rows = await db.offer.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ bookFrom: null }, { bookFrom: { lte: day } }] },
        { OR: [{ bookTo: null }, { bookTo: { gte: day } }] },
        ...(propertyId ? [{ OR: [{ propertyId: null }, { propertyId }] }] : []),
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => offerView(r, locale));
}

export function discountFor(accommodation: number, o: Pick<OfferView, "kind" | "value">) {
  if (o.kind === "percent") return Math.round((accommodation * Math.min(100, o.value)) / 100);
  if (o.kind === "fixed") return Math.min(accommodation, o.value);
  return 0;
}

const norm = (c?: string | null) => (c ?? "").trim().toUpperCase();

export function appliesTo(o: OfferView, stay: { propertyId: string; from: string; to: string }) {
  if (o.propertyId && o.propertyId !== stay.propertyId) return false;
  if (diffDays(stay.from, stay.to) < o.minNights) return false;
  if (o.stayFrom && stay.from < o.stayFrom) return false;
  if (o.stayTo && stay.to > o.stayTo) return false;
  return true;
}

export type PricedStay = { quote: Quote; offer: OfferView | null; codeInvalid: boolean };

/** Price a stay and apply the single best offer: automatic ones, or the one matching the promo code. No stacking. */
export async function priceStay(
  p: PriceInput & { id: string },
  from: string,
  to: string,
  adults: number,
  locale: Locale,
  code?: string,
): Promise<PricedStay> {
  const base = quote(p, from, to, adults);
  const stay = { propertyId: p.id, from, to };
  const offers = (await liveOffers(locale, p.id)).filter((o) => o.kind !== "none" && appliesTo(o, stay));
  const entered = norm(code);
  const usable = offers.filter((o) => !o.code || norm(o.code) === entered);
  const codeInvalid = !!entered && !offers.some((o) => norm(o.code) === entered);
  let best: OfferView | null = null;
  let bestOff = 0;
  for (const o of usable) {
    const off = discountFor(base.accommodation, o);
    if (off > bestOff) { best = o; bestOff = off; }
  }
  return { quote: best ? quote(p, from, to, adults, { discount: bestOff, title: best.title }) : base, offer: best, codeInvalid };
}

/** Where an offer sends the guest: the property booking box, with the promo code pre-filled. */
export function offerHref(o: Pick<OfferView, "code">, locale: Locale, slug: string) {
  return `/${locale}/properties/${slug}${o.code ? `?code=${encodeURIComponent(o.code)}` : ""}#book`;
}
