"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type P = { src: string; alt: string };

export function Gallery({ photos, showAll, close }: { photos: P[]; showAll: string; close: string }) {
  const [i, setI] = useState<number | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const go = useCallback((n: number) => setI((x) => (x === null ? x : (x + n + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (i !== null && !dlg.open) dlg.showModal();
    if (i === null && dlg.open) dlg.close();
  }, [i]);

  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [i, go]);

  const tile = (n: number, cls: string, priority = false) => (
    <button key={n} type="button" onClick={() => setI(n)} className={`group relative overflow-hidden bg-line ${cls}`} aria-label={photos[n].alt}>
      <Image src={photos[n].src} alt={photos[n].alt} fill priority={priority} sizes="(min-width:1024px) 40vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
    </button>
  );

  return (
    <>
      <div className="relative grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-[420px] lg:h-[480px]">
        {tile(0, "col-span-4 row-span-2 sm:col-span-2", true)}
        {[1, 2, 3, 4].map((n) => tile(n, "hidden sm:block"))}
        <button type="button" onClick={() => setI(0)}
          className="absolute bottom-4 right-4 flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-paper px-4 text-sm font-semibold shadow hover:bg-canvas">
          <Icon name="grid" size={18} /> {showAll} ({photos.length})
        </button>
      </div>

      <dialog ref={ref} onClose={() => setI(null)} className="lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-black">
        {i !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <button type="button" onClick={() => setI(null)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-white/10" aria-label={close}>
                <Icon name="x" size={22} /> {close}
              </button>
              <p className="text-sm tabular-nums">{i + 1} / {photos.length}</p>
            </div>
            <div className="relative flex-1">
              <Image key={photos[i].src} src={photos[i].src} alt={photos[i].alt} fill sizes="100vw" className="lightbox-img object-contain" />
              <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="left" /></button>
              <button type="button" aria-label="Next" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="right" /></button>
            </div>
            <p className="p-4 text-center text-sm opacity-80">{photos[i].alt}</p>
          </div>
        )}
      </dialog>
    </>
  );
}
