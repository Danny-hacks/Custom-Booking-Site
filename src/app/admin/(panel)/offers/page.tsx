import Link from "next/link";
import { db } from "@/lib/db";
import { today, eur } from "@/lib/dates";
import { Icon } from "@/components/Icon";
import { toggleOffer } from "../../actions";

export const metadata = { title: "Offers" };

function status(o: { active: boolean; bookFrom: string | null; bookTo: string | null }) {
  const d = today();
  if (!o.active) return ["Off", "bg-line text-ink-soft"] as const;
  if (o.bookFrom && o.bookFrom > d) return ["Scheduled", "bg-[#fdf1d6] text-[#7a5200]"] as const;
  if (o.bookTo && o.bookTo < d) return ["Expired", "bg-line text-ink-soft"] as const;
  return ["Live", "bg-[#dff3e8] text-leaf"] as const;
}

export default async function Offers() {
  const rows = await db.offer.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Offers</h1>
          <p className="mt-1 text-ink-soft">Discounts and announcements. They show on the site and the discount is applied at checkout.</p>
        </div>
        <Link href="/admin/offers/new" className="btn"><Icon name="plus" size={18} weight="bold" /> New offer</Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">No offers yet. Create one and choose where it appears.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((o) => {
            const [label, cls] = status(o);
            const disc = o.kind === "percent" ? `${o.value}% off` : o.kind === "fixed" ? `${eur(o.value)} off` : "Announcement";
            const where = [o.showBanner && "banner", o.showPopup && "pop-up", o.showCard && "cards"].filter(Boolean).join(" · ") || "hidden";
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper p-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/offers/${o.id}`} className="font-semibold hover:underline">{o.titleEn}</Link>
                  <p className="text-sm text-ink-soft">
                    {disc}{o.minNights > 1 ? ` · ${o.minNights}+ nights` : ""}{o.code ? ` · code ${o.code}` : " · automatic"} · shows as {where}
                    {o.bookTo ? ` · until ${o.bookTo}` : ""}
                  </p>
                </div>
                <form action={toggleOffer.bind(null, o.id)}><button className="btn-ghost !min-h-10">{o.active ? "Turn off" : "Turn on"}</button></form>
                <Link href={`/admin/offers/${o.id}`} className="btn-ghost !min-h-10">Edit</Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
