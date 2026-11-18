import { titleMeta } from "@/lib/meta";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { eur, fmtDate } from "@/lib/dates";
import { demoPay } from "@/app/actions";
import { stripeEnabled } from "@/lib/payments";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("payment", true);

export default async function DemoPay({ params }: PageProps<"/[locale]/pay/[ref]">) {
  const { locale: l, ref } = await params;
  const locale = l as Locale;
  if (stripeEnabled()) notFound();
  const b = await db.booking.findUnique({ where: { ref }, include: { property: true } });
  if (!b) notFound();
  if (b.status === "confirmed") redirect(`/${locale}/book/confirmed/${ref}`);
  const d = t(locale);
  const expired = b.status !== "hold" || (b.holdExpiresAt && b.holdExpiresAt < new Date());
  const pay = demoPay.bind(null, ref, locale);

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border border-line bg-paper p-6">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand"><Icon name="card" size={18} /> {d.pay.title}</p>
        <h1 className="mt-3 text-3xl">{eur(b.total, locale)}</h1>
        <p className="mt-1 text-sm text-ink-soft">{b.property.name} · {fmtDate(b.checkIn, locale)} → {fmtDate(b.checkOut, locale)}</p>
        {expired ? (
          <p role="alert" className="mt-6 rounded-lg bg-[#fbe9e7] p-3 text-danger">{d.pay.expired}</p>
        ) : (
          <form action={pay} className="mt-6 space-y-4">
            <p className="text-sm text-ink-soft">{d.pay.lead}</p>
            <div>
              <label className="label" htmlFor="card">{d.pay.card}</label>
              <input id="card" className="field" defaultValue="4242 4242 4242 4242" readOnly />
            </div>
            <button className="btn w-full"><Icon name="lock" size={20} weight="bold" /> {d.pay.payNow} {eur(b.total, locale)}</button>
          </form>
        )}
      </div>
    </main>
  );
}
