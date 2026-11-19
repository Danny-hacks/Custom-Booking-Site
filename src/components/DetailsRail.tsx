"use client";
import Image from "next/image";
import { useRef } from "react";
import { Icon } from "./Icon";

/** A scroll-snapping row of close-up photos ("the little things"). Arrow buttons on larger screens, swipe on phones. */
export function DetailsRail({ photos, prev, next }: { photos: { src: string; alt: string }[]; prev: string; next: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * Math.round((ref.current.clientWidth || 600) * 0.8), behavior: "smooth" });
  return (
    <div className="relative">
      <ul ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2" tabIndex={0} aria-label="Photos">
        {photos.map((p) => (
          <li key={p.src} className="group relative aspect-[3/4] w-[62%] shrink-0 snap-start overflow-hidden rounded-[26px] bg-line sm:w-[34%] lg:w-[23%]">
            <Image src={p.src} alt={p.alt} fill sizes="(min-width:1024px) 22vw, 60vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-4 pt-12 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-sm:opacity-100">{p.alt}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden justify-end gap-2 md:flex">
        <button type="button" aria-label={prev} onClick={() => by(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper hover:border-ink"><Icon name="left" size={20} /></button>
        <button type="button" aria-label={next} onClick={() => by(1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper hover:border-ink"><Icon name="right" size={20} /></button>
      </div>
    </div>
  );
}
