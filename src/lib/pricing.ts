import { addDays, diffDays, eachNight } from "./dates";
import type { PolicyTier, Season } from "./property";

export type PriceInput = {
  baseNight: number;
  cleaningFee: number;
  touristTax: number;
  seasons: Season[];
};

export type Quote = {
  nights: number;
  nightly: { date: string; price: number }[];
  accommodation: number;
  cleaning: number;
  tax: number;
  /** amount taken off the accommodation by an offer */
  discount: number;
  offerTitle?: string;
  total: number;
};

function inSeason(date: string, s: Season) {
  const md = date.slice(5);
  return s.from <= s.to ? md >= s.from && md <= s.to : md >= s.from || md <= s.to;
}

export function nightPrice(date: string, p: Pick<PriceInput, "baseNight" | "seasons">) {
  const s = p.seasons.find((x) => inSeason(date, x));
  return s ? s.night : p.baseNight;
}

export function quote(p: PriceInput, from: string, to: string, adults: number, offer?: { discount: number; title: string }): Quote {
  const nightly = eachNight(from, to).map((date) => ({ date, price: nightPrice(date, p) }));
  const accommodation = nightly.reduce((a, n) => a + n.price, 0);
  const tax = Math.max(0, adults) * nightly.length * p.touristTax;
  const discount = Math.min(accommodation, offer?.discount ?? 0);
  return {
    nights: nightly.length,
    nightly,
    accommodation,
    cleaning: p.cleaningFee,
    tax,
    discount,
    offerTitle: discount ? offer?.title : undefined,
    total: accommodation - discount + p.cleaningFee + tax,
  };
}

/** Refund share (0-100) for a guest-initiated cancellation made `today` for a stay starting `checkIn`. */
export function refundPct(policy: PolicyTier[], checkIn: string, today: string) {
  const days = diffDays(today, checkIn);
  const tiers = [...policy].sort((a, b) => b.daysBefore - a.daysBefore);
  for (const t of tiers) if (days >= t.daysBefore) return t.refundPct;
  return 0;
}

export { addDays };
