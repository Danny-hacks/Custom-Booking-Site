import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getFeatured } from "@/lib/queries";
import { ACTIVITIES, AREA_CREDITS, CATEGORIES, ESTATE, PLACES, driveLabel, placeBySlug } from "@/lib/area";
import type { Locale } from "@/lib/property";
import { DarkBand } from "@/components/DarkBand";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Motion";

export function generateStaticParams() {
  return ["en", "fr"].flatMap((locale) => PLACES.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/area/[slug]">): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const pl = placeBySlug(slug);
  if (!pl) return {};
  const name = locale === "fr" ? pl.nameFr ?? pl.name : pl.name;
  return {
    title: name,
    description: pl.summary[locale],
    alternates: { languages: { en: `/en/area/${slug}`, fr: `/fr/area/${slug}` } },
    ...(pl.photo ? { openGraph: { images: [`/img/area/${pl.photo}.jpg`] } } : {}),
  };
}

export default async function PlacePage({ params }: PageProps<"/[locale]/area/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const pl = placeBySlug(slug);
  if (!pl) notFound();
  const fr = locale === "fr";
  const d = t(locale);
  const p = await getFeatured();
  const name = fr ? pl.nameFr ?? pl.name : pl.name;
  const category = CATEGORIES.find((c) => c.key === pl.category)?.label[locale];
  const near = PLACES.filter((x) => x.slug !== pl.slug)
    .sort((a, b) => Math.abs(a.drive - pl.drive) - Math.abs(b.drive - pl.drive))
    .slice(0, 3);
  const credit = pl.photo ? AREA_CREDITS[pl.photo] : undefined;

  const ld = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
    description: pl.summary[locale],
    ...(pl.photo ? { image: `/img/area/${pl.photo}.jpg` } : {}),
    ...(pl.lat && pl.lon ? { geo: { "@type": "GeoCoordinates", latitude: pl.lat, longitude: pl.lon } } : {}),
  };

  return (
    <main className="pb-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section>
        <div className="relative isolate flex min-h-[300px] items-end overflow-hidden bg-navy sm:min-h-[380px]">
          {pl.photo ? (
            <Image src={`/img/area/${pl.photo}.jpg`} alt={name} fill priority sizes="100vw" className="-z-10 object-cover" />
          ) : (
            <div className="absolute inset-0 -z-10 grid place-items-center text-sun-bright/40"><Icon name={pl.icon} size={120} weight="duotone" /></div>
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
          <div className="mx-auto w-full max-w-[1240px] px-5 pb-9 sm:pb-12">
            <Link href={`/${locale}/area#places`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white/90 hover:underline">
              <Icon name="arrow" size={16} className="rotate-180" /> {d.area.title}
            </Link>
            <h1 className="rise mt-1 max-w-3xl text-[36px] text-white sm:text-[52px]">{name}</h1>
            <div className="rise mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white [--d:1]">
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{pl.tag[locale]}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur"><Icon name="car" size={15} /> {driveLabel(pl.drive, locale)}{pl.drive > 5 && (fr ? " depuis Centrès" : " from Centrès")}</span>
              {category && <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{category}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-[1240px] gap-10 px-5 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <p className="text-[20px] font-medium">{pl.summary[locale]}</p>
          <div className="mt-5 space-y-4 text-[17px] text-ink-soft">{pl.body[locale].map((x) => <p key={x}>{x}</p>)}</div>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={fr ? "Idéal pour" : "Good for"}>
            {pl.tags.flatMap((k) => ACTIVITIES.filter((a) => a.key === k)).map((a) => (
              <li key={a.key} className="rounded-full bg-tint px-3 py-1 text-[13px] font-semibold text-brand-deep">{a.label[locale]}</li>
            ))}
          </ul>
          {pl.official && (
            <a href={pl.official.url} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-7">
              {pl.official.label[locale]} <Icon name="arrow" size={18} />
            </a>
          )}
        </Reveal>
        <Reveal d={2}>
          <aside className="card p-6">
            <h2 className="text-[19px]">{fr ? "Bon à savoir" : "Good to know"}</h2>
            <ul className="mt-3 space-y-2.5 text-[15px] text-ink-soft">
              <li className="flex gap-2.5"><Icon name="car" size={18} className="mt-0.5 shrink-0 text-brand" /> {driveLabel(pl.drive, locale)}{pl.drive > 5 && (fr ? " en voiture depuis Centrès (approximatif)" : " by car from Centrès (approximate)")}</li>
              {(pl.tips?.[locale] ?? []).map((x) => (
                <li key={x} className="flex gap-2.5"><Icon name="check" size={18} weight="bold" className="mt-0.5 shrink-0 text-leaf" /> {x}</li>
              ))}
              <li className="flex gap-2.5"><Icon name="chat" size={18} className="mt-0.5 shrink-0 text-brand" /> {fr ? "Confirmez les horaires avant de partir : ils changent selon la saison." : "Confirm opening hours before you go; they change with the season."}</li>
            </ul>
          </aside>
          {pl.lat && pl.lon && (
            <aside className="card mt-5 p-6">
              <h2 className="text-[19px]">{fr ? "Situation" : "Location"}</h2>
              <p className="mt-2 text-[15px] text-ink-soft">
                {fr ? "Position approximative" : "Approximate position"}: {pl.lat.toFixed(4)}° N, {pl.lon.toFixed(4)}° E
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`https://www.openstreetmap.org/?mlat=${pl.lat}&mlon=${pl.lon}#map=14/${pl.lat}/${pl.lon}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !min-h-11">
                  <Icon name="pin" size={18} /> {fr ? "Voir sur la carte" : "View on the map"}
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${ESTATE.lat},${ESTATE.lon}&destination=${pl.lat},${pl.lon}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !min-h-11">
                  <Icon name="car" size={18} /> {fr ? "Itinéraire depuis le domaine" : "Directions from the estate"}
                </a>
              </div>
              <p className="mt-3 text-xs text-ink-soft">{fr ? "Ouvre un service de cartes externe dans un nouvel onglet." : "Opens an outside map service in a new tab."}</p>
            </aside>
          )}
        </Reveal>
      </section>

      <section className="mx-auto mt-16 max-w-[1240px] px-5">
        <h2 className="text-[26px] sm:text-[32px]">{fr ? "À voir aussi" : "Also nearby"}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {near.map((x) => (
            <li key={x.slug}>
              <Link href={`/${locale}/area/${x.slug}`} className="card lift block h-full p-5">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft"><Icon name="car" size={15} /> {driveLabel(x.drive, locale)}</span>
                <span className="mt-2 block text-lg font-semibold">{fr ? x.nameFr ?? x.name : x.name}</span>
                <span className="mt-1 block text-[14px] text-ink-soft">{x.tag[locale]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DarkBand
        locale={locale}
        slug={p?.slug}
        title={fr ? "Séjournez au cœur du Ségala" : "Stay in the heart of the Ségala"}
        text={fr ? "Le domaine entier pour votre groupe, à quelques minutes des plus beaux sites du pays." : "The whole estate for your group, a few minutes from the best of the country."}
      />

      {credit && pl.photo && (
        <section className="photo-credit mx-auto max-w-[1240px] px-5">
          <p className="mt-6 text-xs text-ink-soft">
            {fr ? "Photo : " : "Photo: "}<a href={credit.url} target="_blank" rel="noopener noreferrer" className="underline">{credit.author}</a> ({credit.license}), Wikimedia Commons.
          </p>
        </section>
      )}
    </main>
  );
}
