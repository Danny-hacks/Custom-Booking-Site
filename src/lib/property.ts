import type { Property } from "@prisma/client";

export type Locale = "en" | "fr";
export const LOCALES: Locale[] = ["en", "fr"];

export type Photo = { src: string; alt_en: string; alt_fr: string };
export type Amenity = { icon: string; en: string; fr: string };
export type Space = {
  key: string;
  sleeps: number;
  photo: string;
  en: { name: string; blurb: string; facts: string[] };
  fr: { name: string; blurb: string; facts: string[] };
};
export type Season = { name: string; from: string; to: string; night: number };
export type PolicyTier = { daysBefore: number; refundPct: number };
export type Content = Record<
  Locale,
  { tagline: string; summary: string; story: string[]; rules: string[]; highlights: string[] }
>;

export type PropertyView = Omit<
  Property,
  "content" | "photos" | "amenities" | "spaces" | "seasons" | "policy"
> & {
  content: Content;
  photos: Photo[];
  amenities: Amenity[];
  spaces: Space[];
  seasons: Season[];
  policy: PolicyTier[];
};

export function view(p: Property): PropertyView {
  return {
    ...p,
    content: JSON.parse(p.content),
    photos: JSON.parse(p.photos),
    amenities: JSON.parse(p.amenities),
    spaces: JSON.parse(p.spaces),
    seasons: JSON.parse(p.seasons),
    policy: JSON.parse(p.policy),
  };
}
