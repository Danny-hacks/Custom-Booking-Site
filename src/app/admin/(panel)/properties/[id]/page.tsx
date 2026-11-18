import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { view } from "@/lib/property";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Edit property" };

export default async function EditProperty({ params, searchParams }: PageProps<"/admin/properties/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await db.property.findUnique({ where: { id } });
  if (!row) notFound();
  const p = view(row);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{p.name}</h1>
        <div className="flex gap-2">
          <Link href={`/en/properties/${p.slug}`} target="_blank" className="btn-ghost"><Icon name="arrow" size={16} /> View page</Link>
          <Link href="/admin/sync" className="btn-ghost"><Icon name="sync" size={16} /> Calendar sync</Link>
        </div>
      </div>
      {sp.saved && <p role="status" className="mb-4 rounded-lg bg-[#e6ecd9] px-4 py-2 text-leaf">Saved.</p>}
      {row.lastSyncNote && <p className="mb-4 text-sm text-ink-soft">Last sync: {row.lastSyncNote}</p>}
      <PropertyForm p={p} />
    </div>
  );
}
