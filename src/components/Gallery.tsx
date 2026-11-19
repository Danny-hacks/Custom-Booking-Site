"use client";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "./Icon";
import { Lightbox } from "./Lightbox";

type P = { src: string; alt: string };

/** The photo mosaic at the top of the property page; opens the full-screen viewer. */
export function Gallery({ photos, showAll, close }: { photos: P[]; showAll: string; close: string }) {
  const [i, setI] = useState<number | null>(null);

  const tile = (n: number, cls: string, priority = false) => (
    <button key={n} type="button" onClick={() => setI(n)} className={`group relative overflow-hidden bg-line ${cls}`} aria-label={photos[n].alt}>
      <Image src={photos[n].src} alt={photos[n].alt} fill priority={priority} sizes="(min-width:1024px) 40vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
    </button>
  );

  return (
    <>
      <div className="relative sm:hidden">
        <div className="no-scrollbar flex h-[300px] snap-x snap-mandatory gap-2 overflow-x-auto rounded-[26px]">
          {photos.slice(0, 10).map((p, n) => (
            <button key={p.src} type="button" onClick={() => setI(n)} aria-label={p.alt} className="relative h-full w-[88%] shrink-0 snap-center overflow-hidden bg-line first:rounded-l-[26px] last:rounded-r-[26px]">
              <Image src={p.src} alt={p.alt} fill priority={n === 0} sizes="90vw" className="object-cover" />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setI(0)} className="absolute bottom-4 right-4 flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-paper px-4 text-sm font-semibold shadow">
          <Icon name="grid" size={18} /> {showAll} ({photos.length})
        </button>
      </div>
      <div className="relative hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[26px] sm:grid lg:h-[480px]">
        {tile(0, "col-span-2 row-span-2", true)}
        {[1, 2, 3, 4].map((n) => tile(n, ""))}
        <button type="button" onClick={() => setI(0)}
          className="absolute bottom-4 right-4 flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-paper px-4 text-sm font-semibold shadow hover:bg-canvas">
          <Icon name="grid" size={18} /> {showAll} ({photos.length})
        </button>
      </div>
      <Lightbox photos={photos} index={i} onIndex={setI} close={close} />
    </>
  );
}
