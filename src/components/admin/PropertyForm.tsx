import Image from "next/image";
import { saveProperty } from "@/app/admin/actions";
import { AMENITY_CATALOG } from "@/lib/amenities";
import { Icon } from "@/components/Icon";
import type { PropertyView } from "@/lib/property";

const v = (n: number | undefined, d = "") => (n === undefined ? d : String(n / 100));
const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}</div>
);

export function PropertyForm({ p }: { p: PropertyView | null }) {
  const action = saveProperty.bind(null, p?.id ?? null);
  const have = new Set((p?.amenities ?? []).map((a) => a.icon));
  const seasons = [...(p?.seasons ?? []), ...Array(3).fill(null)].slice(0, 3);
  const pol = p?.policy ?? [{ daysBefore: 30, refundPct: 100 }, { daysBefore: 14, refundPct: 50 }];
  const section = "rounded-2xl border border-line bg-paper p-5";

  return (
    <form action={action} encType="multipart/form-data" className="max-w-4xl space-y-6">
      <section className={section}>
        <h2 className="text-xl">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input name="name" required defaultValue={p?.name} className="field" /></Field>
          <Field label="URL slug" hint="Leave empty to generate from the name."><input name="slug" defaultValue={p?.slug} className="field" /></Field>
          <Field label="Location"><input name="location" defaultValue={p?.location} placeholder="Town, region" className="field" /></Field>
          <Field label="Status"><select name="status" defaultValue={p?.status ?? "draft"} className="field"><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
          {(["maxGuests", "bedrooms", "beds", "bathrooms"] as const).map((k) => (
            <Field key={k} label={k === "maxGuests" ? "Max guests" : k[0].toUpperCase() + k.slice(1)}><input name={k} type="number" min={1} defaultValue={p?.[k] ?? 2} className="field" /></Field>
          ))}
          <Field label="Check-in time"><input name="checkInTime" defaultValue={p?.checkInTime ?? "16:00"} className="field" /></Field>
          <Field label="Check-out time"><input name="checkOutTime" defaultValue={p?.checkOutTime ?? "10:00"} className="field" /></Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-xl">Photos</h2>
        <p className="text-sm text-ink-soft">The cover photo is shown first. JPG, PNG or WebP, up to 12 MB each.</p>
        {p && p.photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {p.photos.map((ph, i) => (
              <li key={ph.src} className="text-xs">
                <div className="relative aspect-square overflow-hidden rounded-lg"><Image src={ph.src} alt="" fill sizes="120px" className="object-cover" /></div>
                <label className="mt-1 flex items-center gap-1"><input type="radio" name="cover" value={ph.src} defaultChecked={i === 0} /> Cover</label>
                <label className="flex items-center gap-1 text-danger"><input type="checkbox" name="removePhoto" value={ph.src} /> Remove</label>
              </li>
            ))}
          </ul>
        )}
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="field mt-4 !py-2.5" />
      </section>

      <section className={section}>
        <h2 className="text-xl">Prices (EUR)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Base nightly rate"><input name="baseNight" inputMode="decimal" required defaultValue={v(p?.baseNight)} className="field" /></Field>
          <Field label="Cleaning fee"><input name="cleaningFee" inputMode="decimal" defaultValue={v(p?.cleaningFee, "0")} className="field" /></Field>
          <Field label="Tourist tax / adult / night"><input name="touristTax" inputMode="decimal" defaultValue={v(p?.touristTax, "0")} className="field" /></Field>
          <Field label="Minimum nights"><input name="minNights" type="number" min={1} defaultValue={p?.minNights ?? 2} className="field" /></Field>
          <Field label="Airbnb / Booking.com markup (%)"><input name="channelMarkup" type="number" min={0} max={50} defaultValue={p?.channelMarkup ?? 0} className="field" /></Field>
        </div>
        <p className="mt-2 text-sm text-ink-soft">With Beds24 connected, saving sends these prices to Airbnb and Booking.com for the next 365 nights, raised by the markup. The markup covers the platforms’ commission (Airbnb keeps about 15.5% when prices come from software), so direct guests on this site pay less. Offers stay on this site only.</p>
        <h3 className="mt-6 text-base font-semibold">Seasonal rates (optional, dates as MM-DD)</h3>
        <div className="mt-3 space-y-3">
          {seasons.map((s, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-4">
              <input name={`season_name_${i}`} placeholder="Name (Summer)" defaultValue={s?.name} className="field" aria-label="Season name" />
              <input name={`season_from_${i}`} placeholder="07-01" defaultValue={s?.from} className="field" aria-label="From" />
              <input name={`season_to_${i}`} placeholder="08-31" defaultValue={s?.to} className="field" aria-label="To" />
              <input name={`season_night_${i}`} inputMode="decimal" placeholder="Nightly €" defaultValue={s ? v(s.night) : ""} className="field" aria-label="Nightly rate" />
            </div>
          ))}
        </div>
      </section>

      <section className={section}>
        <h2 className="text-xl">Cancellation policy</h2>
        <p className="text-sm text-ink-soft">Refund % to guests by days before arrival. After the last tier: no refund.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="Tier 1: days before"><input name="p1_days" type="number" defaultValue={pol[0]?.daysBefore ?? 30} className="field" /></Field>
          <Field label="Refund %"><input name="p1_pct" type="number" defaultValue={pol[0]?.refundPct ?? 100} className="field" /></Field>
          <Field label="Tier 2: days before"><input name="p2_days" type="number" defaultValue={pol[1]?.daysBefore ?? 14} className="field" /></Field>
          <Field label="Refund %"><input name="p2_pct" type="number" defaultValue={pol[1]?.refundPct ?? 50} className="field" /></Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-xl">Amenities</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {Object.entries(AMENITY_CATALOG).map(([k, a]) => (
            <label key={k} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2">
              <input type="checkbox" name="amenity" value={k} defaultChecked={have.has(k)} className="accent-[var(--brand)]" />
              <Icon name={a.icon} size={20} /> {a.en}
            </label>
          ))}
        </div>
      </section>

      {(["en", "fr"] as const).map((l) => (
        <section key={l} className={section}>
          <h2 className="text-xl">{l === "en" ? "English" : "Français"} text</h2>
          <div className="mt-4 space-y-4">
            <Field label="Tagline"><input name={`tagline_${l}`} defaultValue={p?.content[l].tagline} className="field" /></Field>
            <Field label="Short summary"><textarea name={`summary_${l}`} defaultValue={p?.content[l].summary} className="field" /></Field>
            <Field label="Story (one paragraph per line)"><textarea name={`story_${l}`} defaultValue={p?.content[l].story.join("\n")} className="field !min-h-32" /></Field>
            <Field label="House rules (one per line)"><textarea name={`rules_${l}`} defaultValue={p?.content[l].rules.join("\n")} className="field" /></Field>
          </div>
        </section>
      ))}

      <button className="btn">{p ? "Save changes" : "Create property"}</button>
    </form>
  );
}
