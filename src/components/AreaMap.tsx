"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import geo from "@/lib/map-geo.json";

export type MapPin = { slug: string; name: string; lat: number; lon: number; drive: string; photo?: string; tag?: string };

type Props = {
  locale: "en" | "fr";
  estate: { lat: number; lon: number; label: string };
  pins: MapPin[];
  labels: { near: string; wide: string; km: string; aria: string; note: string; credit: string; legendRiver: string; legendRoad: string };
};

const KM_LAT = 110.57;
const KM_LON = 111.32;
type Pt = [number, number];
type Line = { name?: string; ref?: string; of?: string; pts: Pt[] };
const GEO = geo as unknown as { rivers: Line[]; roads: Line[]; borders: Line[]; lakes: Line[] };

type Placed = MapPin & { x: number; y: number; dist: number; lx: number; ly: number; anchor: "start" | "end" | "middle"; dot: boolean; hideLabel: boolean };

/** A small optimised copy of a site photo, so the map never loads the full-size pictures. */
const thumb = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=96&q=70`;

/**
 * A map drawn from our own place coordinates over a light skeleton of the area (rivers, main roads, département borders, lakes)
 * baked from OpenStreetMap open data, so it loads nothing from a map service. Rings show straight-line distance from the estate.
 */
export function AreaMap({ locale, estate, pins, labels }: Props) {
  const [wide, setWide] = useState(false);
  const [active, setActive] = useState<string | null>(null);
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
  const H = narrow ? 680 : 560;
  const fs = narrow ? 14 : 13;
  const cx = W / 2;
  const cy = H / 2;

  const m = useMemo(() => {
    const cosLat = Math.cos((estate.lat * Math.PI) / 180);
    const all = pins.map((p) => {
      const dx = (p.lon - estate.lon) * cosLat * KM_LON;
      const dy = (estate.lat - p.lat) * KM_LAT;
      return { ...p, dx, dy, dist: Math.hypot(dx, dy) };
    });
    const nearR = narrow ? 24 : 28; // phones show a slightly tighter circle so the pins are bigger
    const visible = wide ? all : all.filter((p) => p.dist <= nearR);
    const minExtent = wide ? 0 : nearR;
    const maxX = Math.max(minExtent, ...visible.map((p) => Math.abs(p.dx)));
    const maxY = Math.max(minExtent, ...visible.map((p) => Math.abs(p.dy)));
    const scale = Math.min((W / 2 - (narrow ? 56 : 100)) / maxX, (H / 2 - 80) / maxY);
    const proj = (la: number, lo: number): Pt => [cx + (lo - estate.lon) * cosLat * KM_LON * scale, cy + (estate.lat - la) * KM_LAT * scale];

    // greedy label placement: try several spots around the pin, keep the first that hits no earlier label or pin
    const boxes: { x: number; y: number; w: number; h: number }[] = [{ x: cx - estate.label.length * 4.5, y: cy + 20, w: estate.label.length * 9, h: 20 }];
    const R = 16;
    const pinBoxes = visible.map((p) => ({ x: cx + p.dx * scale - R, y: cy + p.dy * scale - R, w: R * 2, h: R * 2 }));
    pinBoxes.push({ x: cx - 16, y: cy - 16, w: 32, h: 32 });
    const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const placed: Placed[] = [...visible]
      .sort((a, b) => a.dist - b.dist)
      .map((p) => {
        const x = cx + p.dx * scale;
        const y = cy + p.dy * scale;
        const dot = wide && p.dist < 14; // crowded around the estate in the wide view: a plain dot, name on hover
        const r = dot || !p.photo ? 8 : 15;
        const w = p.name.length * (narrow ? 8 : 7.5) + 8;
        const h = 18;
        const o = r + 4;
        const options = [
          { lx: x + o, ly: y + 4, anchor: "start" as const, box: { x: x + o - 2, y: y - 10, w, h } },
          { lx: x - o, ly: y + 4, anchor: "end" as const, box: { x: x - o + 2 - w, y: y - 10, w, h } },
          { lx: x, ly: y - r - 6, anchor: "middle" as const, box: { x: x - w / 2, y: y - r - 20, w, h } },
          { lx: x, ly: y + r + 16, anchor: "middle" as const, box: { x: x - w / 2, y: y + r + 2, w, h } },
          { lx: x + o, ly: y - r, anchor: "start" as const, box: { x: x + o - 2, y: y - r - 14, w, h } },
          { lx: x + o, ly: y + r + 10, anchor: "start" as const, box: { x: x + o - 2, y: y + r - 4, w, h } },
          { lx: x - o, ly: y - r, anchor: "end" as const, box: { x: x - o + 2 - w, y: y - r - 14, w, h } },
          { lx: x - o, ly: y + r + 10, anchor: "end" as const, box: { x: x - o + 2 - w, y: y + r - 4, w, h } },
          { lx: x + o, ly: y - r - 16, anchor: "start" as const, box: { x: x + o - 2, y: y - r - 30, w, h } },
          { lx: x - o, ly: y + r + 26, anchor: "end" as const, box: { x: x - o + 2 - w, y: y + r + 12, w, h } },
        ];
        const inside = (op: (typeof options)[number]) => op.box.x >= 4 && op.box.x + op.box.w <= W - 4 && op.box.y >= 4 && op.box.y + op.box.h <= H - 4;
        const overlap = (op: (typeof options)[number]) => [...boxes, ...pinBoxes].filter((b) => hit(op.box, b)).length + (inside(op) ? 0 : 5);
        const pick = options.find((op) => overlap(op) === 0) ?? [...options].sort((a, b) => overlap(a) - overlap(b))[0];
        // a label that cannot fit anywhere without covering another stays hidden until the pin is hovered or focused
        const hideLabel = dot || overlap(pick) > 0;
        if (!hideLabel) boxes.push(pick.box);
        return { slug: p.slug, name: p.name, lat: p.lat, lon: p.lon, drive: p.drive, photo: p.photo, tag: p.tag, x, y, dist: p.dist, lx: pick.lx, ly: pick.ly, anchor: pick.anchor, dot, hideLabel };
      });

    const step = wide ? 25 : 10;
    const maxR = Math.max(maxX, maxY) * 1.05;
    const rings: number[] = [];
    for (let r = step; r <= maxR; r += step) rings.push(r);

    // the map skeleton, projected and trimmed to what is on screen
    const margin = 40;
    const toPath = (line: Line) => {
      const pts = line.pts.map(([la, lo]) => proj(la, lo));
      if (!pts.some(([x, y]) => x > -margin && x < W + margin && y > -margin && y < H + margin)) return null;
      return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
    };
    const paths = (lines: Line[], pick?: (l: Line) => boolean) => lines.flatMap((l, i) => (pick && !pick(l) ? [] : [{ i, name: l.name ?? l.ref ?? "", d: toPath(l) }])).filter((x): x is { i: number; name: string; d: string } => !!x.d);
    const rivers = paths(GEO.rivers);
    const roads = paths(GEO.roads);
    const borders = paths(GEO.borders);
    const lakes = paths(GEO.lakes);
    // one label per big river, along its longest visible piece
    const riverLabels = ["Viaur", "Aveyron", "Tarn"].flatMap((name) => {
      const mine = rivers.filter((r) => r.name === name).sort((a, b) => b.d.length - a.d.length)[0];
      return mine && mine.d.length > 160 ? [{ name, id: `river-${name}`, d: mine.d }] : [];
    });
    return { placed, rings, scale, extent: maxR, rivers, roads, borders, lakes, riverLabels };
  }, [estate.lat, estate.lon, estate.label, pins, wide, W, H, narrow, cx, cy]);

  const tab = (isWide: boolean, label: string) => (
    <button
      type="button"
      onClick={() => { setWide(isWide); setActive(null); }}
      aria-pressed={wide === isWide}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${wide === isWide ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink hover:border-brand"}`}
    >
      {label}
    </button>
  );

  const sel = m.placed.find((p) => p.slug === active);
  const tipX = sel ? (sel.x < W * 0.22 ? "-12%" : sel.x > W * 0.78 ? "-88%" : "-50%") : "-50%";
  const tipBelow = sel ? sel.y < H * 0.34 : false;

  return (
    <div className="card overflow-hidden p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div role="group" aria-label={labels.aria} className="flex flex-wrap gap-2">
          {tab(false, labels.near)}
          {tab(true, labels.wide)}
        </div>
        <p className="text-sm text-ink-soft">{labels.note}</p>
      </div>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={labels.aria} className="block h-auto w-full rounded-[18px]" style={{ background: "#efe6d3" }}>
          <defs>
            <clipPath id="map-clip"><rect width={W} height={H} rx={18} /></clipPath>
            <radialGradient id="map-glow" cx="50%" cy="50%" r="65%"><stop offset="0%" stopColor="#f7f0e2" /><stop offset="100%" stopColor="#e6dac3" /></radialGradient>
          </defs>
          <g clipPath="url(#map-clip)">
            <rect width={W} height={H} fill="url(#map-glow)" />

            {/* skeleton: borders, lakes, rivers, main roads */}
            <g fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
              {m.borders.map((b) => <path key={`b${b.i}`} d={b.d} stroke="#b9a98a" strokeWidth={1.4} strokeDasharray="2 5" />)}
              {m.lakes.map((l) => <path key={`l${l.i}`} d={l.d} fill="#bcd3d6" stroke="#9ebcc2" strokeWidth={0.8} />)}
              {m.rivers.map((r) => <path key={`r${r.i}`} id={m.riverLabels.find((x) => x.d === r.d)?.id} d={r.d} stroke="#9ebfc9" strokeWidth={r.name === "Aveyron" || r.name === "Viaur" || r.name === "Tarn" ? 2.6 : 1.8} />)}
              {m.roads.map((r) => <path key={`d${r.i}`} d={r.d} stroke="#d4c2a0" strokeWidth={2.4} />)}
            </g>
            {m.riverLabels.map((rl) => (
              <text key={rl.id} fontSize={11} fontStyle="italic" fill="#5f8a98" aria-hidden>
                <textPath href={`#${rl.id}`} startOffset="50%" textAnchor="middle">{rl.name}</textPath>
              </text>
            ))}

            {m.rings.map((r) => (
              <g key={r}>
                <circle cx={cx} cy={cy} r={r * m.scale} fill="none" stroke="#c9b894" strokeWidth={1.3} strokeDasharray="4 7" />
                {cy - r * m.scale > 14 && <text x={cx} y={cy - r * m.scale - 5} textAnchor="middle" fontSize={narrow ? 12 : 11} fill="#8a7658" stroke="#efe6d3" strokeWidth={3} paintOrder="stroke">{r} {labels.km}</text>}
              </g>
            ))}

            {m.placed.map((p) => {
              const r = p.dot || !p.photo ? 8 : 15;
              const cid = `pin-${p.slug}`;
              return (
                <Link
                  key={p.slug}
                  href={`/${locale}/area/${p.slug}`}
                  className="map-pin"
                  aria-label={`${p.name}, ${p.drive}`}
                  onMouseEnter={() => setActive(p.slug)}
                  onMouseLeave={() => setActive((a) => (a === p.slug ? null : a))}
                  onFocus={() => setActive(p.slug)}
                  onBlur={() => setActive((a) => (a === p.slug ? null : a))}
                >
                  <title>{`${p.name} · ${p.drive}`}</title>
                  <circle cx={p.x} cy={p.y} r={r + 8} fill="transparent" />
                  {p.photo && !p.dot ? (
                    <g className="map-dot">
                      <clipPath id={cid}><circle cx={p.x} cy={p.y} r={r} /></clipPath>
                      <circle cx={p.x} cy={p.y} r={r + 3} fill="#fcf8f1" />
                      <image href={thumb(p.photo)} x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${cid})`} />
                      <circle cx={p.x} cy={p.y} r={r} fill="none" stroke="var(--brand)" strokeWidth={2} />
                    </g>
                  ) : (
                    <circle className="map-dot" cx={p.x} cy={p.y} r={r - 1} fill="var(--brand)" stroke="#fcf8f1" strokeWidth={2.5} />
                  )}
                  <text className={p.hideLabel ? "map-label-hover" : undefined} x={p.lx} y={p.ly} textAnchor={p.anchor} fontSize={fs} fontWeight={600} fill="var(--ink)" stroke="#efe6d3" strokeWidth={4} paintOrder="stroke">{p.name}</text>
                </Link>
              );
            })}

            <g aria-label={estate.label}>
              <circle cx={cx} cy={cy} r={15} fill="var(--navy)" stroke="var(--sun-bright)" strokeWidth={3.5} />
              <path d={`M${cx - 6} ${cy + 1.5} L${cx} ${cy - 6} L${cx + 6} ${cy + 1.5} V${cy + 6} H${cx - 6} Z`} fill="var(--sun-bright)" />
              <text x={cx} y={cy + 34} textAnchor="middle" fontSize={fs} fontWeight={700} fill="var(--navy)" stroke="#efe6d3" strokeWidth={4} paintOrder="stroke">{estate.label}</text>
            </g>

            <text x={W - 10} y={H - 10} textAnchor="end" fontSize={narrow ? 11 : 10.5} fill="#8a7658">N ↑ · {Math.round(m.extent)} {labels.km}</text>
            <text x={10} y={H - 10} fontSize={narrow ? 10 : 10} fill="#8a7658">{labels.credit}</text>
          </g>
        </svg>

        {/* photo card for the place under the pointer or focus */}
        {sel && (
          <div
            className="pointer-events-none absolute z-10 w-[190px] overflow-hidden rounded-2xl border border-line bg-paper shadow-xl"
            style={{ left: `${(sel.x / W) * 100}%`, top: `${(sel.y / H) * 100}%`, transform: `translate(${tipX}, ${tipBelow ? "22px" : "calc(-100% - 22px)"})` }}
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {sel.photo && <img src={`/_next/image?url=${encodeURIComponent(sel.photo)}&w=384&q=70`} alt="" className="h-[96px] w-full object-cover" />}
            <div className="p-3">
              <p className="text-[14px] font-semibold leading-tight">{sel.name}</p>
              {sel.tag && <p className="mt-0.5 text-[12px] text-ink-soft">{sel.tag}</p>}
              <p className="mt-1 text-[12px] font-semibold text-brand">{sel.drive}</p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="inline-block h-[3px] w-5 rounded bg-[#9ebfc9]" /> {labels.legendRiver}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-[3px] w-5 rounded bg-[#d4c2a0]" /> {labels.legendRoad}</span>
      </p>
    </div>
  );
}
