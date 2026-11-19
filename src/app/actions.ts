"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, currentUser, destroySession } from "@/lib/session";
import { BookingError, cancelBooking, confirmBooking, createHold } from "@/lib/booking";
import { startPayment, stripeEnabled } from "@/lib/payments";
import { isValidISO, today } from "@/lib/dates";
import { notify, ownerEmail } from "@/lib/notify";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";

export type FormState = { error?: string };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string, d = 0) => Math.max(0, Number(f.get(k) ?? d) || d);
const lc = (f: FormData): Locale => (str(f, "locale") === "fr" ? "fr" : "en");

export async function startCheckout(_: FormState, f: FormData): Promise<FormState> {
  const locale = lc(f);
  const d = t(locale);
  const from = str(f, "from"), to = str(f, "to");
  const name = str(f, "name"), email = str(f, "email").toLowerCase();
  if (!isValidISO(from) || !isValidISO(to)) return { error: d.checkout.error };
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return { error: d.checkout.error };

  const prop = await db.property.findUnique({ where: { slug: str(f, "slug") } });
  if (!prop) return { error: d.checkout.error };

  let user = await currentUser();
  if (!user && f.get("createAccount")) {
    const pw = str(f, "password");
    if (pw.length < 8) return { error: d.account.short };
    if (await db.user.findUnique({ where: { email } })) return { error: d.account.exists };
    user = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(pw, 10) } });
    await createSession(user.id);
  }

  let url: string;
  try {
    const hold = await createHold({
      propertyId: prop.id, from, to,
      adults: Math.max(1, num(f, "adults", 1)), children: num(f, "children"), pets: num(f, "pets"),
      name, email, phone: str(f, "phone") || undefined, notes: str(f, "notes") || undefined,
      userId: user?.id, locale, code: str(f, "code") || undefined,
    });
    url = await startPayment(hold, prop, locale);
  } catch (e) {
    return { error: e instanceof BookingError ? e.message : d.checkout.error };
  }
  redirect(url);
}

/** Demo-mode payment (used only while Stripe is not configured). */
export async function demoPay(ref: string, locale: string) {
  if (stripeEnabled()) return;
  const b = await db.booking.findUnique({ where: { ref } });
  if (!b || b.status !== "hold" || (b.holdExpiresAt && b.holdExpiresAt < new Date())) redirect(`/${locale}/pay/${ref}`);
  await confirmBooking(ref, "demo");
  redirect(`/${locale}/book/confirmed/${ref}`);
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const locale = lc(f);
  const u = await db.user.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  if (!u || !(await bcrypt.compare(str(f, "password"), u.passwordHash))) return { error: t(locale).account.badLogin };
  await createSession(u.id);
  redirect(u.role === "admin" && str(f, "admin") ? "/admin" : `/${locale}/account`);
}

export async function register(_: FormState, f: FormData): Promise<FormState> {
  const locale = lc(f);
  const d = t(locale);
  const email = str(f, "email").toLowerCase(), pw = str(f, "password"), name = str(f, "name");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return { error: d.checkout.error };
  if (pw.length < 8) return { error: d.account.short };
  if (await db.user.findUnique({ where: { email } })) return { error: d.account.exists };
  const u = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(pw, 10) } });
  // attach earlier guest bookings made with the same email
  await db.booking.updateMany({ where: { guestEmail: email, userId: null }, data: { userId: u.id } });
  await createSession(u.id);
  redirect(`/${locale}/account`);
}

export async function logout(locale: string) {
  await destroySession();
  redirect(`/${locale}`);
}

export async function cancelMine(ref: string, locale: string) {
  const u = await currentUser();
  const b = await db.booking.findUnique({ where: { ref } });
  if (!u || !b || b.userId !== u.id) return;
  await cancelBooking(ref, { by: "guest", reason: "Cancelled by guest" });
  redirect(`/${locale}/account`);
}

/** A guest writes a review for a finished stay. It stays hidden ("pending") until the owner approves it in the admin. */
export async function submitReview(ref: string, locale: string, f: FormData) {
  const u = await currentUser();
  const b = await db.booking.findUnique({ where: { ref }, include: { property: true } });
  const back = `/${locale}/account`;
  if (!u || !b || b.userId !== u.id || b.status !== "confirmed" || b.checkOut > today()) redirect(back);
  const rating = Math.round(Number(f.get("rating")));
  const text = str(f, "text");
  if (!(rating >= 1 && rating <= 5) || text.length < 20 || text.length > 1500) redirect(`${back}?review=invalid#stay-${ref}`);
  if (await db.review.findUnique({ where: { bookingId: b.id } })) redirect(back);
  const [first, ...rest] = u.name.trim().split(/\s+/);
  const name = rest.length ? `${first} ${rest[rest.length - 1].charAt(0).toUpperCase()}.` : first;
  const stayLabel = new Date(`${b.checkOut}T00:00:00Z`).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  await db.review.create({
    data: { name, stayLabel, rating, textEn: text, textFr: "", source: "direct", status: "pending", published: false, userId: u.id, bookingId: b.id },
  });
  await notify("owner", ownerEmail(), `New review to approve from ${name}`, `${name} left a ${rating}/5 review for ${b.property.name} (${stayLabel}):\n\n"${text}"\n\nApprove or reject it in Admin → Reviews. It is not shown on the site until you approve it.`);
  redirect(`${back}?review=sent#stay-${ref}`);
}
