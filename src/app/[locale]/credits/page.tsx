import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AREA_CREDITS, LICENSE_URL, PLACES, areaThumb } from "@/lib/area";
import { PHOTO_CREDIT } from "@/lib/brand";
import type { Locale } from "@/lib/property";

const COPY = {
  en: {
    title: "Photo credits",
    lead: "The pictures on this site come from a professional photographer and from people who share their work freely. Thank you to all of them.",
    estate: "The estate",
    estateText: (name: string) => `Photographs of the estate, the cottages and the pool: ${name}.`,
    area: "The area",
    areaText: "Photos of the villages, castles and landscapes around the estate are shared on Wikimedia Commons under free licences. Each one is credited below, with a link to the original page and its licence.",
    photo: "Photo",
    author: "Photographer",
    licence: "Licence",
    place: "Landscape of the Ségala",
    map: "Map",
    mapText: "Rivers, roads, borders and lakes on our maps are drawn from OpenStreetMap data.",
    mapLink: "© OpenStreetMap contributors",
    view: "View the original",
  },
  fr: {
    title: "Crédits photos",
    lead: "Les images de ce site viennent d’un photographe professionnel et de personnes qui partagent librement leur travail. Merci à tous.",
    estate: "Le domaine",
    estateText: (name: string) => `Photographies du domaine, des gîtes et de la piscine : ${name}.`,
    area: "La région",
    areaText: "Les photos des villages, châteaux et paysages autour du domaine sont partagées sur Wikimedia Commons sous licences libres. Chacune est créditée ci-dessous, avec un lien vers la page d’origine et sa licence.",
    photo: "Photo",
    author: "Photographe",
    licence: "Licence",
    place: "Paysage du Ségala",
    map: "Cartes",
    mapText: "Les rivières, routes, frontières et lacs de nos cartes sont tracés à partir des données OpenStreetMap.",
    mapLink: "© les contributeurs d’OpenStreetMap",
    view: "Voir l’original",
  },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/credits">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return { title: COPY[locale].title, alternates: { languages: { en: "/en/credits", fr: "/fr/credits" } } };
}

export default async function Credits({ params }: PageProps<"/[locale]/credits">) {
  const locale = (await params).locale as Locale;
  const fr = locale === "fr";
  const c = COPY[locale];
  const rows = [
    ...PLACES.flatMap((pl) => (pl.photo ? [{ key: pl.photo, name: fr ? pl.nameFr ?? pl.name : pl.name, href: `/${locale}/area/${pl.slug}` }] : [])),
    { key: "landscape" as const, name: c.place, href: undefined },
  ];
  return (
    <main className="mx-auto max-w-3xl px-5 pb-6 pt-12">
      <p className="eyebrow">{fr ? "Remerciements" : "Thank you"}</p>
      <h1 className="mt-1 text-[36px] sm:text-[48px]">{c.title}</h1>
      <p className="mt-3 text-[17px] text-ink-soft">{c.lead}</p>

      <section className="mt-12">
        <h2 className="text-[24px] sm:text-[28px]">{c.estate}</h2>
        <p className="mt-2 text-ink-soft">{c.estateText(PHOTO_CREDIT)}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-[24px] sm:text-[28px]">{c.area}</h2>
        <p className="mt-2 text-ink-soft">{c.areaText}</p>
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
          {rows.map((r) => {
            const cr = AREA_CREDITS[r.key];
            const licenceUrl = LICENSE_URL[cr.license];
            return (
              <li key={r.key} className="flex items-center gap-4 p-3 sm:p-4">
                <Image src={areaThumb(r.key)} alt="" width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-xl bg-tint object-cover" />
                <div className="min-w-0 flex-1">
                  {r.href ? <Link href={r.href} className="font-semibold hover:underline">{r.name}</Link> : <span className="font-semibold">{r.name}</span>}
                  <p className="text-sm text-ink-soft">
                    {c.author}: {cr.author}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {c.licence}: {licenceUrl ? <a href={licenceUrl} target="_blank" rel="noopener noreferrer" className="underline">{cr.license}</a> : cr.license}
                    {" · "}
                    <a href={cr.url} target="_blank" rel="noopener noreferrer" className="underline">{c.view}</a>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[24px] sm:text-[28px]">{c.map}</h2>
        <p className="mt-2 text-ink-soft">
          {c.mapText}{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="font-semibold underline">{c.mapLink}</a>.
        </p>
      </section>
    </main>
  );
}
