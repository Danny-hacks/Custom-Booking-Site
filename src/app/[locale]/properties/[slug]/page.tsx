import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProperty, fromPrice } from "@/lib/queries";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { Gallery } from "@/components/Gallery";
import { PhotoTour } from "@/components/PhotoTour";
import { CAT_LABEL, CAT_ORDER, catOf } from "@/lib/photos";
import { BookingCard } from "@/components/BookingCard";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Motion";
import { liveOffers, offerHref } from "@/lib/offers";
import { liveReviews } from "@/lib/reviews";
import { ReviewsSection } from "@/components/Reviews";
import { OfferCard } from "@/components/OfferCard";

export async function generateMetadata({ params }: PageProps<"/[locale]/properties/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProperty(slug);
  return p ? { title: p.name, description: p.content[locale as Locale].summary } : {};
}

export default async function PropertyPage({ params, searchParams }: PageProps<"/[locale]/properties/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const sp = await searchParams;
  const p = await getProperty(slug);
  if (!p) notFound();
  const d = t(locale);
  const c = p.content[locale];
  const offers = (await liveOffers(locale, p.id)).filter((o) => o.showCard);
  const reviews = await liveReviews(locale);
  const tour = p.photos.map((x) => ({ src: x.src, alt: locale === "fr" ? x.alt_fr : x.alt_en, cat: catOf(x.src) ?? "other" }));
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const ld = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: p.name,
    description: c.summary,
    image: p.photos.slice(0, 5).map((x) => x.src),
    address: { "@type": "PostalAddress", addressLocality: "Centrès", addressRegion: "Occitanie", addressCountry: "FR" },
    numberOfRooms: p.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: p.maxGuests },
    aggregateRating: { "@type": "AggregateRating", ratingValue: 4.83, reviewCount: 12 },
  };

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-10 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="rise mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] sm:text-[40px]">{p.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-ink-soft"><Icon name="pin" size={18} /> {p.location}</p>
        </div>
        <p className="flex items-center gap-1.5 text-[15px] font-semibold"><Icon name="star" weight="fill" size={18} className="text-sun" /> {d.prop.reviews}</p>
      </div>

      <div className="rise [--d:2]"><Gallery
        photos={p.photos.map((x) => ({ src: x.src, alt: locale === "fr" ? x.alt_fr : x.alt_en }))}
        showAll={d.prop.showAll}
        close={d.card.close}
      /></div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          {offers.length > 0 && (
            <Reveal as="section" className="border-b border-line pb-8">
              <h2 className="text-2xl">{t(locale).offers.forStay}</h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                {offers.slice(0, 2).map((o) => <li key={o.id}><OfferCard o={o} locale={locale} href={offerHref(o, locale, p.slug)} /></li>)}
              </ul>
            </Reveal>
          )}

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{p.location}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-ink-soft">
              <span>{d.prop.upTo} {p.maxGuests} {d.search.guestsN}</span>
              <span>{p.bedrooms} {d.prop.bedrooms}</span>
              <span>{p.beds} {d.prop.beds}</span>
              <span>{p.bathrooms} {d.prop.baths}</span>
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {[["door", d.prop.checkin, p.checkInTime], ["door", d.prop.checkout, p.checkOutTime], ["paw", "", locale === "fr" ? "Animaux bienvenus" : "Pets welcome"]].map(([i, a, b]) => (
                <li key={String(b)} className="flex items-center gap-3 rounded-xl bg-paper p-4"><Icon name={i} size={26} className="text-brand" /><span><span className="block text-xs text-ink-soft">{a}</span><span className="font-semibold">{b}</span></span></li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{d.prop.about}</h2>
            <div className="mt-4 space-y-4 text-[17px] text-ink-soft">{c.story.map((s) => <p key={s}>{s}</p>)}</div>
          </Reveal>

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{d.prop.tour}</h2>
            <div className="mt-5">
              <PhotoTour photos={tour} cats={CAT_ORDER.map((k) => ({ key: k, label: CAT_LABEL[k][locale] }))} labels={{ all: d.prop.tourAll, more: d.prop.tourMore, close: d.card.close }} />
            </div>
          </Reveal>

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{d.prop.sleepsSection}</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-3">
              {p.spaces.map((s, i) => (
                <Reveal as="li" key={s.key} d={i}><div className="lift zoom h-full rounded-2xl border border-line bg-paper p-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src={s.photo} alt="" fill sizes="25vw" className="object-cover" /></div>
                  <p className="serif mt-3 text-lg">{s[locale].name}</p>
                  <p className="text-sm text-ink-soft">{d.home.sleeps} {s.sleeps}</p>
                  <p className="mt-1 text-sm text-ink-soft">{s[locale].facts.join(" · ")}</p>
                </div></Reveal>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{d.prop.offers}</h2>
            <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {p.amenities.map((a) => (
                <li key={a.icon} className="flex items-center gap-4 text-[16px]"><Icon name={a.icon} size={28} weight="light" /> {a[locale]}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className="border-b border-line py-8">
            <h2 className="text-2xl">{d.prop.location}</h2>
            <p className="mt-3 text-ink-soft">{d.prop.locationText}</p>
            <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-2xl">
              <Image src="/img/site/area-segala.jpg" alt="" fill sizes="60vw" className="object-cover" />
            </div>
          </Reveal>

          <Reveal as="section" className="grid gap-8 py-8 sm:grid-cols-2">
            <div>
              <h2 className="text-2xl">{d.prop.rules}</h2>
              <ul className="mt-4 space-y-2 text-ink-soft">{c.rules.map((r) => <li key={r} className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-leaf" weight="bold" />{r}</li>)}</ul>
            </div>
            <div>
              <h2 className="text-2xl">{d.prop.policy}</h2>
              <ul className="mt-4 space-y-2 text-ink-soft">{d.prop.policyLines.map((r) => <li key={r} className="flex gap-2"><Icon name="shield" size={18} className="mt-1 shrink-0 text-brand" />{r}</li>)}</ul>
            </div>
          </Reveal>
        </div>

        <aside id="book" className="rise scroll-mt-24 [--d:4]">
          <div className="sticky top-24">
            <BookingCard
              slug={p.slug}
              locale={locale}
              minNights={p.minNights}
              maxGuests={p.maxGuests}
              fromPrice={fromPrice(p)}
              initial={{ from: one("from"), to: one("to"), adults: one("adults") ? Number(one("adults")) : undefined, code: one("code") }}
            />
          </div>
        </aside>
      </div>
      <div className="-mx-5"><ReviewsSection reviews={reviews} locale={locale} id="reviews" /></div>
    </main>
  );
}
