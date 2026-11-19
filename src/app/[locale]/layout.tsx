import { siteBase } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Figtree } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { isLocale } from "@/lib/i18n";
import { currentUser } from "@/lib/session";
import { MobileCta } from "@/components/MobileCta";
import { getFeatured, fromPrice } from "@/lib/queries";
import { eur } from "@/lib/dates";
import { ScrollState } from "@/components/Motion";
import { OfferBanner, OfferPopup } from "@/components/OfferChrome";
import { liveOffers, offerHref } from "@/lib/offers";
import { t } from "@/lib/i18n";

const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const fr = (await params).locale === "fr";
  return {
    metadataBase: new URL(siteBase()),
    openGraph: { type: "website", siteName: "La Bastide de Lestrebaldie", locale: fr ? "fr_FR" : "en_GB", images: [{ url: "/img/photos/outdoor-102.jpg", width: 1800, height: 1197, alt: "La Bastide de Lestrebaldie" }] },
    twitter: { card: "summary_large_image" },
    title: { default: "La Bastide de Lestrebaldie · Gîtes en Aveyron", template: "%s · La Bastide de Lestrebaldie" },
    description: fr
      ? "Une ferme en pierre restaurée avec trois gîtes et une piscine chauffée en Aveyron. Jusqu’à 20 personnes. Réservez en direct."
      : "A restored stone farmhouse with three cottages and a heated pool in Aveyron, France. Up to 20 guests. Book direct.",
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [user, prop, offers] = await Promise.all([
    currentUser(),
    getFeatured(),
    liveOffers(locale),
  ]);
  const slug = prop?.slug ?? "";
  const pub = (o: (typeof offers)[number]) => ({ id: o.id, title: o.title, body: o.body, badge: o.badge, code: o.code, imageUrl: o.imageUrl, href: offerHref(o, locale, slug) });
  const d = t(locale).offers;
  const labels = { claim: d.claim, later: d.later, dismiss: d.dismiss, useCode: d.useCode };
  return (
    <html lang={locale} className={`${body.variable}`}>
      <body className="flex min-h-dvh flex-col max-md:pb-[76px]">
        <noscript><style>{"[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}"}</style></noscript>
        <a href="#content" className="skip-link">{t(locale).nav.skip}</a>
        <ScrollState />
        <OfferBanner offers={offers.filter((o) => o.showBanner).map(pub)} labels={labels} />
        <Header locale={locale} signedIn={!!user} slug={slug} hasOffers={offers.some((o) => o.showCard)} />
        <div id="content" tabIndex={-1} className="flex-1 outline-none">{children}</div>
        <Footer locale={locale} />
        {prop && <MobileCta href={`/${locale}/properties/${slug}#book`} from={t(locale).card.from} price={`${eur(fromPrice(prop), locale)} ${t(locale).card.perNight}`} label={t(locale).card.reserve} />}
        <OfferPopup offers={offers.filter((o) => o.showPopup).map(pub)} labels={labels} />
      </body>
    </html>
  );
}
