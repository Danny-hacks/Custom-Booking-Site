import { titleMeta } from "@/lib/meta";
import Image from "next/image";
import Link from "next/link";
import { getPublished, fromPrice } from "@/lib/queries";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { eur } from "@/lib/dates";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("stays");

export default async function Properties({ params }: PageProps<"/[locale]/properties">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const props = await getPublished();
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-12">
      <h1 className="text-[36px] sm:text-[44px]">{d.nav.stay}</h1>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {props.map((p) => (
          <li key={p.id}>
            <Link href={`/${locale}/properties/${p.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={p.photos[0].src} alt={p.name} fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-ink-soft">{p.location}</p>
                  <p className="mt-1 text-sm text-ink-soft">{d.prop.upTo} {p.maxGuests} {d.search.guestsN} · {p.bedrooms} {d.prop.bedrooms}</p>
                  <p className="mt-1 text-[15px]"><strong>{eur(fromPrice(p), locale)}</strong> {d.card.perNight}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold"><Icon name="star" weight="fill" size={16} /> 4.83</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
