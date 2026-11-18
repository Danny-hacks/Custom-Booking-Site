import type { Metadata } from "next";

const TITLES = {
  account: { en: "Account", fr: "Compte" },
  checkout: { en: "Checkout", fr: "Réservation" },
  confirmed: { en: "Booking confirmed", fr: "Réservation confirmée" },
  contact: { en: "Contact", fr: "Contact" },
  faq: { en: "FAQ", fr: "FAQ" },
  payment: { en: "Payment", fr: "Paiement" },
  stays: { en: "Stays", fr: "Séjours" },
} as const;

/** Per-language <title> for the simple pages (the site name is appended by the layout template). */
export function titleMeta(key: keyof typeof TITLES, noindex = false) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const locale = (await params).locale === "fr" ? "fr" : "en";
    return { title: TITLES[key][locale], ...(noindex ? { robots: { index: false } } : {}) };
  };
}
