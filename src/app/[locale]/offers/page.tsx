import type { Metadata } from "next";
import { getFeatured } from "@/lib/queries";
import { liveOffers, offerHref } from "@/lib/offers";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { OfferCard } from "@/components/OfferCard";
import { Reveal } from "@/components/Motion";
import { CtaCard } from "@/components/CtaCard";

export async function generateMetadata({ params }: PageProps<"/[locale]/offers">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return { title: t(locale).offers.title };
}

export default async function OffersPage({ params }: PageProps<"/[locale]/offers">) {
  const locale = (await params).locale as Locale;
  const [offers, p] = await Promise.all([liveOffers(locale), getFeatured()]);
  const d = t(locale).offers;
  const cards = offers.filter((o) => o.showCard);
  return (
    <main>
     <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-12">
      <div className="rise max-w-2xl">
        <p className="eyebrow">{d.nav}</p>
        <h1 className="mt-2 text-[36px] sm:text-[48px]">{d.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{d.lead}</p>
      </div>
      {cards.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line p-12 text-center text-ink-soft">{d.none}</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((o, i) => (
            <Reveal as="li" key={o.id} d={i}><OfferCard o={o} locale={locale} href={offerHref(o, locale, p?.slug ?? "")} /></Reveal>
          ))}
        </ul>
      )}
     </div>
     <CtaCard locale={locale} slug={p?.slug} title={locale === "fr" ? "Le domaine entier, rien que pour vous" : "The whole estate, just for your group"} text={locale === "fr" ? "Choisissez vos dates et voyez le prix tout de suite." : "Pick your dates and see the price straight away."} />
    </main>
  );
}
