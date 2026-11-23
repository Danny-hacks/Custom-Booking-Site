import Image from "next/image";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getFeatured } from "@/lib/queries";
import { ACTIVITIES, ESTATE, PLACES, driveLabel, placeBySlug } from "@/lib/area";
import type { Locale } from "@/lib/property";
import { AreaExplorer } from "@/components/AreaExplorer";
import { CtaCard } from "@/components/CtaCard";
import { Reveal } from "@/components/Motion";

const COPY = {
  en: {
    lead: "The Ségala is quiet, green and generous: a hundred valleys, stone villages and the big sights of Aveyron within an easy drive.",
    eyebrow: "Welcome to the Ségala",
    title: "A high green country between two rivers",
    intro: "The estate stands in Centrès, on a plateau of farms, woods and deep valleys between the Viaur and the Aveyron. The name comes from the Occitan “segal”, rye, the grain that once grew on these soils.",
    stats: [["chateau-du-bosc", "Château du Bosc"], ["viaduc-du-viaur", "Viaur viaduct"], ["rodez", "Rodez"]] as [string, string][],
    exploreTitle: "Find something to do",
    exploreLead: "Choose what you feel like, then tap a place for details. Drive times are approximate, by car from Centrès.",
    all: "Everything",
    filterAria: "What do you feel like doing?",
    jump: "Jump to a place",
    jumpHint: "Jump to a place…",
    shown: "places, nearest first",
    showAll: "Show all",
    none: "Nothing matches. Try another choice.",
    near: "Close by",
    wide: "Wider area",
    km: "km",
    mapAria: "Map of places around the estate",
    estate: "The estate",
    credit: "© OpenStreetMap contributors",
    srcLead: "Opening hours and events change through the year.",
    srcLink: "Check the tourist offices’ site (in French)",
    tipTitle: "Want a local tip?",
    tipText: "We know the good tables and the swimming spots. Just ask.",
  },
  fr: {
    lead: "Le Ségala est calme, vert et généreux : cent vallées, des villages de pierre et les grands sites de l’Aveyron à portée de voiture.",
    eyebrow: "Bienvenue en Ségala",
    title: "Un haut pays vert entre deux rivières",
    intro: "Le domaine se trouve à Centrès, sur un plateau de fermes, de bois et de vallées profondes entre le Viaur et l’Aveyron. Son nom vient de l’occitan « segal », le seigle, la céréale qui poussait jadis sur ces sols.",
    stats: [["chateau-du-bosc", "Château du Bosc"], ["viaduc-du-viaur", "Viaduc du Viaur"], ["rodez", "Rodez"]] as [string, string][],
    exploreTitle: "Trouvez quoi faire",
    exploreLead: "Choisissez votre envie, puis touchez un lieu pour le détail. Temps de trajet approximatifs, en voiture depuis Centrès.",
    all: "Tout",
    filterAria: "Qu’avez-vous envie de faire ?",
    jump: "Aller à un lieu",
    jumpHint: "Aller à un lieu…",
    shown: "lieux, du plus proche au plus lointain",
    showAll: "Tout afficher",
    none: "Rien ne correspond. Essayez un autre choix.",
    near: "Tout près",
    wide: "Zone élargie",
    km: "km",
    mapAria: "Carte des lieux autour du domaine",
    estate: "Le domaine",
    credit: "© les contributeurs d’OpenStreetMap",
    srcLead: "Horaires et événements changent au fil de l’année.",
    srcLink: "Consultez le site des offices de tourisme",
    tipTitle: "Un conseil local ?",
    tipText: "Nous connaissons les bonnes tables et les coins de baignade. Demandez-nous.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/area">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return { title: t(locale).area.title, description: COPY[locale].lead };
}

export default async function Area({ params }: PageProps<"/[locale]/area">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const c = COPY[locale];
  const p = await getFeatured();
  const fr = locale === "fr";

  const cards = [...PLACES]
    .sort((a, b) => a.drive - b.drive)
    .map((pl) => ({
      slug: pl.slug,
      name: fr ? pl.nameFr ?? pl.name : pl.name,
      tags: pl.tags,
      tag: pl.tag[locale],
      summary: pl.summary[locale],
      drive: driveLabel(pl.drive, locale),
      icon: pl.icon,
      photo: pl.photo,
      lat: pl.lat,
      lon: pl.lon,
    }));

  return (
    <main className="pb-4">
      <section>
        <div className="relative isolate flex min-h-[320px] items-end overflow-hidden bg-navy sm:min-h-[400px]">
          <Image src="/img/area/landscape.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
          <div className="mx-auto w-full max-w-[1240px] px-5 pb-10 sm:pb-12">
            <h1 className="rise max-w-2xl text-[38px] text-white sm:text-[54px]">{d.area.title}</h1>
            <p className="rise mt-2 max-w-2xl text-lg text-white/90 [--d:1]">{c.lead}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 grid max-w-[1240px] gap-8 px-5 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
        <Reveal>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="mt-1 text-[30px] sm:text-[40px]">{c.title}</h2>
          <p className="mt-4 max-w-xl text-[17px] text-ink-soft">{c.intro}</p>
        </Reveal>
        <Reveal d={2}>
          <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-paper py-5">
            {c.stats.map(([slug, label]) => {
              const pl = placeBySlug(slug);
              return (
                <div key={slug} className="px-3 text-center sm:px-5">
                  <dt className="serif text-[30px] leading-none text-brand sm:text-[38px]">{pl?.drive}<span className="ml-1 text-[14px] font-semibold text-ink-soft">min</span></dt>
                  <dd className="mt-2 text-[13px] text-ink-soft">{label}</dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </section>

      <section id="places" className="mx-auto mt-16 max-w-[1240px] scroll-mt-24 px-5">
        <Reveal className="mb-6 max-w-2xl">
          <h2 className="text-[26px] sm:text-[34px]">{c.exploreTitle}</h2>
          <p className="mt-2 text-ink-soft">{c.exploreLead}</p>
        </Reveal>
        <AreaExplorer
          locale={locale}
          places={cards}
          activities={ACTIVITIES.map((x) => ({ key: x.key, label: x.label[locale] }))}
          estate={{ lat: ESTATE.lat, lon: ESTATE.lon, label: c.estate }}
          labels={{ all: c.all, jump: c.jump, jumpHint: c.jumpHint, shown: c.shown, showAll: c.showAll, none: c.none, km: c.km, near: c.near, wide: c.wide, mapAria: c.mapAria, credit: c.credit, filterAria: c.filterAria }}
        />
        <p className="mt-8 text-sm text-ink-soft">
          {c.srcLead}{" "}
          <a href="https://www.destinationsegala.fr/" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">{c.srcLink}</a>.
        </p>
      </section>

      <CtaCard locale={locale} slug={p?.slug} title={c.tipTitle} text={c.tipText} />
    </main>
  );
}
