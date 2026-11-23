import Image from "next/image";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getFeatured } from "@/lib/queries";
import { ACTIVITIES, AREA_CREDITS, CATEGORIES, ESTATE, PLACES, PLANS, driveLabel, placeBySlug } from "@/lib/area";
import { AreaMap } from "@/components/AreaMap";
import type { Locale } from "@/lib/property";
import { AreaExplorer } from "@/components/AreaExplorer";
import { DarkBand } from "@/components/DarkBand";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Motion";

const COPY = {
  en: {
    lead: "The Ségala is quiet, green and generous: a hundred valleys, stone villages and the big sights of Aveyron within an easy drive.",
    introEyebrow: "Welcome to the Ségala",
    introTitle: "A high green country between two rivers",
    intro: [
      "The estate stands in Centrès, in the Ségala, a plateau of farms, woods and deep valleys between the Viaur and the Aveyron rivers. The name comes from the Occitan “segal”, rye, the grain that once grew on these poor soils. Today it is known for calf farming, walking and a slow pace.",
      "Below, every place is sorted by drive time from Centrès. Open one for details, or use the menu to jump straight to a place.",
    ],
    facts: [
      ["valleys", "A hundred valleys", "Over a hundred marked walks and bike routes"],
      ["tripous", "Local table", "Tripous, Ségala veal, farm shops and markets"],
      ["viaduct", "Big sights close by", "Viaur viaduct, Sauveterre and Château du Bosc, around 20 minutes or less"],
    ] as [string, string, string][],
    mapTitle: "The estate and what is around it",
    near: "Close by",
    wide: "Wider area",
    km: "km",
    mapAria: "Map of places around the estate",
    mapNote: "Straight-line distances. Tap a place for details.",
    estate: "The estate",
    plansEyebrow: "Plan your day",
    plansTitle: "Ready-made days out",
    plansLead: "Not sure where to start? Pick a day, or build your own below.",
    stops: "Stops",
    fromEstate: "from the estate",
    feel: "What do you feel like doing?",
    kind: "Type of place",
    none: "Nothing matches both choices. Try another combination.",
    all: "All",
    jump: "Jump to a place",
    jumpHint: "Choose a place…",
    shown: "places, nearest first",
    driveNote: "Drive times are approximate, by car from Centrès.",
    srcTitle: "Plan your days with the tourist offices",
    srcLead: "Opening hours, events and trail maps change through the year. The local tourist offices keep them up to date, and their staff are generous with advice.",
    srcLink: "Destination Ségala, the tourist offices’ shared site (in French)",
    srcContact: "Contact the tourist offices",
    srcNote: "This guide is written by the estate from public information. Details can change, so confirm hours before you go.",
    tipTitle: "Want a local tip?",
    tipText: "We know the good tables and the swimming spots. Just ask.",
  },
  fr: {
    lead: "Le Ségala est calme, vert et généreux : cent vallées, des villages de pierre et les grands sites de l’Aveyron à portée de voiture.",
    introEyebrow: "Bienvenue en Ségala",
    introTitle: "Un haut pays vert entre deux rivières",
    intro: [
      "Le domaine se trouve à Centrès, en Ségala, un plateau de fermes, de bois et de vallées profondes entre le Viaur et l’Aveyron. Son nom vient de l’occitan « segal », le seigle, la céréale qui poussait jadis sur ces sols pauvres. Il est aujourd’hui réputé pour l’élevage de veaux, la randonnée et son rythme tranquille.",
      "Ci-dessous, chaque lieu est classé par temps de trajet depuis Centrès. Ouvrez-en un pour le détail, ou utilisez le menu pour aller directement à un lieu.",
    ],
    facts: [
      ["valleys", "Cent vallées", "Plus de cent randonnées et parcours à vélo balisés"],
      ["tripous", "À table", "Tripous, veau du Ségala, magasins de producteurs et marchés"],
      ["viaduct", "De grands sites tout près", "Viaduc du Viaur, Sauveterre et château du Bosc, à 20 minutes ou moins"],
    ] as [string, string, string][],
    mapTitle: "Le domaine et ses environs",
    near: "Tout près",
    wide: "Zone élargie",
    km: "km",
    mapAria: "Carte des lieux autour du domaine",
    mapNote: "Distances à vol d’oiseau. Touchez un lieu pour le détail.",
    estate: "Le domaine",
    plansEyebrow: "Préparez votre journée",
    plansTitle: "Des journées toutes prêtes",
    plansLead: "Pas sûr par où commencer ? Choisissez une journée, ou composez la vôtre plus bas.",
    stops: "Étapes",
    fromEstate: "depuis le domaine",
    feel: "Qu’avez-vous envie de faire ?",
    kind: "Type de lieu",
    none: "Rien ne correspond aux deux choix. Essayez une autre combinaison.",
    all: "Tout",
    jump: "Aller à un lieu",
    jumpHint: "Choisir un lieu…",
    shown: "lieux, du plus proche au plus lointain",
    driveNote: "Temps de trajet approximatifs, en voiture depuis Centrès.",
    srcTitle: "Préparez vos journées avec les offices de tourisme",
    srcLead: "Horaires, événements et cartes de randonnée changent au fil de l’année. Les offices de tourisme locaux les tiennent à jour, et leurs équipes conseillent avec plaisir.",
    srcLink: "Destination Ségala, le site commun des offices de tourisme",
    srcContact: "Contacter les offices de tourisme",
    srcNote: "Ce guide est rédigé par le domaine à partir d’informations publiques. Les détails peuvent changer : confirmez les horaires avant de partir.",
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
      category: pl.category,
      tags: pl.tags,
      tag: pl.tag[locale],
      summary: pl.summary[locale],
      drive: driveLabel(pl.drive, locale),
      driveMin: pl.drive,
      icon: pl.icon,
      photo: pl.photo,
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

      <section className="mx-auto mt-14 grid max-w-[1240px] gap-10 px-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Reveal>
          <p className="eyebrow">{c.introEyebrow}</p>
          <h2 className="mt-1 text-[30px] sm:text-[40px]">{c.introTitle}</h2>
          <div className="mt-4 space-y-3 text-[17px] text-ink-soft">{c.intro.map((x) => <p key={x}>{x}</p>)}</div>
        </Reveal>
        <Reveal d={2}>
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {c.facts.map(([icon, h, b]) => (
              <li key={h} className="card flex items-start gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tint text-brand">
                  <Icon name={icon === "valleys" ? "mountains" : icon === "tripous" ? "dining" : "star"} size={22} weight="duotone" />
                </span>
                <span><span className="block font-semibold">{h}</span><span className="text-[14px] text-ink-soft">{b}</span></span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="mx-auto mt-14 max-w-[1240px] px-5">
        <Reveal>
          <h2 className="mb-5 text-[26px] sm:text-[32px]">{c.mapTitle}</h2>
          <AreaMap
            locale={locale}
            estate={{ lat: ESTATE.lat, lon: ESTATE.lon, label: c.estate }}
            pins={PLACES.flatMap((pl) => (pl.lat && pl.lon ? [{ slug: pl.slug, name: fr ? pl.nameFr ?? pl.name : pl.name, lat: pl.lat, lon: pl.lon, drive: driveLabel(pl.drive, locale) }] : []))}
            labels={{ near: c.near, wide: c.wide, km: c.km, aria: c.mapAria, note: c.mapNote }}
          />
        </Reveal>
      </section>

      <section className="band-dark mt-16 bg-navy py-16 text-[#eadcc6] sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{c.plansEyebrow}</p>
            <h2 className="mt-1 text-[30px] text-white sm:text-[40px]">{c.plansTitle}</h2>
            <p className="mt-3 text-[17px] opacity-90">{c.plansLead}</p>
          </Reveal>
          <ul className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <Reveal as="li" key={plan.slug} d={i % 3}>
                <div className="card flex h-full flex-col p-6">
                  <span className="w-fit rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-brand-deep">{plan.length[locale]}</span>
                  <h3 className="mt-3 text-[22px]">{plan.title[locale]}</h3>
                  <p className="mt-1.5 text-[15px] text-ink-soft">{plan.lead[locale]}</p>
                  <ol className="mt-4 space-y-2" aria-label={c.stops}>
                    {plan.stops.flatMap((slug, n) => {
                      const pl = placeBySlug(slug);
                      return pl ? [
                        <li key={slug}>
                          <Link href={`/${locale}/area/${slug}`} className="flex min-h-11 items-center gap-3 rounded-xl bg-canvas px-3 py-2 hover:bg-tint">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">{n + 1}</span>
                            <span className="min-w-0 flex-1 text-[15px] font-semibold">{fr ? pl.nameFr ?? pl.name : pl.name}</span>
                            <span className="flex shrink-0 items-center gap-1 text-[13px] text-ink-soft"><Icon name="car" size={14} /> {driveLabel(pl.drive, locale)}</span>
                          </Link>
                        </li>,
                      ] : [];
                    })}
                  </ol>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="places" className="mx-auto mt-14 max-w-[1240px] scroll-mt-24 px-5">
        <AreaExplorer
          locale={locale}
          places={cards}
          categories={CATEGORIES.map((x) => ({ key: x.key, label: x.label[locale] }))}
          activities={ACTIVITIES.map((x) => ({ key: x.key, label: x.label[locale] }))}
          labels={{ all: c.all, jump: c.jump, jumpHint: c.jumpHint, shown: c.shown, feel: c.feel, kind: c.kind, none: c.none }}
        />
        <p className="mt-5 text-sm text-ink-soft">{c.driveNote}</p>
      </section>

      <section className="mx-auto mt-16 max-w-[1240px] px-5">
        <Reveal kind="scale" className="rounded-[28px] bg-tint p-7 sm:p-10">
          <h2 className="text-[24px] sm:text-[30px]">{c.srcTitle}</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">{c.srcLead}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://www.destinationsegala.fr/" target="_blank" rel="noopener noreferrer" className="btn">{c.srcLink} <Icon name="arrow" size={18} /></a>
            <a href="https://www.destinationsegala.fr/contactez-nous/" target="_blank" rel="noopener noreferrer" className="btn-ghost">{c.srcContact}</a>
          </div>
          <p className="mt-5 text-sm text-ink-soft">{c.srcNote}</p>
        </Reveal>
      </section>

      <DarkBand locale={locale} slug={p?.slug} title={c.tipTitle} text={c.tipText} />

      <section className="photo-credit mx-auto max-w-[1240px] px-5">
        <p id="credits" className="mt-6 scroll-mt-24 text-xs leading-relaxed text-ink-soft">
          {d.area.credit}{" "}
          {([...PLACES.flatMap((pl) => (pl.photo ? [[fr ? pl.nameFr ?? pl.name : pl.name, pl.photo] as const] : [])), [fr ? "Paysage" : "Landscape", "landscape"] as const]).map(([label, key], i) => (
            <span key={key}>{i > 0 && " · "}<a href={AREA_CREDITS[key].url} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>: {AREA_CREDITS[key].author} ({AREA_CREDITS[key].license})</span>
          ))}
        </p>
      </section>
    </main>
  );
}
