import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { view } from "@/lib/property";
import { eur } from "@/lib/dates";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Properties" };

export default async function Properties() {
  const rows = (await db.property.findMany({ orderBy: { createdAt: "asc" } })).map(view);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Properties</h1>
        <Link href="/admin/properties/new" className="btn"><Icon name="plus" size={18} weight="bold" /> Add property</Link>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/properties/${p.id}`} className="block rounded-2xl border border-line bg-paper p-3 hover:shadow-md">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">{p.photos[0] && <Image src={p.photos[0].src} alt="" fill sizes="33vw" className="object-cover" />}</div>
              <div className="flex items-start justify-between gap-2 p-2">
                <div><p className="font-semibold">{p.name}</p><p className="text-sm text-ink-soft">{p.maxGuests} guests · from {eur(p.baseNight)}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "published" ? "bg-[#e6ecd9] text-leaf" : "bg-line text-ink-soft"}`}>{p.status}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
