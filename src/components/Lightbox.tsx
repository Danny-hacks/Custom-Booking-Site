"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

export type LightboxPhoto = { src: string; alt: string };

/** Full-screen photo viewer shared by the property mosaic and the photo tour. Arrow keys and Escape work. */
export function Lightbox({
  photos, index, onIndex, close,
}: { photos: LightboxPhoto[]; index: number | null; onIndex: (n: number | null) => void; close: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const n = photos.length;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (index !== null && !dlg.open) dlg.showModal();
    if (index === null && dlg.open) dlg.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, n, onIndex]);

  return (
    <dialog ref={ref} onClose={() => onIndex(null)} className="lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-black">
      {index !== null && photos[index] && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <button type="button" onClick={() => onIndex(null)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-white/10" aria-label={close}>
              <Icon name="x" size={22} /> {close}
            </button>
            <p className="text-sm tabular-nums">{index + 1} / {n}</p>
          </div>
          <div className="relative flex-1">
            <Image key={photos[index].src} src={photos[index].src} alt={photos[index].alt} fill sizes="100vw" className="lightbox-img object-contain" />
            <button type="button" aria-label="Previous" onClick={() => onIndex((index - 1 + n) % n)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="left" /></button>
            <button type="button" aria-label="Next" onClick={() => onIndex((index + 1) % n)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="right" /></button>
          </div>
          <p className="p-4 text-center text-sm opacity-80">{photos[index].alt}</p>
        </div>
      )}
    </dialog>
  );
}
