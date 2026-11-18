import Link from "next/link";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { toggleReview } from "../../actions";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  const rows = await db.review.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Reviews</h1>
          <p className="mt-1 max-w-2xl text-ink-soft">Copy real reviews from Airbnb (ask the guest first) or add direct guests. The three highest-priority published reviews show on the home and property pages.</p>
        </div>
        <Link href="/admin/reviews/new" className="btn"><Icon name="plus" size={18} weight="bold" /> Add review</Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">No reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper p-4">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.sample ? "bg-[#fdf1d6] text-[#7a5200]" : r.published ? "bg-[#dff3e8] text-leaf" : "bg-line text-ink-soft"}`}>
                {r.sample ? "Placeholder" : r.published ? "Shown" : "Hidden"}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/reviews/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>
                <span className="ml-2 text-sm text-ink-soft">{"★".repeat(r.rating)} · {r.source}{r.origin ? ` · ${r.origin}` : ""}</span>
                <p className="line-clamp-1 text-sm text-ink-soft">{r.textEn}</p>
              </div>
              <form action={toggleReview.bind(null, r.id)}><button className="btn-ghost !min-h-10">{r.published ? "Hide" : "Show"}</button></form>
              <Link href={`/admin/reviews/${r.id}`} className="btn-ghost !min-h-10">Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
