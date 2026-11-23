"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AreaMap } from "@/components/AreaMap";
import { Icon } from "@/components/Icon";
import { areaThumb } from "@/lib/area";

export type AreaCard = {
  slug: string;
  name: string;
  tags: string[];
  tag: string;
  summary: string;
  drive: string;
  icon: string;
  photo?: string;
  lat?: number;
  lon?: number;
};

type Props = {
  locale: "en" | "fr";
  places: AreaCard[];
  activities: { key: string; label: string }[];
  estate: { lat: number; lon: number; label: string };
  labels: { all: string; jump: string; jumpHint: string; shown: string; showAll: string; none: string; km: string; near: string; wide: string; mapAria: string; credit: string; filterAria: string };
};

/**
 * The guide's working part: one row of filters, a list of places and a map that follow each other. Filtering narrows both; hovering a row
 * lights its pin and vice versa. The list is plain links, so it works without JavaScript too.
 */
export function AreaExplorer({ locale, places, activities, estate, labels }: Props) {
  const router = useRouter();
  const [act, setAct] = useState("all");
  const [active, setActive] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const shown = act === "all" ? places : places.filter((p) => p.tags.includes(act));
  // the list starts short so the page stays light; the map always shows every matching place
  const LIMIT = 8;
  const rows = all ? shown : shown.slice(0, LIMIT);
  const chip = (key: string, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => { setAct(key); setActive(null); setAll(false); }}
      aria-pressed={act === key}
      className={`min-h-11 shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-all duration-200 ${act === key ? "border-brand bg-brand text-white shadow-sm" : "border-line bg-paper text-ink hover:-translate-y-0.5 hover:border-brand"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={labels.filterAria} className="no-scrollbar -mx-5 flex scroll-px-5 snap-x gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-1 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          {chip("all", labels.all)}
          {activities.map((a) => chip(a.key, a.label))}
        </div>
        <label className="block lg:w-56 lg:shrink-0">
          <span className="sr-only">{labels.jump}</span>
          <select className="field" defaultValue="" aria-label={labels.jump} onChange={(e) => e.target.value && router.push(`/${locale}/area/${e.target.value}`)}>
            <option value="" disabled>{labels.jumpHint}</option>
            {places.map((p) => <option key={p.slug} value={p.slug}>{p.name} · {p.drive}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-24 lg:order-2">
          <AreaMap
            locale={locale}
            estate={estate}
            pins={shown.flatMap((p) => (p.lat && p.lon ? [{ slug: p.slug, name: p.name, lat: p.lat, lon: p.lon, drive: p.drive, photo: p.photo, tag: p.tag }] : []))}
            active={active}
            onActive={setActive}
            labels={{ near: labels.near, wide: labels.wide, km: labels.km, aria: labels.mapAria, credit: labels.credit }}
          />
        </div>

        <div className="lg:order-1">
          <p className="text-sm text-ink-soft" aria-live="polite">{shown.length} {labels.shown}</p>
          {shown.length === 0 && <p className="mt-3 rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">{labels.none}</p>}
          <ul className="mt-3 space-y-3">
            {rows.map((pl, i) => (
              <li key={`${act}-${pl.slug}`} className="fade-up" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                <Link
                  href={`/${locale}/area/${pl.slug}`}
                  onMouseEnter={() => setActive(pl.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(pl.slug)}
                  onBlur={() => setActive(null)}
                  className={`group flex items-center gap-4 rounded-2xl border bg-paper p-3 transition-all duration-200 ${active === pl.slug ? "-translate-y-0.5 border-brand shadow-[0_14px_30px_-20px_rgba(58,40,26,0.6)]" : "border-line hover:-translate-y-0.5 hover:border-brand/60"}`}
                >
                  <span className="relative grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-xl bg-tint text-brand/60 sm:h-[96px] sm:w-[96px]">
                    {pl.photo ? (
                      <Image src={areaThumb(pl.photo)} alt="" width={240} height={240} unoptimized className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Icon name={pl.icon} size={34} weight="duotone" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug">{pl.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 rounded-full bg-tint px-2.5 py-0.5 text-[12px] font-bold text-brand-deep"><Icon name="car" size={13} /> {pl.drive}</span>
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-brand/80">{pl.tag}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[14px] text-ink-soft">{pl.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!all && shown.length > LIMIT && (
            <button type="button" onClick={() => setAll(true)} className="btn-ghost mt-5 w-full">{labels.showAll} ({shown.length}) <Icon name="down" size={16} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
