import "server-only";
import Stripe from "stripe";
import type { Booking, Property } from "@prisma/client";
import { db } from "./db";
import { siteBase } from "./site";

let _stripe: Stripe | null = null;
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export function stripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

export const siteUrl = () => siteBase();

/** Returns the URL to send the guest to. Stripe Checkout when configured, otherwise the built-in demo page. */
export async function startPayment(b: Booking, p: Property, locale: string) {
  if (!stripeEnabled()) {
    await db.payment.create({ data: { bookingId: b.id, amount: b.total, provider: "demo" } });
    return `${siteUrl()}/${locale}/pay/${b.ref}`;
  }
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: b.guestEmail,
    locale: locale === "fr" ? "fr" : "en",
    client_reference_id: b.ref,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: p.currency,
          unit_amount: b.total,
          product_data: {
            name: `${p.name} · ${b.checkIn} → ${b.checkOut}`,
            description: `${b.nights} nights, ${b.adults + b.children} guests (incl. cleaning and tourist tax)`,
          },
        },
      },
    ],
    payment_intent_data: { metadata: { ref: b.ref } },
    metadata: { ref: b.ref },
    success_url: `${siteUrl()}/${locale}/book/confirmed/${b.ref}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/${locale}/properties/${p.slug}?cancelled=1`,
  });
  await db.payment.create({
    data: { bookingId: b.id, amount: b.total, provider: "stripe", stripeSessionId: session.id },
  });
  return session.url!;
}

/** Refunds `amount` cents of the booking's paid payment. Returns provider refund id. */
export async function refundPayment(b: Booking, amount: number) {
  const pay = await db.payment.findFirst({
    where: { bookingId: b.id, status: "paid" },
    orderBy: { createdAt: "desc" },
  });
  if (!pay || amount <= 0) return { provider: "none", id: null as string | null };
  if (pay.provider === "stripe" && pay.paymentIntentId && stripeEnabled()) {
    const r = await stripe().refunds.create({ payment_intent: pay.paymentIntentId, amount });
    return { provider: "stripe", id: r.id as string | null };
  }
  return { provider: "demo", id: null as string | null };
}
