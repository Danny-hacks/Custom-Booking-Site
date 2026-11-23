"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type MapPin = { slug: string; name: string; lat: number; lon: number; drive: string };

type Props = {
  locale: "en" | "fr";
  estate: { lat: number; lon: number; label: string };
  pins: MapPin[];
  labels: { near: string; wide: string; km: string; aria: string; note: string };
};

const KM_LAT = 110.57;
const KM_LON = 111.32;

type Placed = MapPin & { x: number; y: number; dist: number; lx: number; ly: number; anchor: "start" | "end" | "middle" };

/**
 * A map drawn by us from the places' own coordinates, so it needs no map service, key or licence and loads nothing from third parties.
 * Rings show straight-line distance from the estate. "Close by" zooms on the nearest places.
 */
export function AreaMap({ locale, estate, pins, labels }: Props) {
  const [wide, setWide] = useState(false);
  // a taller canvas on phones, so the labels stay readable
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const apply = () => setNarrow(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);
  const W = narrow ? 420 : 800;
  const H = narrow ? 600 : 560;
  const fs = narrow ? 14 : 13;

  const { placed, rings, scale, extent } = useMemo(() => {
    const cosLat = Math.cos((estate.lat * Math.PI) / 180);
    const all = pins.map((p) => {
      const dx = (p.lon - estate.lon) * cosLat * KM_LON;
      const dy = (estate.lat - p.lat) * KM_LAT;
      return { ...p, dx, dy, dist: Math.hypot(dx, dy) };
    });
    const visible = wide ? all : all.filter((p) => p.dist <= 28);
    const minExtent = wide ? 0 : 28;
    const maxX = Math.max(minExtent, ...visible.map((p) => Math.abs(p.dx)));
    const maxY = Math.max(minExtent, ...visible.map((p) => Math.abs(p.dy)));
    const scale = Math.min((W / 2 - 100) / maxX, (H / 2 - 70) / maxY);
    const cx = W / 2;
    const cy = H / 2;

    // greedy label placement: try right, left, above, below; keep the first spot that does not hit an earlier label or any pin
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const pinBoxes = visible.map((p) => ({ x: cx + p.dx * scale - 9, y: cy + p.dy * scale - 9, w: 18, h: 18 }));
    pinBoxes.push({ x: cx - 14, y: cy - 14, w: 28, h: 28 });
    const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const placed: Placed[] = [...visible]
      .sort((a, b) => a.dist - b.dist)
      .map((p) => {
        const x = cx + p.dx * scale;
        const y = cy + p.dy * scale;
        const w = p.name.length * (narrow ? 8 : 7.5) + 8;
        const h = 18;
        const options = [
          { lx: x + 12, ly: y + 4, anchor: "start" as const, box: { x: x + 10, y: y - 10, w, h } },
          { lx: x - 12, ly: y + 4, anchor: "end" as const, box: { x: x - 10 - w, y: y - 10, w, h } },
          { lx: x, ly: y - 14, anchor: "middle" as const, box: { x: x - w / 2, y: y - 28, w, h } },
          { lx: x, ly: y + 24, anchor: "middle" as const, box: { x: x - w / 2, y: y + 10, w, h } },
          { lx: x + 12, ly: y - 12, anchor: "start" as const, box: { x: x + 10, y: y - 26, w, h } },
          { lx: x + 12, ly: y + 22, anchor: "start" as const, box: { x: x + 10, y: y + 8, w, h } },
          { lx: x - 12, ly: y - 12, anchor: "end" as const, box: { x: x - 10 - w, y: y - 26, w, h } },
          { lx: x - 12, ly: y + 22, anchor: "end" as const, box: { x: x - 10 - w, y: y + 8, w, h } },
          { lx: x + 12, ly: y - 28, anchor: "start" as const, box: { x: x + 10, y: y - 42, w, h } },
          { lx: x - 12, ly: y + 38, anchor: "end" as const, box: { x: x - 10 - w, y: y + 24, w, h } },
        ];
        const inside = (o: (typeof options)[number]) => o.box.x >= 4 && o.box.x + o.box.w <= W - 4 && o.box.y >= 4 && o.box.y + o.box.h <= H - 4;
        const pick =
          options.find((o) => inside(o) && !boxes.some((b) => hit(o.box, b)) && !pinBoxes.some((b) => hit(o.box, b))) ??
          options.find((o) => inside(o)) ??
          options[0];
        boxes.push(pick.box);
        return { slug: p.slug, name: p.name, lat: p.lat, lon: p.lon, drive: p.drive, x, y, dist: p.dist, lx: pick.lx, ly: pick.ly, anchor: pick.anchor };
      });

    const step = wide ? 25 : 10;
    const maxR = Math.max(maxX, maxY) * 1.05;
    const rings: number[] = [];
    for (let r = step; r <= maxR; r += step) rings.push(r);
    return { placed, rings, scale, extent: maxR };
  }, [estate.lat, estate.lon, pins, wide, W, H, narrow]);

  const tab = (isWide: boolean, label: string) => (
    <button
      type="button"
      onClick={() => setWide(isWide)}
      aria-pressed={wide === isWide}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${wide === isWide ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink hover:border-brand"}`}
    >
      {label}
    </button>
  );

  const cx = W / 2;
  const cy = H / 2;

  return (
    <div className="card overflow-hidden p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div role="group" aria-label={labels.aria} className="flex flex-wrap gap-2">
          {tab(false, labels.near)}
          {tab(true, labels.wide)}
        </div>
        <p className="text-sm text-ink-soft">{labels.note}</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={labels.aria} className="mt-3 block h-auto w-full rounded-[18px] bg-canvas">
        {rings.map((r) => (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r * scale} fill="none" stroke="var(--line)" strokeWidth={1.5} strokeDasharray="4 6" />
            {cy - r * scale > 14 && (
              <text x={cx} y={cy - r * scale - 5} textAnchor="middle" fontSize={narrow ? 12 : 11} fill="var(--ink-soft)">{r} {labels.km}</text>
            )}
          </g>
        ))}

        {placed.map((p) => (
          <Link key={p.slug} href={`/${locale}/area/${p.slug}`} className="map-pin" aria-label={`${p.name}, ${p.drive}`}>
            <title>{`${p.name} · ${p.drive}`}</title>
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
            <circle className="map-dot" cx={p.x} cy={p.y} r={7} fill="var(--brand)" stroke="var(--paper)" strokeWidth={2.5} />
            <text className={wide && p.dist < 14 ? "map-label-hover" : undefined} x={p.lx} y={p.ly} textAnchor={p.anchor} fontSize={fs} fontWeight={600} fill="var(--ink)" stroke="var(--canvas)" strokeWidth={4} paintOrder="stroke">{p.name}</text>
          </Link>
        ))}

        <g aria-label={estate.label}>
          <circle cx={cx} cy={cy} r={13} fill="var(--navy)" stroke="var(--sun-bright)" strokeWidth={3} />
          <path d={`M${cx - 5} ${cy + 1} L${cx} ${cy - 5} L${cx + 5} ${cy + 1} V${cy + 5} H${cx - 5} Z`} fill="var(--sun-bright)" />
          <text x={cx} y={cy + 30} textAnchor="middle" fontSize={fs} fontWeight={700} fill="var(--navy)" stroke="var(--canvas)" strokeWidth={4} paintOrder="stroke">{estate.label}</text>
        </g>
        <text x={W - 10} y={H - 10} textAnchor="end" fontSize={narrow ? 11 : 10.5} fill="var(--ink-soft)">N ↑ · {Math.round(extent)} {labels.km}</text>
      </svg>
    </div>
  );
}
