import { titleMeta } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { eur, fmtDate } from "@/lib/dates";
import { confirmBooking } from "@/lib/booking";
import { stripe, stripeEnabled } from "@/lib/payments";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("confirmed", true);

export default async function Confirmed({ params, searchParams }: PageProps<"/[locale]/book/confirmed/[ref]">) {
  const { locale: l, ref } = await params;
  const locale = l as Locale;
  const sp = await searchParams;
  let b = await db.booking.findUnique({ where: { ref }, include: { property: true } });
  if (!b) notFound();

  // Stripe redirect: confirm immediately in case the webhook is slower than the browser.
  if (b.status === "hold" && stripeEnabled() && typeof sp.session_id === "string") {
    try {
      const s = await stripe().checkout.sessions.retrieve(sp.session_id);
      if (s.payment_status === "paid" && s.client_reference_id === ref) {
        await confirmBooking(ref, typeof s.payment_intent === "string" ? s.payment_intent : undefined);
        b = await db.booking.findUnique({ where: { ref }, include: { property: true } });
      }
    } catch {}
  }
  if (!b) notFound();
  const d = t(locale);

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <div className="rise rounded-3xl border border-line bg-paper p-8 text-center sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf text-white"><Icon name="check" size={34} weight="bold" /></span>
        <h1 className="mt-6 text-4xl">{b.status === "confirmed" ? d.confirmed.title : d.confirmed.pending}</h1>
        {b.status === "confirmed" && (
          <>
            <p className="mt-3 text-ink-soft">{d.confirmed.lead} <strong className="text-ink">{b.guestEmail}</strong></p>
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-ink-soft/50 p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{d.confirmed.ref}</p>
              <p className="serif text-3xl tracking-widest text-brand">{b.ref}</p>
              <p className="mt-3 font-semibold">{b.property.name}</p>
              <p className="text-ink-soft">{fmtDate(b.checkIn, locale)} → {fmtDate(b.checkOut, locale)}</p>
              <p className="mt-1 text-ink-soft">{eur(b.total, locale)}</p>
            </div>
            <h2 className="mt-10 text-xl">{d.confirmed.next}</h2>
            <ul className="mx-auto mt-4 max-w-md space-y-3 text-left text-ink-soft">
              {d.confirmed.steps.map((s) => <li key={s} className="flex gap-3"><Icon name="calcheck" size={22} className="shrink-0 text-brand" />{s}</li>)}
            </ul>
            <Link href={`/${locale}/account`} className="btn mt-10">{d.confirmed.manage}</Link>
          </>
        )}
      </div>
    </main>
  );
}
