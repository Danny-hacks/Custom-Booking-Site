import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getFeatured } from "@/lib/queries";
import { AREA_CREDITS, PLACES } from "@/lib/area";
import type { Locale } from "@/lib/property";
import { DarkBand } from "@/components/DarkBand";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Motion";

export async function generateMetadata({ params }: PageProps<"/[locale]/area">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return { title: t(locale).area.title, description: t(locale).area.lead };
}

export default async function Area({ params }: PageProps<"/[locale]/area">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const p = await getFeatured();
  const fr = locale === "fr";

  return (
    <main className="pb-4">
      <section className="mx-auto max-w-[1240px] px-5 pt-5">
        <div className="relative isolate flex min-h-[300px] items-end overflow-hidden rounded-[28px] bg-navy sm:min-h-[360px]">
          <Image src="/img/area/landscape.jpg" alt="" fill priority sizes="1240px" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
          <div className="max-w-2xl p-7 sm:p-12">
            <h1 className="rise text-[38px] text-white sm:text-[52px]">{d.area.title}</h1>
            <p className="rise mt-2 text-lg text-white/90 [--d:1]">{d.area.lead}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1240px] px-5">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.map((pl, i) => (
            <Reveal as="li" key={pl.name} d={i}>
              <article className="card lift zoom flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  {pl.image ? (
                    <Image src={pl.image} alt={locale === "fr" ? pl.nameFr ?? pl.name : pl.name} fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-tint to-canvas text-brand/60"><Icon name={pl.icon} size={52} weight="duotone" /></div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-brand-deep">{pl.tag[locale]}</span>
                    {pl.drive && <span className="flex items-center gap-1 text-[13px] font-semibold text-ink-soft"><Icon name="car" size={15} /> ~{pl.drive}</span>}
                  </div>
                  <h2 className="mt-3 text-[21px]">{locale === "fr" ? pl.nameFr ?? pl.name : pl.name}</h2>
                  <p className="mt-1.5 text-[15px] text-ink-soft">{pl.text[locale]}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </section>

      <DarkBand locale={locale} slug={p?.slug} title={fr ? "Besoin d’un conseil local ?" : "Want a local tip?"} text={fr ? "Nous connaissons les bonnes tables et les coins de baignade. Demandez-nous." : "We know the good tables and the swimming spots. Just ask."} />
      <section className="mx-auto max-w-[1240px] px-5">
        <p id="credits" className="mt-6 scroll-mt-24 text-xs leading-relaxed text-ink-soft">
          {d.area.credit}{" "}
          {([...PLACES.flatMap((pl) => (pl.photo ? [[locale === "fr" ? pl.nameFr ?? pl.name : pl.name, pl.photo] as const] : [])), [fr ? "Paysage" : "Landscape", "landscape"] as const]).map(([label, key], i) => (
            <span key={key}>{i > 0 && " · "}<a href={AREA_CREDITS[key].url} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>: {AREA_CREDITS[key].author} ({AREA_CREDITS[key].license})</span>
          ))}
        </p>
      </section>
    </main>
  );
}
