import Link from "next/link";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { decideReview, toggleReview } from "../../actions";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  const all = await db.review.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  const pending = all.filter((r) => r.status === "pending");
  const rows = all.filter((r) => r.status !== "pending");
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Reviews</h1>
          <p className="mt-1 max-w-2xl text-ink-soft">Guests who stayed can write a review from their account; it appears here and only goes public when you approve it. You can also add reviews by hand (copy from Airbnb with the guest’s OK). The three highest-priority published reviews show on the home page; all of them show on the Reviews page.</p>
        </div>
        <Link href="/admin/reviews/new" className="btn"><Icon name="plus" size={18} weight="bold" /> Add review</Link>
      </div>
      {pending.length > 0 && (
        <section className="mt-6 rounded-2xl border-2 border-sun bg-[#fdf6e6] p-4 sm:p-5" aria-labelledby="pending-h">
          <h2 id="pending-h" className="text-xl">Waiting for your approval ({pending.length})</h2>
          <ul className="mt-3 space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-xl bg-paper p-4">
                <p className="font-semibold">{r.name} <span className="font-normal text-ink-soft">· {"★".repeat(r.rating)} · {r.stayLabel}</span></p>
                <p className="mt-2 whitespace-pre-line text-[15px]">{r.textEn}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={decideReview.bind(null, r.id, true)}><button className="btn !min-h-10">Approve and publish</button></form>
                  <form action={decideReview.bind(null, r.id, false)}><button className="btn-ghost !min-h-10">Reject</button></form>
                  <Link href={`/admin/reviews/${r.id}`} className="btn-ghost !min-h-10">Edit first</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">No reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper p-4">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.sample ? "bg-[#fdf1d6] text-[#7a5200]" : r.published ? "bg-[#dff3e8] text-leaf" : "bg-line text-ink-soft"}`}>
                {r.sample ? "Placeholder" : r.status === "rejected" ? "Rejected" : r.published ? "Shown" : "Hidden"}
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
