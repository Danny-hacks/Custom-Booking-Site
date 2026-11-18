import Image from "next/image";
import { saveOffer } from "@/app/admin/actions";

type Offer = {
  id: string; active: boolean; priority: number; titleEn: string; titleFr: string; bodyEn: string; bodyFr: string;
  badgeEn: string; badgeFr: string; kind: string; value: number; code: string | null; minNights: number;
  bookFrom: string | null; bookTo: string | null; stayFrom: string | null; stayTo: string | null; propertyId: string | null;
  imageUrl: string | null; showBanner: boolean; showPopup: boolean; showCard: boolean;
};

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}</div>
);
const Check = ({ name, label, hint, on }: { name: string; label: string; hint: string; on: boolean }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-canvas">
    <input type="checkbox" name={name} defaultChecked={on} className="mt-1 h-5 w-5 accent-[var(--brand)]" />
    <span><span className="block font-semibold">{label}</span><span className="text-sm text-ink-soft">{hint}</span></span>
  </label>
);

export function OfferForm({ o, properties, err }: { o: Offer | null; properties: { id: string; name: string }[]; err?: string }) {
  const action = saveOffer.bind(null, o?.id ?? null);
  const section = "rounded-2xl border border-line bg-paper p-5";
  const value = o ? (o.kind === "fixed" ? String(o.value / 100) : String(o.value)) : "10";
  return (
    <form action={action} encType="multipart/form-data" className="max-w-4xl space-y-6">
      {err && <p role="alert" className="rounded-xl bg-[#fde8e6] p-3 text-danger">{err === "code" ? "That promo code is already used by another offer." : "Please give the offer an English title."}</p>}

      <section className={section}>
        <h2 className="text-xl">What guests see</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title (English)"><input name="titleEn" required defaultValue={o?.titleEn} placeholder="Spring escape: save 15%" className="field" /></Field>
          <Field label="Title (French)"><input name="titleFr" defaultValue={o?.titleFr} placeholder="Escapade de printemps : -15 %" className="field" /></Field>
          <Field label="Description (English)"><textarea name="bodyEn" defaultValue={o?.bodyEn} className="field" /></Field>
          <Field label="Description (French)"><textarea name="bodyFr" defaultValue={o?.bodyFr} className="field" /></Field>
          <Field label="Badge (English)" hint="Short label on the card, e.g. Save 15%. Empty = generated from the discount."><input name="badgeEn" defaultValue={o?.badgeEn} className="field" /></Field>
          <Field label="Badge (French)"><input name="badgeFr" defaultValue={o?.badgeFr} className="field" /></Field>
        </div>
        <div className="mt-4">
          <Field label="Image" hint="Optional photo for the card and pop-up (landscape works best).">
            <div className="flex items-center gap-4">
              {o?.imageUrl && <div className="relative h-16 w-24 overflow-hidden rounded-lg"><Image src={o.imageUrl} alt="" fill sizes="96px" className="object-cover" /></div>}
              <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" className="text-sm" />
              {o?.imageUrl && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="removeImage" /> Remove</label>}
            </div>
          </Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-xl">The discount</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <select name="kind" defaultValue={o?.kind ?? "percent"} className="field">
              <option value="percent">Percentage off accommodation</option>
              <option value="fixed">Fixed amount off the stay (€)</option>
              <option value="none">No discount (announcement only)</option>
            </select>
          </Field>
          <Field label="Value" hint="% or € depending on the type."><input name="value" inputMode="decimal" defaultValue={value} className="field" /></Field>
          <Field label="Minimum nights"><input name="minNights" type="number" min={1} defaultValue={o?.minNights ?? 1} className="field" /></Field>
          <Field label="Promo code" hint="Leave empty to apply automatically. With a code, guests type it in the booking box."><input name="code" defaultValue={o?.code ?? ""} placeholder="SPRING15" className="field uppercase" /></Field>
          <Field label="Applies to">
            <select name="propertyId" defaultValue={o?.propertyId ?? ""} className="field">
              <option value="">All properties</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Priority" hint="Higher shows first."><input name="priority" type="number" defaultValue={o?.priority ?? 0} className="field" /></Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Bookable from" hint="Offer goes live on this date."><input type="date" name="bookFrom" defaultValue={o?.bookFrom ?? ""} className="field" /></Field>
          <Field label="Bookable until" hint="Last day guests can use it."><input type="date" name="bookTo" defaultValue={o?.bookTo ?? ""} className="field" /></Field>
          <Field label="Stay starts on/after" hint="Restrict to a travel window (optional)."><input type="date" name="stayFrom" defaultValue={o?.stayFrom ?? ""} className="field" /></Field>
          <Field label="Stay ends on/before"><input type="date" name="stayTo" defaultValue={o?.stayTo ?? ""} className="field" /></Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-xl">Where it shows</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Check name="active" on={o?.active ?? true} label="Active" hint="Switch off to hide it everywhere and stop applying it." />
          <Check name="showCard" on={o?.showCard ?? true} label="Offer cards" hint="Home page, Offers page and the property page." />
          <Check name="showBanner" on={o?.showBanner ?? false} label="Top banner" hint="A slim bar above the header on every page." />
          <Check name="showPopup" on={o?.showPopup ?? false} label="Pop-up" hint="Opens once after a few seconds, then stays quiet for a week." />
        </div>
      </section>

      <button className="btn">Save offer</button>
    </form>
  );
}
