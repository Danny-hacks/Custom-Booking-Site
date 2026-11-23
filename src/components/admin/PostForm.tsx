import { savePost } from "@/app/admin/actions";
import { POST_CATEGORIES } from "@/lib/journal";
import { PLACES } from "@/lib/area";

type Post = {
  id: string; slug: string; published: boolean; publishedAt: Date; category: string; cover: string; coverCredit: string; places: string;
  titleEn: string; titleFr: string; excerptEn: string; excerptFr: string; bodyEn: string; bodyFr: string;
};

const SITE_PHOTOS = [
  ["/img/area/landscape.jpg", "Ségala landscape"], ["/img/area/bosc.jpg", "Château du Bosc"], ["/img/area/viaduc.jpg", "Viaur viaduct"],
  ["/img/area/sauveterre.jpg", "Sauveterre-de-Rouergue"], ["/img/area/naucelle.jpg", "Naucelle"], ["/img/area/rieupeyroux.jpg", "Rieupeyroux"],
  ["/img/area/conques.jpg", "Conques"], ["/img/area/belcastel.jpg", "Belcastel"], ["/img/area/najac.jpg", "Najac"], ["/img/area/cordes.jpg", "Cordes-sur-Ciel"],
  ["/img/area/albi.jpg", "Albi"], ["/img/area/rodez.jpg", "Rodez"], ["/img/area/gorges.jpg", "Aveyron gorges"], ["/img/area/walking.jpg", "Walking"],
  ["/img/area/food.jpg", "Food"], ["/img/photos/outdoor-102.jpg", "The estate (front)"], ["/img/photos/pool-001.jpg", "The pool"],
] as const;

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}</div>
);

const day = (d: Date) => d.toISOString().slice(0, 10);

export function PostForm({ p, err }: { p: Post | null; err?: string }) {
  const action = savePost.bind(null, p?.id ?? null);
  const picked = new Set((p?.places ?? "").split(",").filter(Boolean));
  return (
    <form action={action} className="max-w-4xl space-y-6">
      {err && <p role="alert" className="rounded-xl bg-[#fde8e6] p-3 text-danger">Please add a title and the article text in English.</p>}

      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title (English)"><input name="titleEn" required defaultValue={p?.titleEn} className="field" /></Field>
          <Field label="Title (French)" hint="Optional. English is used if empty."><input name="titleFr" defaultValue={p?.titleFr} className="field" /></Field>
          <Field label="Short summary (English)" hint="One or two sentences, shown on the cards."><textarea name="excerptEn" defaultValue={p?.excerptEn} className="field" rows={3} /></Field>
          <Field label="Short summary (French)"><textarea name="excerptFr" defaultValue={p?.excerptFr} className="field" rows={3} /></Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <p className="mb-3 rounded-xl bg-tint p-3 text-sm text-ink-soft">
          <strong>Writing tips.</strong> A blank line starts a new paragraph. Start a line with <code>## </code> for a heading. Start lines with <code>- </code> for a bullet list.
          Use <code>**bold**</code> and <code>[link text](https://example.com)</code>. To link to a place guide page, use <code>[Naucelle](/en/area/naucelle)</code> (or <code>/fr/area/…</code> in the French text).
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Article (English)"><textarea name="bodyEn" required defaultValue={p?.bodyEn} className="field font-mono text-[14px]" rows={20} /></Field>
          <Field label="Article (French)" hint="Optional. English is used if empty."><textarea name="bodyFr" defaultValue={p?.bodyFr} className="field font-mono text-[14px]" rows={20} /></Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-lg">Cover photo</h2>
        {p?.cover && <p className="mt-1 text-sm text-ink-soft">Current: <code>{p.cover}</code></p>}
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Choose a photo already on the site">
            <select name="coverChoice" defaultValue="" className="field">
              <option value="">{p?.cover ? "Keep the current cover" : "Choose…"}</option>
              <option value="none">No cover photo</option>
              {SITE_PHOTOS.map(([src, label]) => <option key={src} value={src}>{label}</option>)}
            </select>
          </Field>
          <Field label="…or upload your own" hint="JPG, PNG or WebP. Only upload photos you have the right to use."><input type="file" name="coverFile" accept="image/jpeg,image/png,image/webp,image/avif" className="field !py-2.5" /></Field>
        </div>
        <div className="mt-4"><Field label="Photo credit" hint="Shown under the photo, e.g. “Photo: Marie Dupont”. Required for most free-licence photos."><input name="coverCredit" defaultValue={p?.coverCredit} className="field" /></Field></div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-lg">Places mentioned</h2>
        <p className="mt-1 text-sm text-ink-soft">Tick the places the article talks about. They appear as links at the end of the article.</p>
        <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.map((pl) => (
            <label key={pl.slug} className="flex min-h-9 items-center gap-2 text-sm">
              <input type="checkbox" name="places" value={pl.slug} defaultChecked={picked.has(pl.slug)} className="h-5 w-5 accent-[var(--brand)]" /> {pl.name}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <select name="category" defaultValue={p?.category ?? "guide"} className="field">{POST_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label.en}</option>)}</select>
          </Field>
          <Field label="Publish date" hint="A future date publishes it automatically on that day."><input type="date" name="publishedAt" defaultValue={day(p?.publishedAt ?? new Date())} className="field" /></Field>
          <Field label="Web address ending" hint="Leave empty to build it from the title."><input name="slug" defaultValue={p?.slug} placeholder="my-article" className="field" /></Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? false} className="h-5 w-5 accent-[var(--brand)]" /> Published (visible on the site)</label>
      </section>

      <button className="btn">Save article</button>
    </form>
  );
}
