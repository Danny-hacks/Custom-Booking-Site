import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eur, fmtDate, today } from "@/lib/dates";
import { view } from "@/lib/property";
import { refundPct } from "@/lib/pricing";
import { SourceBadge } from "@/components/admin/Badges";
import { Icon } from "@/components/Icon";
import { ConfirmButton } from "@/components/ConfirmButton";
import { adminCancel, adminRefund } from "../../../actions";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params }: PageProps<"/admin/bookings/[ref]">) {
  const { ref } = await params;
  const b = await db.booking.findUnique({ where: { ref }, include: { property: true, payments: true, refunds: true } });
  if (!b) notFound();
  const paid = b.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const refunded = b.refunds.reduce((a, r) => a + r.amount, 0);
  const pct = refundPct(view(b.property).policy, b.checkIn, today());
  const policyRefund = Math.min(paid - refunded, Math.round((b.total * pct) / 100));
  const external = b.source === "airbnb";

  return (
    <div className="max-w-4xl">
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline"><Icon name="back" size={16} /> Bookings</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{b.guestName}</h1><SourceBadge status={b.status} /><SourceBadge source={b.source} />
      </div>
      <p className="mt-1 font-mono text-sm text-ink-soft">{b.ref}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-lg">Stay</h2>
          <dl className="mt-3 space-y-1.5 text-[15px]">
            <div className="flex justify-between"><dt className="text-ink-soft">Property</dt><dd>{b.property.name}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Dates</dt><dd>{fmtDate(b.checkIn, "en")} → {fmtDate(b.checkOut, "en")}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Nights</dt><dd>{b.nights}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Guests</dt><dd>{b.adults} adults, {b.children} children, {b.pets} pets</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Email</dt><dd>{b.guestEmail}</dd></div>
            {b.guestPhone && <div className="flex justify-between"><dt className="text-ink-soft">Phone</dt><dd>{b.guestPhone}</dd></div>}
            {b.notes && <div><dt className="text-ink-soft">Notes</dt><dd>{b.notes}</dd></div>}
            {b.cancelReason && <div><dt className="text-ink-soft">Cancellation</dt><dd>{b.cancelReason}</dd></div>}
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-lg">Money</h2>
          <dl className="mt-3 space-y-1.5 text-[15px]">
            <div className="flex justify-between"><dt className="text-ink-soft">Accommodation</dt><dd>{eur(b.accommodation)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Cleaning</dt><dd>{eur(b.cleaning)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Tourist tax</dt><dd>{eur(b.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd>{eur(b.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Paid</dt><dd>{eur(paid)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Refunded</dt><dd>{eur(refunded)}</dd></div>
          </dl>
          {b.refunds.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-ink-soft">
              {b.refunds.map((r) => <li key={r.id}>{fmtDate(r.createdAt.toISOString().slice(0, 10), "en")}: {eur(r.amount)} via {r.provider}{r.reason ? ` · ${r.reason}` : ""}</li>)}
            </ul>
          )}
        </section>
      </div>

      {external && <p className="mt-6 flex gap-3 rounded-xl bg-canvas p-4 text-sm"><Icon name="info" size={22} className="shrink-0" /> This booking comes from Airbnb. Cancel and refund it in Airbnb; it will disappear here on the next sync.</p>}

      {!external && b.status !== "cancelled" && (
        <section className="mt-6 rounded-2xl border border-danger/40 bg-paper p-5">
          <h2 className="flex items-center gap-2 text-lg"><Icon name="warn" size={22} className="text-danger" /> Cancel booking</h2>
          <p className="mt-1 text-sm text-ink-soft">Frees the dates, notifies the guest and refunds through Stripe. Policy at today&apos;s date: {pct}% ({eur(policyRefund)}).</p>
          <form action={adminCancel.bind(null, b.ref)} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="mode">Refund</label>
              <select id="mode" name="mode" className="field" defaultValue="policy">
                <option value="policy">Per policy ({eur(policyRefund)})</option>
                <option value="custom">Custom amount</option>
                <option value="none">No refund</option>
              </select>
            </div>
            <div><label className="label" htmlFor="amount">Custom amount (€)</label><input id="amount" name="amount" inputMode="decimal" max={(paid - refunded) / 100} className="field" placeholder={String((paid - refunded) / 100)} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="reason">Reason (kept in audit trail)</label><input id="reason" name="reason" className="field" /></div>
            <ConfirmButton className="btn !bg-danger sm:w-fit" message="Cancel this booking? The dates are released, the guest is notified and the refund above is issued.">Cancel booking</ConfirmButton>
          </form>
        </section>
      )}

      {!external && paid - refunded > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-lg">Issue a partial refund</h2>
          <p className="mt-1 text-sm text-ink-soft">For goodwill or damage-free early departures, without cancelling. Up to {eur(paid - refunded)}.</p>
          <form action={adminRefund.bind(null, b.ref)} className="mt-4 flex flex-wrap items-end gap-3">
            <div><label className="label" htmlFor="ramount">Amount (€)</label><input id="ramount" name="amount" inputMode="decimal" required className="field w-36" /></div>
            <div className="min-w-48 flex-1"><label className="label" htmlFor="rreason">Reason</label><input id="rreason" name="reason" className="field" /></div>
            <ConfirmButton className="btn-ghost" message="Issue this refund to the guest’s card? This cannot be undone.">Refund</ConfirmButton>
          </form>
        </section>
      )}
    </div>
  );
}
