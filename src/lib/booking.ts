import "server-only";
import { db } from "./db";
import { isAvailable } from "./availability";
import { refundPct } from "./pricing";
import { priceStay } from "./offers";
import { view } from "./property";
import { diffDays, today, eur, fmtDate } from "./dates";
import { notify, ownerEmail } from "./notify";
import { refundPayment } from "./payments";
import { channel } from "./channel";

const HOLD_MINUTES = 30;
const ref = () => "LB" + Math.random().toString(36).slice(2, 8).toUpperCase();

export type HoldInput = {
  propertyId: string;
  from: string;
  to: string;
  adults: number;
  children: number;
  pets: number;
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  locale: string;
  notes?: string;
  code?: string;
};

export class BookingError extends Error {}

export async function createHold(i: HoldInput) {
  const prop = await db.property.findUnique({ where: { id: i.propertyId } });
  if (!prop || prop.status !== "published") throw new BookingError("Property not found");
  const v = view(prop);
  const nights = diffDays(i.from, i.to);
  const guests = i.adults + i.children;
  if (nights < 1) throw new BookingError("Invalid dates");
  if (i.from < today()) throw new BookingError("Arrival date is in the past");
  if (nights < v.minNights) throw new BookingError(`Minimum stay is ${v.minNights} nights`);
  if (guests < 1 || guests > v.maxGuests) throw new BookingError(`Up to ${v.maxGuests} guests`);
  const q = (await priceStay(v, i.from, i.to, i.adults, i.locale === "fr" ? "fr" : "en", i.code)).quote;

  // SQLite serialises writes; on Postgres wrap in a serializable tx / use an exclusion constraint.
  return db.$transaction(async (tx) => {
    // Postgres runs transactions in parallel: take a per-property lock so the overlap check below cannot race.
    if (!process.env.DATABASE_URL?.startsWith("file:")) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prop.id}))`;
    const clash = await tx.booking.findFirst({
      where: {
        propertyId: prop.id,
        checkIn: { lt: i.to },
        checkOut: { gt: i.from },
        OR: [{ status: "confirmed" }, { status: "hold", holdExpiresAt: { gt: new Date() } }],
      },
    });
    if (clash) throw new BookingError("Those dates are no longer available");
    return tx.booking.create({
      data: {
        ref: ref(),
        propertyId: prop.id,
        userId: i.userId,
        guestName: i.name,
        guestEmail: i.email,
        guestPhone: i.phone,
        adults: i.adults,
        children: i.children,
        pets: i.pets,
        checkIn: i.from,
        checkOut: i.to,
        nights,
        accommodation: q.accommodation,
        cleaning: q.cleaning,
        tax: q.tax,
        discount: q.discount,
        offerTitle: q.offerTitle,
        total: q.total,
        status: "hold",
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
        locale: i.locale,
        notes: i.notes,
      },
    });
  });
}

export async function confirmBooking(bookingRef: string, paymentIntentId?: string) {
  const b = await db.booking.findUnique({ where: { ref: bookingRef }, include: { property: true } });
  if (!b) return null;
  if (b.status === "confirmed") return b;
  // Paid after the hold lapsed: confirm only if the dates are still free, otherwise the owner must refund.
  const free = await isAvailable(b.propertyId, b.checkIn, b.checkOut, b.id);
  await db.payment.updateMany({
    where: { bookingId: b.id, status: "pending" },
    data: { status: "paid", paymentIntentId },
  });
  if (!free) {
    await notify(
      "owner",
      ownerEmail(),
      `ACTION NEEDED: paid booking ${b.ref} clashes with another stay`,
      `Booking ${b.ref} (${b.guestName}, ${b.checkIn} to ${b.checkOut}) was paid after its hold expired and the dates were taken. Please cancel and refund it in the admin.`,
    );
    return b;
  }
  const done = await db.booking.update({
    where: { id: b.id },
    data: { status: "confirmed", holdExpiresAt: null },
    include: { property: true },
  });
  await channel().pushBooking(done);
  const l = done.locale;
  await notify(
    "guest",
    done.guestEmail,
    l === "fr" ? `Réservation confirmée ${done.ref}` : `Booking confirmed ${done.ref}`,
    l === "fr"
      ? `Bonjour ${done.guestName},\n\nVotre séjour à ${done.property.name} est confirmé : ${fmtDate(done.checkIn, l)} → ${fmtDate(done.checkOut, l)} (${done.nights} nuits).\nTotal payé : ${eur(done.total, l)}.\nArrivée à partir de ${done.property.checkInTime}, départ avant ${done.property.checkOutTime}.\n\nNous avons hâte de vous accueillir.`
      : `Hello ${done.guestName},\n\nYour stay at ${done.property.name} is confirmed: ${fmtDate(done.checkIn, l)} → ${fmtDate(done.checkOut, l)} (${done.nights} nights).\nTotal paid: ${eur(done.total, l)}.\nCheck-in from ${done.property.checkInTime}, check-out by ${done.property.checkOutTime}.\n\nWe look forward to hosting you.`,
  );
  await notify(
    "owner",
    ownerEmail(),
    `New booking ${done.ref}: ${done.guestName}, ${done.checkIn} → ${done.checkOut}`,
    `${done.guestName} (${done.guestEmail}) booked ${done.property.name} for ${done.nights} nights, ${done.adults + done.children} guests. Total ${eur(done.total)}.`,
  );
  return done;
}

export type CancelOpts = { by: "guest" | "admin"; refundCents?: number; reason?: string };

/** Cancels a booking. Guests get the policy refund; admins can choose any amount up to what was paid. */
export async function cancelBooking(bookingRef: string, o: CancelOpts) {
  const b = await db.booking.findUnique({
    where: { ref: bookingRef },
    include: { property: true, payments: true, refunds: true },
  });
  if (!b || b.status === "cancelled") return null;
  const paid = b.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const already = b.refunds.reduce((a, r) => a + r.amount, 0);
  const policy = view(b.property).policy;
  const pct = refundPct(policy, b.checkIn, today());
  const policyRefund = Math.round(((b.accommodation - b.discount) * pct) / 100) + Math.round(((b.cleaning + b.tax) * pct) / 100);
  const wanted = o.by === "admin" ? (o.refundCents ?? policyRefund) : policyRefund;
  const amount = Math.max(0, Math.min(wanted, paid - already));

  let refundId: string | null = null;
  let provider = "none";
  if (amount > 0) {
    const r = await refundPayment(b, amount);
    refundId = r.id;
    provider = r.provider;
    await db.refund.create({
      data: { bookingId: b.id, amount, reason: o.reason, provider, stripeRefundId: refundId },
    });
  }
  const done = await db.booking.update({
    where: { id: b.id },
    data: { status: "cancelled", cancelledAt: new Date(), cancelReason: o.reason ?? `Cancelled by ${o.by}`, holdExpiresAt: null },
    include: { property: true },
  });
  await channel().cancelBooking(done);
  const l = done.locale;
  await notify(
    "guest",
    done.guestEmail,
    l === "fr" ? `Réservation annulée ${done.ref}` : `Booking cancelled ${done.ref}`,
    l === "fr"
      ? `Votre réservation ${done.ref} a été annulée. Remboursement : ${eur(amount, l)}${amount ? " (sous 5 à 10 jours)." : "."}`
      : `Your booking ${done.ref} was cancelled. Refund: ${eur(amount, l)}${amount ? " (allow 5-10 days)." : "."}`,
  );
  await notify(
    "owner",
    ownerEmail(),
    `Booking ${done.ref} cancelled by ${o.by}`,
    `${done.guestName}, ${done.checkIn} → ${done.checkOut}. Refunded ${eur(amount)} of ${eur(paid)} paid.${o.reason ? ` Reason: ${o.reason}` : ""}`,
  );
  return { booking: done, refunded: amount, pct };
}

/** Partial / extra refund on a booking without cancelling it (admin). */
export async function refundOnly(bookingRef: string, cents: number, reason?: string) {
  const b = await db.booking.findUnique({ where: { ref: bookingRef }, include: { payments: true, refunds: true } });
  if (!b) return null;
  const paid = b.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const already = b.refunds.reduce((a, r) => a + r.amount, 0);
  const amount = Math.max(0, Math.min(cents, paid - already));
  if (!amount) return 0;
  const r = await refundPayment(b, amount);
  await db.refund.create({ data: { bookingId: b.id, amount, reason, provider: r.provider, stripeRefundId: r.id } });
  return amount;
}
