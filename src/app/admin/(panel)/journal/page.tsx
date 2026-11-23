import Link from "next/link";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { POST_CATEGORIES } from "@/lib/journal";
import { togglePost } from "../../actions";

export const metadata = { title: "Journal" };

export default async function Journal() {
  const posts = await db.post.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Journal</h1>
          <p className="mt-1 max-w-2xl text-ink-soft">Articles about the area: things to do, seasons, food, tips for families. They appear on the Journal page and the home page, in English and French. Write about places you know and in your own words.</p>
        </div>
        <Link href="/admin/journal/new" className="btn"><Icon name="plus" size={18} weight="bold" /> New article</Link>
      </div>
      {posts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">No articles yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {posts.map((p) => {
            const future = p.published && p.publishedAt > new Date();
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper p-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${future ? "bg-[#fdf1d6] text-[#7a5200]" : p.published ? "bg-[#dff3e8] text-leaf" : "bg-line text-ink-soft"}`}>
                  {future ? "Scheduled" : p.published ? "Published" : "Draft"}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/journal/${p.id}`} className="font-semibold hover:underline">{p.titleEn}</Link>
                  <p className="text-sm text-ink-soft">
                    {POST_CATEGORIES.find((c) => c.key === p.category)?.label.en} · {p.publishedAt.toISOString().slice(0, 10)} · {p.bodyFr ? "EN + FR" : "EN only"}
                  </p>
                </div>
                {p.published && !future && <Link href={`/en/journal/${p.slug}`} target="_blank" className="btn-ghost !min-h-10">View</Link>}
                <form action={togglePost.bind(null, p.id)}><button className="btn-ghost !min-h-10">{p.published ? "Unpublish" : "Publish"}</button></form>
                <Link href={`/admin/journal/${p.id}`} className="btn-ghost !min-h-10">Edit</Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
