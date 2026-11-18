"use client";
import { Icon } from "./Icon";

export type GuestState = { adults: number; children: number; pets: number };

function Row({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-semibold">{label}</p>
        {sub && <p className="text-xs text-ink-soft">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`${label} -`} disabled={value <= min} onClick={() => onChange(value - 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-ink-soft/50 disabled:opacity-30 hover:border-ink"><Icon name="minus" size={16} /></button>
        <span className="w-6 text-center tabular-nums" aria-live="polite">{value}</span>
        <button type="button" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-ink-soft/50 disabled:opacity-30 hover:border-ink"><Icon name="plus" size={16} /></button>
      </div>
    </div>
  );
}

export function Guests({
  value, onChange, max, labels,
}: {
  value: GuestState; onChange: (g: GuestState) => void; max: number;
  labels: { adults: string; children: string; pets: string; max: string };
}) {
  const total = value.adults + value.children;
  return (
    <div className="divide-y divide-line">
      <Row label={labels.adults} sub="13+" value={value.adults} min={1} max={max - value.children} onChange={(n) => onChange({ ...value, adults: n })} />
      <Row label={labels.children} sub="0-12" value={value.children} min={0} max={max - value.adults} onChange={(n) => onChange({ ...value, children: n })} />
      <Row label={labels.pets} value={value.pets} min={0} max={5} onChange={(n) => onChange({ ...value, pets: n })} />
      {total >= max && <p className="pt-2 text-xs text-ink-soft">{labels.max}: {max}</p>}
    </div>
  );
}
