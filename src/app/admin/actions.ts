"use server";
import { siteBase } from "@/lib/site";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, destroySession } from "@/lib/session";
import { cancelBooking, refundOnly } from "@/lib/booking";
import { channel, isBeds24, pushRatesSafely, pushSafely } from "@/lib/channel";
import { saveImage } from "@/lib/storage";
import { sendMail } from "@/lib/mail";
import { ownerEmail } from "@/lib/notify";
import { inspectFeed, type FeedReport } from "@/lib/channel/ical";
import { diffDays, isValidISO } from "@/lib/dates";
import { AMENITY_CATALOG } from "@/lib/amenities";
import { view, type Photo } from "@/lib/property";
import { POST_CATEGORIES, slugify } from "@/lib/journal";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const cents = (f: FormData, k: string) => Math.round((Number(String(f.get(k) ?? "0").replace(",", ".")) || 0) * 100);
const int = (f: FormData, k: string, d = 0) => Math.round(Number(f.get(k) ?? d)) || d;
const lines = (x: string) => x.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export async function adminLogout() {
  await destroySession();
  redirect("/admin/login");
}

export async function adminCancel(ref: string, f: FormData) {
  await requireAdmin();
  const mode = s(f, "mode");
  const refundCents = mode === "custom" ? cents(f, "amount") : mode === "none" ? 0 : undefined;
  await cancelBooking(ref, { by: "admin", refundCents, reason: s(f, "reason") || undefined });
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${ref}`);
}

export async function adminRefund(ref: string, f: FormData) {
  await requireAdmin();
  await refundOnly(ref, cents(f, "amount"), s(f, "reason") || undefined);
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${ref}`);
}

export async function adminManualBooking(f: FormData) {
  await requireAdmin();
  const from = s(f, "from"), to = s(f, "to");
  const propertyId = s(f, "propertyId");
  if (!isValidISO(from) || !isValidISO(to) || to <= from) redirect("/admin/calendar?err=dates");
  const clash = await db.booking.findFirst({
    where: { propertyId, status: "confirmed", checkIn: { lt: to }, checkOut: { gt: from } },
  });
  if (clash) redirect("/admin/calendar?err=clash");
  const isBlock = s(f, "kind") === "block";
  const created = await db.booking.create({
    include: { property: true },
    data: {
      ref: (isBlock ? "BL" : "MN") + Math.random().toString(36).slice(2, 7).toUpperCase(),
      propertyId,
      guestName: s(f, "name") || (isBlock ? "Owner block" : "Manual booking"),
      guestEmail: s(f, "email") || "owner@manual.local",
      checkIn: from,
      checkOut: to,
      nights: diffDays(from, to),
      adults: int(f, "adults", 1),
      source: isBlock ? "block" : "manual",
      status: "confirmed",
      total: cents(f, "total"),
      notes: s(f, "notes") || null,
    },
  });
  if (isBeds24()) await pushSafely("push", created);
  revalidatePath("/admin", "layout");
  redirect("/admin/calendar");
}

export async function adminDeleteBlock(ref: string) {
  await requireAdmin();
  const b = await db.booking.findFirst({ where: { ref, source: { in: ["block", "manual"] }, status: "confirmed" }, include: { property: true } });
  await db.booking.updateMany({ where: { ref, source: { in: ["block", "manual"] } }, data: { status: "cancelled", cancelledAt: new Date() } });
  if (b && isBeds24()) await pushSafely("cancel", b);
  revalidatePath("/admin", "layout");
  redirect("/admin/calendar");
}

/** Runs the Airbnb calendar sync for one property right now. */
export async function syncNow(propertyId: string) {
  await requireAdmin();
  const p = await db.property.findUnique({ where: { id: propertyId } });
  if (p) await channel().pull(p);
  revalidatePath("/admin", "layout");
  redirect("/admin/sync?synced=1");
}

