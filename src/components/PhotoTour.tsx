"use client";
import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "./Lightbox";

export type TourPhoto = { src: string; alt: string; cat: string };

const STEP = 12;

/** Every photo, filterable by room type: living spaces, bedrooms, bathrooms, outdoors, pool, details. */
export function PhotoTour({
  photos, cats, labels,
}: { photos: TourPhoto[]; cats: { key: string; label: string }[]; labels: { all: string; more: string; close: string } }) {
  const [cat, setCat] = useState("all");
  const [shown, setShown] = useState(STEP);
  const [lb, setLb] = useState<number | null>(null);
  const list = cat === "all" ? photos : photos.filter((p) => p.cat === cat);
  const count = (k: string) => (k === "all" ? photos.length : photos.filter((p) => p.cat === k).length);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {[{ key: "all", label: labels.all }, ...cats].filter((c) => count(c.key) > 0).map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={cat === c.key}
            onClick={() => { setCat(c.key); setShown(STEP); }}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${cat === c.key ? "border-brand bg-brand text-white" : "border-line bg-paper hover:border-ink"}`}
          >
            {c.label} <span className="opacity-70">{count(c.key)}</span>
          </button>
        ))}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {list.slice(0, shown).map((p, i) => (
          <li key={p.src}>
            <button type="button" onClick={() => setLb(i)} aria-label={p.alt} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-line">
              <Image src={p.src} alt={p.alt} fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
            </button>
          </li>
        ))}
      </ul>

      {shown < list.length && (
        <div className="mt-5 text-center">
          <button type="button" onClick={() => setShown((n) => n + STEP)} className="btn-ghost">{labels.more} ({list.length - shown})</button>
        </div>
      )}
      <Lightbox photos={list} index={lb} onIndex={setLb} close={labels.close} />
    </div>
  );
}
