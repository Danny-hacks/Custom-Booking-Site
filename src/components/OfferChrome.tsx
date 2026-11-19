"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

export type PublicOffer = {
  id: string; title: string; body: string; badge: string; code: string | null; imageUrl: string | null; href: string;
};
type Labels = { claim: string; later: string; dismiss: string; useCode: string };

/** sessionStorage-backed flag that is safe during SSR (false on the server) and when storage is blocked. */
function useSessionFlag(key: string) {
  const subscribe = (cb: () => void) => { window.addEventListener("lb-flag", cb); return () => window.removeEventListener("lb-flag", cb); };
  const get = () => { try { return sessionStorage.getItem(key) === "1"; } catch { return false; } };
  const on = useSyncExternalStore(subscribe, get, () => false);
  const set = () => { try { sessionStorage.setItem(key, "1"); } catch {} window.dispatchEvent(new Event("lb-flag")); };
  return [on, set] as const;
}

/** Slim bar above the header. Several banner offers rotate every 6 seconds. */
export function OfferBanner({ offers, labels }: { offers: PublicOffer[]; labels: Labels }) {
  const [closed, close] = useSessionFlag("lb_banner_closed");
  const [i, setI] = useState(0);
  useEffect(() => {
    if (offers.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % offers.length), 6000);
    return () => clearInterval(id);
  }, [offers.length]);
  if (closed || offers.length === 0) return null;
  const o = offers[i % offers.length];
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex min-h-11 max-w-[1240px] items-center justify-center gap-2 px-5 text-sm">
        <Link key={o.id} href={o.href} className="quote-in group flex min-h-11 min-w-0 items-center gap-2.5 font-medium">
          <span className="badge-deal shrink-0"><Icon name="tag" size={12} weight="fill" /> {o.badge || "Deal"}</span>
          <span className="truncate">{o.title}</span>
          {o.code && <span className="hidden shrink-0 rounded border border-white/40 px-1.5 text-xs font-bold tracking-wider sm:inline">{labels.useCode} {o.code}</span>}
          <Icon name="arrow" size={16} className="hidden shrink-0 transition-transform group-hover:translate-x-1 sm:block" />
        </Link>
        <button type="button" onClick={close} aria-label={labels.dismiss} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/15">
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}

const QUIET_DAYS = 7;

/** One pop-up per visit, a few seconds in; after it is seen it stays quiet for a week. Never on checkout pages. */
export function OfferPopup({ offers, labels }: { offers: PublicOffer[]; labels: Labels }) {
  const path = usePathname();
  const quiet = /\/(book|pay|account)(\/|$)/.test(path);
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const first = offers[0];

  useEffect(() => {
    if (!first || quiet) return;
    const timer = setTimeout(() => {
      try {
        const seen = Number(localStorage.getItem(`lb_pop_${first.id}`) ?? 0);
        if (Date.now() - seen < QUIET_DAYS * 864e5) return;
      } catch {}
      setOpenId(first.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [first, quiet]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (openId && !dlg.open) dlg.showModal();
    if (!openId && dlg.open) dlg.close();
  }, [openId]);

  function dismiss() {
    try { if (first) localStorage.setItem(`lb_pop_${first.id}`, String(Date.now())); } catch {}
    setOpenId(null);
  }

  if (!first) return null;
  return (
    <dialog
      ref={ref}
      onClose={dismiss}
      onClick={(e) => { if (e.target === ref.current) dismiss(); }}
      aria-labelledby="offer-pop-title"
      className="offer-pop m-auto w-[min(92vw,460px)] overflow-hidden rounded-3xl border-0 bg-paper p-0 text-ink shadow-2xl"
    >
      {openId && (
        <div>
          {first.imageUrl && (
            <div className="relative aspect-[16/9]"><Image src={first.imageUrl} alt="" fill sizes="460px" className="object-cover" /></div>
          )}
          <div className="relative p-6 sm:p-7">
            <button type="button" onClick={dismiss} aria-label={labels.dismiss} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full hover:bg-canvas">
              <Icon name="x" size={20} />
            </button>
            <span className="badge-deal"><Icon name="tag" size={12} weight="fill" /> {first.badge || "Deal"}</span>
            <h2 id="offer-pop-title" className="mt-3 pr-8 text-[26px]">{first.title}</h2>
            {first.body && <p className="mt-2 text-ink-soft">{first.body}</p>}
            {first.code && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-brand bg-tint px-3 py-1.5 text-sm">
                {labels.useCode} <strong className="tracking-widest text-brand-deep">{first.code}</strong>
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={first.href} onClick={dismiss} className="btn">{labels.claim} <Icon name="arrow" size={18} /></Link>
              <button type="button" onClick={dismiss} className="px-2 py-2 font-semibold text-ink-soft hover:underline">{labels.later}</button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