/** Saves the Airbnb link (and optional Beds24 id), then runs a first sync so the result is visible straight away. */
export async function saveSyncSettings(propertyId: string, f: FormData) {
  await requireAdmin();
  const url = s(f, "icalImportUrl");
  if (url && !/^https?:\/\//i.test(url)) redirect("/admin/sync?err=url");
  const p = await db.property.update({ where: { id: propertyId }, data: { icalImportUrl: url || null, beds24Id: s(f, "beds24Id") || null } });
  if (url) await channel().pull(p);
  revalidatePath("/admin", "layout");
  redirect("/admin/sync?saved=1");
}

/** "Send prices now" on the Calendar sync page. */
export async function pushRatesNow(propertyId: string) {
  await requireAdmin();
  const p = await db.property.findUnique({ where: { id: propertyId } });
  const res = p ? await pushRatesSafely(p) : { ok: false };
  revalidatePath("/admin", "layout");
  redirect(`/admin/sync?rates=${res.ok ? "sent" : "failed"}`);
}

export type TestState = { ran?: boolean; report?: FeedReport };

/** Dry run: downloads the link and reports what a sync would import. Saves nothing. */
export async function testFeed(propertyId: string, _prev: TestState, f: FormData): Promise<TestState> {
  await requireAdmin();
  const url = s(f, "icalImportUrl");
  if (!/^https?:\/\//i.test(url)) return { ran: true, report: { ok: false, error: "Paste the Airbnb link first." } };
  return { ran: true, report: await inspectFeed(url, propertyId) };
}

/** Development only: points the sync at the built-in pretend Airbnb calendar so it can be tried without Airbnb. */
export async function connectDemoFeed(propertyId: string) {
  await requireAdmin();
  if (process.env.NODE_ENV === "production") redirect("/admin/sync");
  const base = siteBase();
  const p = await db.property.update({ where: { id: propertyId }, data: { icalImportUrl: `${base}/api/dev/airbnb-mock` } });
  await channel().pull(p);
  revalidatePath("/admin", "layout");
  redirect("/admin/sync?saved=1");
}

async function saveUploads(slug: string, files: File[]): Promise<Photo[]> {
  const out: Photo[] = [];
  for (const file of files) {
    const src = await saveImage(slug, file);
    if (src) out.push({ src, alt_en: "", alt_fr: "" });
  }
  return out;
}

/** Creates or updates a property from the admin form. This is the whole "add a listing" flow. */
export async function saveProperty(id: string | null, f: FormData) {
  await requireAdmin();
  const name = s(f, "name");
  const slug = (s(f, "slug") || name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!name || !slug) redirect(id ? `/admin/properties/${id}?err=name` : "/admin/properties/new?err=name");

  const existing = id ? await db.property.findUnique({ where: { id } }) : null;
  const ev = existing ? view(existing) : null;

  const removed = new Set(f.getAll("removePhoto").map(String));
  const kept = (ev?.photos ?? []).filter((p) => !removed.has(p.src));
  const uploaded = await saveUploads(slug, f.getAll("photos").filter((x): x is File => x instanceof File));
  const photos = [...kept, ...uploaded].map((p) => ({ ...p, alt_en: p.alt_en || name, alt_fr: p.alt_fr || name }));
  const cover = s(f, "cover");
  if (cover) photos.sort((a, b) => (a.src === cover ? -1 : b.src === cover ? 1 : 0));

  const amenities = f.getAll("amenity").map(String).map((k) => AMENITY_CATALOG[k]).filter(Boolean);
  const mk = (loc: "en" | "fr") => ({
    tagline: s(f, `tagline_${loc}`),
    summary: s(f, `summary_${loc}`),
    story: lines(s(f, `story_${loc}`)),
    rules: lines(s(f, `rules_${loc}`)),
    highlights: ev?.content[loc].highlights ?? [],
  });
  const seasons = [] as { name: string; from: string; to: string; night: number }[];
  for (let i = 0; i < 3; i++) {
    const n = s(f, `season_name_${i}`), from = s(f, `season_from_${i}`), to = s(f, `season_to_${i}`), night = cents(f, `season_night_${i}`);
    if (n && /^\d\d-\d\d$/.test(from) && /^\d\d-\d\d$/.test(to) && night > 0) seasons.push({ name: n, from, to, night });
  }
  const policy = [
    { daysBefore: int(f, "p1_days", 30), refundPct: int(f, "p1_pct", 100) },
    { daysBefore: int(f, "p2_days", 14), refundPct: int(f, "p2_pct", 50) },
    { daysBefore: 0, refundPct: 0 },
  ];

  const data = {
    slug, name,
    status: s(f, "status") === "published" ? "published" : "draft",
    location: s(f, "location"),
    maxGuests: int(f, "maxGuests", 2), bedrooms: int(f, "bedrooms", 1), beds: int(f, "beds", 1), bathrooms: int(f, "bathrooms", 1),
    baseNight: cents(f, "baseNight"), cleaningFee: cents(f, "cleaningFee"), touristTax: cents(f, "touristTax"),
    minNights: int(f, "minNights", 1),
    channelMarkup: Math.min(50, Math.max(0, int(f, "channelMarkup", 0))),
    checkInTime: s(f, "checkInTime") || "16:00", checkOutTime: s(f, "checkOutTime") || "10:00",
    content: JSON.stringify({ en: mk("en"), fr: mk("fr") }),
    photos: JSON.stringify(photos),
    amenities: JSON.stringify(amenities.length ? amenities : ev?.amenities ?? []),
    spaces: JSON.stringify(ev?.spaces ?? []),
    seasons: JSON.stringify(seasons),
    policy: JSON.stringify(policy),
  };
  const saved = id
    ? await db.property.update({ where: { id }, data })
    : await db.property.create({ data });
  // Airbnb and Booking.com follow the new prices straight away (Beds24 mode only; does nothing otherwise)
  const sent = isBeds24() && saved.beds24Id ? await pushRatesSafely(saved) : null;
  revalidatePath("/", "layout");
  redirect(`/admin/properties/${saved.id}?saved=1${sent ? (sent.ok ? "&rates=sent" : "&rates=failed") : ""}`);
}


/* ───────── Offers ───────── */
const opt = (f: FormData, k: string) => s(f, k) || null;
const day = (f: FormData, k: string) => { const v = s(f, k); return isValidISO(v) ? v : null; };

export async function saveOffer(id: string | null, f: FormData) {
  await requireAdmin();
  const titleEn = s(f, "titleEn");
  if (!titleEn) redirect(id ? `/admin/offers/${id}?err=title` : "/admin/offers/new?err=title");
  const kind = ["percent", "fixed", "none"].includes(s(f, "kind")) ? s(f, "kind") : "percent";
  const code = s(f, "code").toUpperCase().replace(/\s+/g, "") || null;
  if (code && (await db.offer.findFirst({ where: { code, NOT: id ? { id } : undefined } }))) redirect(id ? `/admin/offers/${id}?err=code` : "/admin/offers/new?err=code");

  const up = (await saveUploads("offers", f.getAll("image").filter((x): x is File => x instanceof File)))[0];
  const existing = id ? await db.offer.findUnique({ where: { id } }) : null;
  const data = {
    active: f.get("active") === "on",
    priority: int(f, "priority"),
    titleEn,
    titleFr: s(f, "titleFr") || titleEn,
    bodyEn: s(f, "bodyEn"),
    bodyFr: s(f, "bodyFr") || s(f, "bodyEn"),
    badgeEn: s(f, "badgeEn"),
    badgeFr: s(f, "badgeFr") || s(f, "badgeEn"),
    kind,
    value: kind === "percent" ? Math.max(0, Math.min(100, int(f, "value"))) : kind === "fixed" ? cents(f, "value") : 0,
    code,
    minNights: Math.max(1, int(f, "minNights", 1)),
    bookFrom: day(f, "bookFrom"),
    bookTo: day(f, "bookTo"),
    stayFrom: day(f, "stayFrom"),
    stayTo: day(f, "stayTo"),
    propertyId: opt(f, "propertyId"),
    imageUrl: up ? up.src : f.get("removeImage") === "on" ? null : (existing?.imageUrl ?? null),
    showBanner: f.get("showBanner") === "on",
    showPopup: f.get("showPopup") === "on",
    showCard: f.get("showCard") === "on",
  };
  if (id) await db.offer.update({ where: { id }, data });
  else await db.offer.create({ data });
  revalidatePath("/", "layout");
  redirect("/admin/offers");
}

export async function toggleOffer(id: string) {
  await requireAdmin();
  const o = await db.offer.findUnique({ where: { id } });
  if (o) await db.offer.update({ where: { id }, data: { active: !o.active } });
  revalidatePath("/", "layout");
}

export async function deleteOffer(id: string) {
  await requireAdmin();
  await db.offer.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
  redirect("/admin/offers");
}

/* ───────── Reviews ───────── */
export async function saveReview(id: string | null, f: FormData) {
  await requireAdmin();
  const name = s(f, "name"), textEn = s(f, "textEn");
  if (!name || !textEn) redirect(id ? `/admin/reviews/${id}?err=1` : "/admin/reviews/new?err=1");
  const data = {
    published: f.get("published") === "on",
    sample: f.get("sample") === "on",
    priority: int(f, "priority"),
    name,
    origin: s(f, "origin"),
    stayLabel: s(f, "stayLabel"),
    rating: Math.max(1, Math.min(5, int(f, "rating", 5))),
    textEn,
    textFr: s(f, "textFr"),
    source: ["airbnb", "direct", "google"].includes(s(f, "source")) ? s(f, "source") : "airbnb",
  };
  const status = data.published ? "approved" : (id && (await db.review.findUnique({ where: { id } }))?.status === "pending" ? "pending" : "approved");
  if (id) await db.review.update({ where: { id }, data: { ...data, status } });
  else await db.review.create({ data: { ...data, status } });
  revalidatePath("/", "layout");
  redirect("/admin/reviews");
}

export async function toggleReview(id: string) {
  await requireAdmin();
  const r = await db.review.findUnique({ where: { id } });
  if (r) await db.review.update({ where: { id }, data: { published: !r.published, status: !r.published ? "approved" : r.status } });
  revalidatePath("/", "layout");
}

/** Owner decision on a guest-written review: approving makes it public, rejecting keeps it hidden (and visible to the guest as "not published"). */
export async function decideReview(id: string, approve: boolean) {
  await requireAdmin();
  await db.review.update({ where: { id }, data: approve ? { status: "approved", published: true } : { status: "rejected", published: false } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await db.review.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
  redirect("/admin/reviews");
}

/* ───────── Guides ───────── */
/** Creates or updates a guides article. The cover is an uploaded photo, one already on the site, or the one it had before. */
export async function savePost(id: string | null, f: FormData) {
  await requireAdmin();
  const titleEn = s(f, "titleEn"), bodyEn = s(f, "bodyEn");
  const back = id ? `/admin/guides/${id}` : "/admin/guides/new";
  if (!titleEn || !bodyEn) redirect(`${back}?err=1`);

  let slug = slugify(s(f, "slug") || titleEn) || "article";
  const taken = async (x: string) => !!(await db.post.findFirst({ where: { slug: x, ...(id ? { NOT: { id } } : {}) }, select: { id: true } }));
  for (let n = 2; await taken(slug); n++) slug = `${slugify(s(f, "slug") || titleEn).slice(0, 70)}-${n}`;

  const existing = id ? await db.post.findUnique({ where: { id } }) : null;
  let cover = existing?.cover ?? "";
  const file = f.get("coverFile");
  const uploaded = file instanceof File && file.size ? await saveImage("guides", file) : null;
  if (uploaded) cover = uploaded;
  else if (s(f, "coverChoice") === "none") cover = "";
  else if (s(f, "coverChoice")) cover = s(f, "coverChoice");

  const when = new Date(s(f, "publishedAt"));
  const data = {
    slug,
    published: f.get("published") === "on",
    publishedAt: isNaN(when.getTime()) ? new Date() : when,
    category: POST_CATEGORIES.some((c) => c.key === s(f, "category")) ? s(f, "category") : "guide",
    cover,
    coverCredit: s(f, "coverCredit"),
    places: f.getAll("places").map(String).filter((x) => /^[a-z0-9-]+$/.test(x)).join(","),
    titleEn,
    titleFr: s(f, "titleFr"),
    excerptEn: s(f, "excerptEn"),
    excerptFr: s(f, "excerptFr"),
    bodyEn,
    bodyFr: String(f.get("bodyFr") ?? "").trim(),
  };
  if (id) await db.post.update({ where: { id }, data });
  else await db.post.create({ data });
  revalidatePath("/", "layout");
  redirect("/admin/guides");
}

export async function togglePost(id: string) {
  await requireAdmin();
  const p = await db.post.findUnique({ where: { id } });
  if (p) await db.post.update({ where: { id }, data: { published: !p.published } });
  revalidatePath("/", "layout");
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db.post.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
  redirect("/admin/guides");
}

/** Sends a real test message to the owner address so email settings can be checked in one click. */
export async function sendTestEmail() {
  await requireAdmin();
  const r = await sendMail(ownerEmail(), "Test email from your booking site", "If you can read this, the site can send email. New bookings and cancellations will arrive at this address.");
  redirect(`/admin/outbox?test=${r.ok ? "ok" : "fail"}${r.error ? "&msg=" + encodeURIComponent(r.error) : ""}`);
}
