import { titleMeta } from "@/lib/meta";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { view } from "@/lib/property";
import { refundPct } from "@/lib/pricing";
import { eur, fmtDate, today } from "@/lib/dates";
import { AuthForms } from "@/components/AuthForms";
import { cancelMine, logout } from "@/app/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("account", true);

export default async function Account({ params }: PageProps<"/[locale]/account">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const user = await currentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="mb-8 text-center text-4xl">{d.account.title}</h1>
        <div className="rounded-2xl border border-line bg-paper p-6"><AuthForms locale={locale} labels={d.account} /></div>
      </main>
    );
  }

  const bookings = await db.booking.findMany({
    where: { userId: user.id, source: "direct", status: { in: ["confirmed", "cancelled"] } },
    include: { property: true },
    orderBy: { checkIn: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">{user.name}</h1>
          <p className="text-ink-soft">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && <Link href="/admin" className="btn-ghost"><Icon name="dash" size={18} /> Admin</Link>}
          <form action={logout.bind(null, locale)}><button className="btn-ghost"><Icon name="signout" size={18} /> {d.nav.logout}</button></form>
        </div>
      </div>

      <h2 className="mt-12 text-2xl">{d.account.bookings}</h2>
      {bookings.length === 0 && <p className="mt-4 text-ink-soft">{d.account.none}</p>}
      <ul className="mt-5 space-y-4">
        {bookings.map((b) => {
          const pct = b.status === "confirmed" ? refundPct(view(b.property).policy, b.checkIn, today()) : 0;
          const refund = Math.round((b.total * pct) / 100);
          const upcoming = b.checkIn >= today();
          return (
            <li key={b.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="serif text-xl">{b.property.name}</p>
                  <p className="text-ink-soft">{fmtDate(b.checkIn, locale)} → {fmtDate(b.checkOut, locale)} · {b.nights} {d.card.nights}</p>
                  <p className="mt-1 text-sm text-ink-soft">{b.ref} · {d.account.receipt} {eur(b.total, locale)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${b.status === "confirmed" ? "bg-[#e6ecd9] text-leaf" : "bg-[#f3e0dd] text-danger"}`}>
                  {b.status === "confirmed" ? d.account.confirmed : d.account.cancelled}
                </span>
              </div>
              {b.status === "confirmed" && upcoming && (
                <form action={cancelMine.bind(null, b.ref, locale)} className="mt-4 border-t border-line pt-4">
                  <p className="mb-3 text-sm text-ink-soft">{d.account.cancelConfirm} <strong className="text-ink">{eur(refund, locale)}</strong> ({d.account.refundPolicy}).</p>
                  <ConfirmButton className="btn-ghost !border-danger text-danger" message={`${d.account.cancelConfirm} ${eur(refund, locale)}`}>{d.account.cancel}</ConfirmButton>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
