"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "./DateRange";
import { Guests, type GuestState } from "./Guests";
import { Icon } from "./Icon";
import { t } from "@/lib/i18n";
import { diffDays, eur, fmtDate } from "@/lib/dates";
import type { Locale } from "@/lib/property";

type Quote = {
  nights: number; accommodation: number; cleaning: number; tax: number; total: number; avg: number;
  discount: number; offer: { title: string; badge: string } | null; codeInvalid: boolean;
};

export function BookingCard({
  slug, locale, minNights, maxGuests, fromPrice, initial, compact,
}: {
  slug: string; locale: Locale; minNights: number; maxGuests: number; fromPrice: number;
  initial?: { from?: string; to?: string; adults?: number; code?: string }; compact?: boolean;
}) {
  const d = t(locale);
  const router = useRouter();
  const [range, setRange] = useState({ from: initial?.from ?? "", to: initial?.to ?? "" });
  const [guests, setGuests] = useState<GuestState>({ adults: initial?.adults ?? 2, children: 0, pets: 0 });
  const [open, setOpen] = useState<"" | "dates" | "guests">("");
  const [codeInput, setCodeInput] = useState(initial?.code ?? "");
  const [code, setCode] = useState((initial?.code ?? "").toUpperCase());
  const [showCode, setShowCode] = useState(!!initial?.code);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [result, setResult] = useState<{ key: string; quote?: Quote; err?: string }>({ key: "" });

  useEffect(() => {
    fetch(`/api/availability?slug=${slug}`).then((r) => r.json()).then((j) => setBlocked(j.blocked ?? [])).catch(() => {});
  }, [slug]);

  const nights = range.from && range.to ? diffDays(range.from, range.to) : 0;
  const ready = nights >= 1;
  const short = ready && nights < minNights;
  const key = ready && !short ? `${range.from}|${range.to}|${guests.adults}|${code}` : "";
  const fresh = result.key === key;
  const quote = key && fresh ? result.quote ?? null : null;
  const err = key && fresh ? result.err ?? "" : "";
  const busy = !!key && !fresh;

  useEffect(() => {
    if (!key) return;
    const ctl = new AbortController();
    fetch(`/api/quote?slug=${slug}&from=${range.from}&to=${range.to}&adults=${guests.adults}&locale=${locale}&code=${encodeURIComponent(code)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((j) => setResult({ key, ...(j.error ? { err: j.error === "unavailable" ? d.card.unavailable : String(j.error) } : { quote: j }) }))
      .catch(() => {});
    return () => ctl.abort();
  }, [key, slug, locale, code, range.from, range.to, guests.adults, d.card.unavailable]);

  const total = guests.adults + guests.children;
  const href = useMemo(
    () => `/${locale}/book?slug=${slug}&from=${range.from}&to=${range.to}&adults=${guests.adults}&children=${guests.children}&pets=${guests.pets}${code ? `&code=${encodeURIComponent(code)}` : ""}`,
    [locale, slug, range, guests, code],
  );

  return (
    <div className={`relative rounded-2xl border border-line bg-paper p-5 shadow-[0_8px_30px_rgba(30,43,56,0.10)] ${compact ? "" : ""}`}>
      <p className="flex items-baseline gap-1.5">
        {quote ? (
          <>
            {quote.discount > 0 && <span className="text-ink-soft line-through">{eur(Math.round(quote.accommodation / quote.nights), locale)}</span>}
            <span className="serif text-[26px]">{eur(quote.avg, locale)}</span>
            <span className="text-ink-soft">{d.card.perNight}</span>
            {quote.offer?.badge && <span className="badge-deal ml-auto">{quote.offer.badge}</span>}
          </>
        ) : (
          <>
            <span className="text-ink-soft">{d.card.from}</span>
            <span className="serif text-[26px]">{eur(fromPrice, locale)}</span>
            <span className="text-ink-soft">{d.card.perNight}</span>
          </>
        )}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-ink/70">
        <div className="grid grid-cols-2">
          <button type="button" onClick={() => setOpen(open === "dates" ? "" : "dates")} className="border-r border-ink/70 p-3 text-left hover:bg-canvas/60" aria-expanded={open === "dates"}>
            <span className="block text-[10px] font-bold uppercase tracking-wider">{d.search.arrival}</span>
            <span className={range.from ? "" : "text-ink-soft"}>{range.from ? fmtDate(range.from, locale) : d.search.addDates}</span>
          </button>
          <button type="button" onClick={() => setOpen(open === "dates" ? "" : "dates")} className="p-3 text-left hover:bg-canvas/60" aria-expanded={open === "dates"}>
            <span className="block text-[10px] font-bold uppercase tracking-wider">{d.search.departure}</span>
            <span className={range.to ? "" : "text-ink-soft"}>{range.to ? fmtDate(range.to, locale) : d.search.addDates}</span>
          </button>
        </div>
        <button type="button" onClick={() => setOpen(open === "guests" ? "" : "guests")} className="flex w-full items-center justify-between border-t border-ink/70 p-3 text-left hover:bg-canvas/60" aria-expanded={open === "guests"}>
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wider">{d.search.guests}</span>
            <span>{total} {total === 1 ? d.search.guest1 : d.search.guestsN}{guests.pets ? ` · ${guests.pets} ${d.card.pets.toLowerCase()}` : ""}</span>
          </span>
          <Icon name="down" size={18} className={open === "guests" ? "rotate-180" : ""} />
        </button>
      </div>

      {open === "guests" && (
        <div className="pop mt-3 rounded-xl border border-line bg-paper p-3">
          <Guests value={guests} onChange={setGuests} max={maxGuests} labels={{ adults: d.card.adults, children: d.card.children, pets: d.card.pets, max: d.card.guestsMax }} />
        </div>
      )}
      {open === "dates" && (
        <div className="pop absolute right-0 top-full z-30 mt-2 w-[min(94vw,640px)] rounded-2xl border border-line bg-paper p-5 shadow-2xl lg:right-0">
          <DateRange
            blocked={blocked}
            value={range}
            minNights={minNights}
            locale={locale}
            months={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2}
            onChange={(r) => { setRange(r); if (r.to) setOpen(""); }}
          />
          <div className="mt-3 flex justify-between">
            <button type="button" className="text-sm font-semibold underline" onClick={() => setRange({ from: "", to: "" })}>{d.card.clear}</button>
            <button type="button" className="text-sm font-semibold" onClick={() => setOpen("")}>{d.card.close}</button>
          </div>
        </div>
      )}

      {showCode ? (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); setCode(codeInput.trim().toUpperCase()); }}>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} aria-label={d.offers.code} placeholder={d.offers.code} className="field uppercase" />
          <button className="btn-ghost shrink-0">{d.offers.apply}</button>
        </form>
      ) : (
        <button type="button" onClick={() => setShowCode(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Icon name="tag" size={15} /> {d.offers.code}</button>
      )}
      {quote?.codeInvalid && <p role="alert" className="mt-2 text-sm text-danger">{d.offers.invalid}</p>}
      {quote?.offer && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-leaf"><Icon name="check" size={16} weight="bold" /> {d.offers.applied}: {quote.offer.title}</p>}

      {short && <p role="alert" className="mt-3 text-sm text-danger">{d.card.minStay}: {minNights} {d.card.nights}</p>}
      {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}

      <button
        type="button"
        className="btn mt-4 w-full"
        disabled={!quote || busy}
        onClick={() => router.push(href)}
      >
        {busy ? d.card.checking : ready && quote ? d.card.reserve : d.card.pickDates}
      </button>

      {quote && (
        <>
          <p className="mt-3 text-center text-sm text-ink-soft">{d.card.notCharged}</p>
          <dl key={quote.total} className="quote-in mt-4 space-y-2.5 text-[15px]">
            <div className="flex justify-between"><dt className="underline decoration-dotted">{eur(Math.round(quote.accommodation / quote.nights), locale)} × {quote.nights} {quote.nights === 1 ? d.card.night : d.card.nights}</dt><dd>{eur(quote.accommodation, locale)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between font-semibold text-leaf"><dt>{d.offers.save}</dt><dd>−{eur(quote.discount, locale)}</dd></div>}
            <div className="flex justify-between"><dt className="underline decoration-dotted">{d.card.cleaning}</dt><dd>{eur(quote.cleaning, locale)}</dd></div>
            {quote.tax > 0 && <div className="flex justify-between"><dt className="underline decoration-dotted">{d.card.tax}</dt><dd>{eur(quote.tax, locale)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-3 text-[17px] font-bold"><dt>{d.card.total}</dt><dd>{eur(quote.total, locale)}</dd></div>
          </dl>
        </>
      )}
    </div>
  );
}
