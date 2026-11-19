import type { Locale } from "./property";
import credits from "./area-credits.json";

export type AreaPhoto = keyof typeof credits;
/** Author and licence of every area photo (Wikimedia Commons). Shown on the Area page, as the licences require. */
export const AREA_CREDITS = credits;

type L = Record<Locale, string>;
export type Place = { name: string; nameFr?: string; tag: L; text: L; icon: string; image?: string; photo?: AreaPhoto; drive?: string };

/**
 * Six highlights, kept short on purpose. Only the Conques drive time (from the earlier copy) is filled in;
 * confirm it with the owner and add `drive: "30 min"` to other places to show a badge.
 */
export const PLACES: Place[] = [
  {
    name: "Conques", icon: "pin", image: "/img/area/conques.jpg", photo: "conques", drive: "25 min",
    tag: { en: "Pilgrim village", fr: "Village de pèlerinage" },
    text: { en: "A Romanesque abbey and steep stone lanes on the Way of St James.", fr: "Une abbatiale romane et des ruelles de pierre sur le chemin de Saint-Jacques." },
  },
  {
    name: "Belcastel", icon: "pin", image: "/img/area/belcastel.jpg", photo: "belcastel",
    tag: { en: "Most beautiful villages", fr: "Plus beaux villages" },
    text: { en: "A castle, a river and a stone bridge in one frame.", fr: "Un château, une rivière et un pont de pierre dans le même cadre." },
  },
  {
    name: "Gorges & rivers", nameFr: "Gorges & rivières", icon: "mountains", image: "/img/area/gorges.jpg", photo: "gorges",
    tag: { en: "Swim · kayak · picnic", fr: "Baignade · kayak · pique-nique" },
    text: { en: "Quiet river stretches to paddle, swim or picnic beside.", fr: "Des tronçons de rivière tranquilles pour pagayer, se baigner ou pique-niquer." },
  },
  {
    name: "Rodez", icon: "star", image: "/img/area/rodez.jpg", photo: "rodez",
    tag: { en: "Soulages Museum", fr: "Musée Soulages" },
    text: { en: "The Soulages Museum, a red-sandstone cathedral and market days.", fr: "Le musée Soulages, une cathédrale de grès rouge et des jours de marché." },
  },
  {
    name: "Walking & cycling", nameFr: "Balades & vélo", icon: "tree", image: "/img/area/walking.jpg", photo: "walking",
    tag: { en: "From the doorstep", fr: "Depuis la maison" },
    text: { en: "Marked trails start close by, including the Way of St James.", fr: "Des sentiers balisés partent tout près, dont le chemin de Saint-Jacques." },
  },
  {
    name: "Local food", nameFr: "Table du terroir", icon: "dining", image: "/img/area/food.jpg", photo: "food",
    tag: { en: "Aligot · Roquefort · Marcillac", fr: "Aligot · Roquefort · Marcillac" },
    text: { en: "Stretchy aligot, blue cheese and rustic red wine, all local.", fr: "Aligot filant, fromage bleu et vin rouge rustique, tout est local." },
  },
];
