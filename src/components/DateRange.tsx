"use client";
import { useMemo, useState } from "react";
import { addDays, iso, today as todayISO } from "@/lib/dates";
import { Icon } from "./Icon";

type Range = { from: string; to: string };

export function DateRange({
  blocked, value, onChange, minNights, locale, months = 2,
}: {
  blocked: string[]; value: Range; onChange: (r: Range) => void; minNights: number; locale: string; months?: number;
}) {
  const blockedSet = useMemo(() => new Set(blocked), [blocked]);
  const now = todayISO();
  const start = value.from ? new Date(value.from + "T00:00:00Z") : new Date();
  const [cursor, setCursor] = useState(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)));
  const [hover, setHover] = useState("");
  const picking = value.from && !value.to;

  // while choosing a departure, nothing beyond the first blocked night after arrival is reachable
  const limit = useMemo(() => {
    if (!picking) return "";
    for (let d = value.from; d < addDays(value.from, 120); d = addDays(d, 1)) if (blockedSet.has(d) && d > value.from) return d;
    return "";
  }, [picking, value.from, blockedSet]);

  function disabled(d: string) {
    if (d < now) return true;
    if (picking) {
      if (d <= value.from) return d < value.from ? false : true;
      if (limit && d > limit) return true;
      return false;
    }
    return blockedSet.has(d);
  }

  function pick(d: string) {
    if (disabled(d)) return;
    if (!value.from || value.to) return onChange({ from: d, to: "" });
    if (d < value.from) return onChange({ from: d, to: "" });
    onChange({ from: value.from, to: d });
  }

  const fmtMonth = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const dows = locale === "fr" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const end = value.to || (picking && hover > value.from ? hover : "");

  function Month({ offset }: { offset: number }) {
    const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + offset, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let i = 1; i <= days; i++) cells.push(iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), i))));
    return (
      <div className="min-w-[260px] flex-1">
        <p className="serif mb-3 text-center text-[17px] capitalize">{fmtMonth.format(first)}</p>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-ink-soft">
          {dows.map((x, i) => <span key={i} className="py-1">{x}</span>)}
        </div>
        <div className="grid grid-cols-7" role="grid">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const dis = disabled(d);
            const isBlocked = blockedSet.has(d);
            const isStart = d === value.from;
            const isEnd = d === end;
            const inRange = end && d > value.from && d < end;
            const sel = isStart || (isEnd && value.to);
            return (
              <button
                key={d}
                type="button"
                role="gridcell"
                disabled={dis}
                aria-selected={!!sel}
                aria-label={d + (isBlocked ? " (unavailable)" : "")}
                onClick={() => pick(d)}
                onMouseEnter={() => setHover(d)}
                className={[
                  "relative grid h-11 place-items-center text-[14px] outline-offset-[-2px] transition-colors",
                  inRange ? "bg-tint" : "",
                  isStart && end ? "rounded-l-full bg-tint" : "",
                  isEnd && value.from ? "rounded-r-full bg-tint" : "",
                  dis ? "cursor-not-allowed text-ink-soft/40" : "cursor-pointer hover:[&>span]:border-ink",
                  isBlocked && !isStart ? "line-through" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-10 w-10 place-items-center rounded-full border border-transparent leading-none",
                    sel ? "!border-ink bg-ink text-white" : "",
                  ].join(" ")}
                >
                  {Number(d.slice(8))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas"
          onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 1, 1)))}>
          <Icon name="left" size={18} />
        </button>
        <button type="button" aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas"
          onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)))}>
          <Icon name="right" size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-6 -mt-10">
        {Array.from({ length: months }, (_, i) => <Month key={i} offset={i} />)}
      </div>
      {minNights > 1 && <p className="mt-3 text-xs text-ink-soft">{locale === "fr" ? `Séjour minimum : ${minNights} nuits` : `Minimum stay: ${minNights} nights`}</p>}
    </div>
  );
}
