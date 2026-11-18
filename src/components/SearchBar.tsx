"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "./DateRange";
import { Guests, type GuestState } from "./Guests";
import { Icon } from "./Icon";
import { t } from "@/lib/i18n";
import { fmtDate } from "@/lib/dates";
import type { Locale } from "@/lib/property";

/** Airbnb-style pill search: arrival | departure | guests | go. */
export function SearchBar({ slug, locale, minNights, maxGuests }: { slug: string; locale: Locale; minNights: number; maxGuests: number }) {
  const d = t(locale);
  const router = useRouter();
  const [range, setRange] = useState({ from: "", to: "" });
  const [guests, setGuests] = useState<GuestState>({ adults: 2, children: 0, pets: 0 });
  const [open, setOpen] = useState<"" | "dates" | "guests">("");
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/availability?slug=${slug}`).then((r) => r.json()).then((j) => setBlocked(j.blocked ?? [])).catch(() => {});
  }, [slug]);

  const total = guests.adults + guests.children;
  const go = () => {
    const q = new URLSearchParams();
    if (range.from) q.set("from", range.from);
    if (range.to) q.set("to", range.to);
    q.set("adults", String(guests.adults));
    router.push(`/${locale}/properties/${slug}?${q}#book`);
  };

  const seg = "flex min-h-[64px] flex-1 flex-col justify-center rounded-full px-6 text-left hover:bg-canvas/70";
  return (
    <div className="relative">
      <div className="flex flex-col gap-1 rounded-3xl border border-line bg-paper p-2 shadow-[0_10px_40px_rgba(30,43,56,0.14)] md:flex-row md:items-center md:rounded-full">
        <button type="button" className={seg} onClick={() => setOpen(open === "dates" ? "" : "dates")} aria-expanded={open === "dates"}>
          <span className="text-[11px] font-bold uppercase tracking-wider">{d.search.arrival}</span>
          <span className={range.from ? "" : "text-ink-soft"}>{range.from ? fmtDate(range.from, locale) : d.search.addDates}</span>
        </button>
        <span className="hidden h-8 w-px bg-line md:block" />
        <button type="button" className={seg} onClick={() => setOpen(open === "dates" ? "" : "dates")} aria-expanded={open === "dates"}>
          <span className="text-[11px] font-bold uppercase tracking-wider">{d.search.departure}</span>
          <span className={range.to ? "" : "text-ink-soft"}>{range.to ? fmtDate(range.to, locale) : d.search.addDates}</span>
        </button>
        <span className="hidden h-8 w-px bg-line md:block" />
        <button type="button" className={seg} onClick={() => setOpen(open === "guests" ? "" : "guests")} aria-expanded={open === "guests"}>
          <span className="text-[11px] font-bold uppercase tracking-wider">{d.search.guests}</span>
          <span>{total} {total === 1 ? d.search.guest1 : d.search.guestsN}</span>
        </button>
        <button type="button" onClick={go} className="btn m-1 min-h-[56px] md:rounded-full">
          <Icon name="calendar" size={20} weight="bold" /> {d.search.go}
        </button>
      </div>

      {open === "dates" && (
        <div className="pop absolute left-0 right-0 top-full z-30 mt-3 rounded-3xl border border-line bg-paper p-5 shadow-2xl md:left-auto md:right-auto md:w-[680px]">
          <DateRange blocked={blocked} value={range} minNights={minNights} locale={locale}
            months={typeof window !== "undefined" && window.innerWidth < 700 ? 1 : 2}
            onChange={(r) => { setRange(r); if (r.to) setOpen("guests"); }} />
        </div>
      )}
      {open === "guests" && (
        <div className="pop absolute right-0 top-full z-30 mt-3 w-full rounded-3xl border border-line bg-paper p-5 shadow-2xl md:w-[360px]">
          <Guests value={guests} onChange={setGuests} max={maxGuests} labels={{ adults: d.card.adults, children: d.card.children, pets: d.card.pets, max: d.card.guestsMax }} />
        </div>
      )}
    </div>
  );
}
