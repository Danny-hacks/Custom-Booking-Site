import { stripe, stripeEnabled } from "@/lib/payments";
import { confirmBooking } from "@/lib/booking";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  if (!stripeEnabled()) return new Response("Stripe not configured", { status: 503 });
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    if (s.payment_status === "paid" && s.client_reference_id) {
      await confirmBooking(s.client_reference_id, typeof s.payment_intent === "string" ? s.payment_intent : undefined);
    }
  } else if (event.type === "checkout.session.expired") {
    const ref = event.data.object.client_reference_id;
    if (ref) await db.booking.updateMany({ where: { ref, status: "hold" }, data: { holdExpiresAt: new Date() } });
  }
  return Response.json({ received: true }); // idempotent: confirmBooking ignores already-confirmed bookings
}
