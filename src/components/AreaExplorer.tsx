"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export type AreaCard = {
  slug: string;
  name: string;
  category: string;
  tags: string[];
  tag: string;
  summary: string;
  drive: string;
  driveMin: number;
  icon: string;
  photo?: string;
};

type Props = {
  locale: "en" | "fr";
  places: AreaCard[];
  categories: { key: string; label: string }[];
  activities: { key: string; label: string }[];
  labels: { all: string; jump: string; jumpHint: string; shown: string; feel: string; kind: string; none: string };
};

/** Filter chips, a "jump to a place" dropdown and the grid of places. The grid stays plain links, so it works without JavaScript too. */
export function AreaExplorer({ locale, places, categories, activities, labels }: Props) {
  const router = useRouter();
  const [cat, setCat] = useState("all");
  const [act, setAct] = useState("all");
  const shown = places.filter((p) => (cat === "all" || p.category === cat) && (act === "all" || p.tags.includes(act)));
  const chip = (current: string, set: (k: string) => void, key: string, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => set(key)}
      aria-pressed={current === key}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${current === key ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink hover:border-brand"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-2">{labels.feel}</p>
            <div role="group" aria-label={labels.feel} className="flex flex-wrap gap-2">
              {chip(act, setAct, "all", labels.all)}
              {activities.map((a) => chip(act, setAct, a.key, a.label))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-2">{labels.kind}</p>
            <div role="group" aria-label={labels.kind} className="flex flex-wrap gap-2">
              {chip(cat, setCat, "all", labels.all)}
              {categories.map((c) => chip(cat, setCat, c.key, c.label))}
            </div>
          </div>
        </div>
        <label className="block lg:w-80">
          <span className="eyebrow">{labels.jump}</span>
          <select
            className="field mt-1.5"
            defaultValue=""
            onChange={(e) => e.target.value && router.push(`/${locale}/area/${e.target.value}`)}
          >
            <option value="" disabled>{labels.jumpHint}</option>
            {places.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name} · {p.drive}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-ink-soft" aria-live="polite">{shown.length} {labels.shown}</p>

      {shown.length === 0 && <p className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">{labels.none}</p>}
      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((pl) => (
          <li key={pl.slug}>
            <Link href={`/${locale}/area/${pl.slug}`} className="card lift zoom flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden">
                {pl.photo ? (
                  <Image src={`/img/area/${pl.photo}.jpg`} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-gradient-to-br from-tint to-canvas text-brand/60"><Icon name={pl.icon} size={52} weight="duotone" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-brand-deep">{pl.tag}</span>
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-ink-soft"><Icon name="car" size={15} /> {pl.drive}</span>
                </div>
                <h3 className="mt-3 text-[21px]">{pl.name}</h3>
                <p className="mt-1.5 text-[15px] text-ink-soft">{pl.summary}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
