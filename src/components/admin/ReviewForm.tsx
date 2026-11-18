import { saveReview } from "@/app/admin/actions";

type Review = {
  id: string; published: boolean; sample: boolean; priority: number; name: string; origin: string; stayLabel: string;
  rating: number; textEn: string; textFr: string; source: string;
};

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}</div>
);

export function ReviewForm({ r, err }: { r: Review | null; err?: string }) {
  const action = saveReview.bind(null, r?.id ?? null);
  return (
    <form action={action} className="max-w-3xl space-y-6">
      {err && <p role="alert" className="rounded-xl bg-[#fde8e6] p-3 text-danger">Please add the guest&apos;s name and the review text.</p>}
      {r?.sample && <p className="rounded-xl bg-[#fdf1d6] p-3 text-sm text-[#7a5200]">This is placeholder text. It never shows on the live site. Replace it with a real review, then untick “Placeholder”.</p>}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guest name" hint="First name and initial is fine, e.g. Marie L."><input name="name" required defaultValue={r?.name} className="field" /></Field>
          <Field label="From"><input name="origin" defaultValue={r?.origin} placeholder="Lyon, France" className="field" /></Field>
          <Field label="Stay"><input name="stayLabel" defaultValue={r?.stayLabel} placeholder="August 2025" className="field" /></Field>
          <Field label="Rating">
            <select name="rating" defaultValue={r?.rating ?? 5} className="field">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select>
          </Field>
          <Field label="Source">
            <select name="source" defaultValue={r?.source ?? "airbnb"} className="field">
              <option value="airbnb">Airbnb</option><option value="direct">Direct guest</option><option value="google">Google</option>
            </select>
          </Field>
          <Field label="Priority" hint="Higher shows first."><input name="priority" type="number" defaultValue={r?.priority ?? 0} className="field" /></Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Review (English)"><textarea name="textEn" required defaultValue={r?.textEn} className="field" /></Field>
          <Field label="Review (French)" hint="Optional. English is used if empty."><textarea name="textFr" defaultValue={r?.textFr} className="field" /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={r?.published ?? true} className="h-5 w-5 accent-[var(--brand)]" /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="sample" defaultChecked={r?.sample ?? false} className="h-5 w-5 accent-[var(--brand)]" /> Placeholder (hide in production)</label>
        </div>
      </section>
      <button className="btn">Save review</button>
    </form>
  );
}
