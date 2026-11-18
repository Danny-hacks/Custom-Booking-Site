// Tests OUR side of the Beds24 connection against a pretend Beds24 server that behaves as its public docs describe
// (24h access tokens renewed from a refresh token, paged GET /bookings, POST /bookings needing a price, per-item success).
// It cannot prove how the real Beds24 behaves: that needs a real account (see README "Instant sync with Beds24").
// Run: npx tsx --env-file=.env scripts/beds24-test.mts
import http from "node:http";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { createHold, confirmBooking, cancelBooking } from "../src/lib/booking";
import { isAvailable } from "../src/lib/availability";
import { beds24Channel } from "../src/lib/channel/beds24";
import { syncIfStale } from "../src/lib/channel";
import { addDays, today } from "../src/lib/dates";
import { POST as webhook } from "../src/app/api/webhooks/beds24/route";

const ok = (c: boolean, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };

// ── pretend Beds24 ──────────────────────────────────────────────────────────
type B = { id: number; roomId: number; status: string; arrival: string; departure: string; apiReference?: string; channel?: string; firstName?: string; lastName?: string; price?: number };
let bookings: B[] = [];
let nextId = 1000, tokenSeq = 0, tokenCalls = 0, getCalls = 0;
let validToken = "";
let failPost = false, failGet = false;
const sent: B[] = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url!, "http://x");
  const json = (code: number, body: unknown) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
  if (url.pathname === "/authentication/token") {
    if (req.headers.refreshtoken !== "refresh-abc") return json(401, { error: "bad refresh token" });
    tokenCalls++; validToken = "tok-" + ++tokenSeq;
    return json(200, { token: validToken, expiresIn: 86400 });
  }
  if (req.headers.token !== validToken) return json(401, { error: "bad token" });
  if (url.pathname === "/bookings" && req.method === "GET") {
    getCalls++;
    if (failGet) return json(500, { error: "boom" });
    const rows = bookings.filter((b) => (!url.searchParams.get("roomId") || b.roomId === Number(url.searchParams.get("roomId"))) && (!url.searchParams.get("apiReference") || b.apiReference === url.searchParams.get("apiReference")));
    const size = 2, page = Number(url.searchParams.get("page") ?? 1);
    const slice = rows.slice((page - 1) * size, page * size);
    return json(200, { data: slice, pages: { nextPageExists: page * size < rows.length } });
  }
  if (url.pathname === "/bookings" && req.method === "POST") {
    let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
      if (failPost) return json(500, { error: "boom" });
      const out = (JSON.parse(body) as Partial<B>[]).map((it) => {
        if (it.id) { const b = bookings.find((x) => x.id === it.id); if (!b) return { success: false, errors: ["unknown id"] }; Object.assign(b, it); return { success: true, modified: { id: b.id } }; }
        if (it.price === undefined) return { success: false, errors: { price: "required" } };
        const b = { id: nextId++, ...it } as B; bookings.push(b); sent.push(b); return { success: true, new: { id: b.id } };
      });
      json(200, out);
    });
    return;
  }
  json(404, {});
});
await new Promise<void>((r) => server.listen(4598, r));
process.env.BEDS24_BASE_URL = "http://127.0.0.1:4598";
process.env.BEDS24_REFRESH_TOKEN = "refresh-abc";
process.env.CHANNEL_PROVIDER = "beds24";
process.env.BEDS24_WEBHOOK_SECRET = "hook-secret";

// ── a throwaway property wired to room 777 ─────────────────────────────────
const real = await db.property.findFirstOrThrow({ where: { status: "published" } });
const { id: _id, createdAt: _c, ...rest } = real;
const prop = await db.property.create({ data: { ...rest, slug: "b24-test-" + Date.now(), name: "Beds24 test", icalToken: randomUUID(), icalImportUrl: null, beds24Id: "777", lastSyncAt: null, lastSyncNote: null } });
const reload = () => db.property.findUniqueOrThrow({ where: { id: prop.id } });
const t = today(), d = (n: number) => addDays(t, n);
const refs: string[] = [];
const mk = (over: Partial<B>): B => ({ id: nextId++, roomId: 777, status: "confirmed", arrival: d(30), departure: d(34), channel: "airbnb", firstName: "Ana", lastName: "Silva", ...over });

try {
  // 1. tokens
  bookings = [mk({ arrival: d(30), departure: d(34) }), mk({ arrival: d(50), departure: d(52), firstName: "Bo" }), mk({ arrival: d(60), departure: d(62), firstName: "Cy" })];
  let r = await beds24Channel.pull(await reload());
  ok(tokenCalls === 1, "first call exchanges the refresh token for an access token");
  await beds24Channel.pull(await reload());
  ok(tokenCalls === 1, "the access token is reused, not fetched again");
  validToken = "revoked"; // Beds24 expires it
  r = await beds24Channel.pull(await reload());
  ok(tokenCalls === 2 && !/failed/i.test(r.note), "an expired token (401) is renewed automatically and the call is retried");

  // 2. importing, with paging (3 bookings over 2 pages), blocks, and requests
  ok((await db.booking.count({ where: { propertyId: prop.id, externalUid: { startsWith: "beds24-" } } })) === 3, "all 3 bookings imported across 2 pages");
  ok(!(await isAvailable(prop.id, d(31), d(33))), "an Airbnb booking made in Beds24's channel blocks those dates here");
  bookings.push(mk({ arrival: d(70), departure: d(72), status: "request" }), mk({ arrival: d(80), departure: d(82), status: "black", channel: undefined }));
  await beds24Channel.pull(await reload());
  ok(await isAvailable(prop.id, d(70), d(72)), "an unconfirmed request does not hold dates");
  const blk = await db.booking.findFirst({ where: { propertyId: prop.id, checkIn: d(80) } });
  ok(blk?.source === "block" && !(await isAvailable(prop.id, d(80), d(82))), "a Beds24 blackout blocks dates as an owner block");
  r = await beds24Channel.pull(await reload());
  ok(r.imported === 0, "pulling again changes nothing");

  // 3. changes in Beds24
  bookings[0].status = "cancelled";
  r = await beds24Channel.pull(await reload());
  ok(await isAvailable(prop.id, d(31), d(33)), "a booking cancelled on Airbnb/Beds24 frees its dates here");
  bookings.splice(1, 1); // deleted outright
  r = await beds24Channel.pull(await reload());
  ok(r.cancelled === 1 && (await isAvailable(prop.id, d(50), d(52))), "a booking that disappears frees its dates");

  // 4. outbound: our booking reaches Beds24 with price and reference
  const guest = { propertyId: prop.id, adults: 2, children: 1, pets: 0, name: "Marie Dupont Martin", email: "marie@example.com", locale: "en" };
  const hold = await createHold({ ...guest, from: d(100), to: d(104) });
  refs.push(hold.ref);
  await confirmBooking(hold.ref);
  const s = sent.find((x) => x.apiReference === hold.ref);
  ok(!!s && s.roomId === 777 && s.arrival === d(100) && s.departure === d(104) && s.status === "confirmed", "a confirmed booking is sent to the right Beds24 room and dates");
  ok(s?.price === hold.total / 100, `it carries the price (${s?.price}), because Beds24 does not price API bookings`);
  ok(s?.firstName === "Marie" && s?.lastName === "Dupont Martin", "guest name is split into first and last name");
  const before = await db.booking.count({ where: { propertyId: prop.id } });
  await beds24Channel.pull(await reload());
  ok((await db.booking.count({ where: { propertyId: prop.id } })) === before, "our own booking coming back from Beds24 is recognised, not imported twice");
  await cancelBooking(hold.ref, { by: "admin", reason: "test", refundCents: 0 });
  ok(bookings.find((x) => x.apiReference === hold.ref)?.status === "cancelled", "cancelling here cancels it in Beds24");

  // 5. a failing Beds24 must not undo the guest's booking, and the owner must be told
  failPost = true;
  const h2 = await createHold({ ...guest, from: d(110), to: d(113) });
  refs.push(h2.ref);
  await confirmBooking(h2.ref);
  failPost = false;
  const after = await db.booking.findUniqueOrThrow({ where: { ref: h2.ref } });
  ok(after.status === "confirmed", "if Beds24 is down the guest's booking still stands");
  const alert = (await db.notification.findMany()).find((n) => n.subject.includes("ACTION NEEDED") && n.subject.includes(h2.ref));
  ok(!!alert && /block these dates on Airbnb/i.test(alert.body), "and the owner gets an urgent 'block these dates on Airbnb' message");
  const guestMail = (await db.notification.findMany()).find((n) => n.audience === "guest" && n.subject.includes(h2.ref));
  ok(!!guestMail, "the guest still receives their confirmation");

  // 6. a failing read records the problem and cancels nothing
  const keep = await db.booking.count({ where: { propertyId: prop.id, status: "confirmed", externalUid: { startsWith: "beds24-" } } });
  failGet = true;
  r = await beds24Channel.pull(await reload());
  failGet = false;
  ok(/Sync failed/.test(r.note) && (await db.booking.count({ where: { propertyId: prop.id, status: "confirmed", externalUid: { startsWith: "beds24-" } } })) === keep, "a Beds24 error is recorded and no imported booking is cancelled");

  // 7. webhook: wrong secret refused, right secret pulls straight away
  const bad = await webhook(new Request(`http://x/api/webhooks/beds24?secret=nope&property=${prop.slug}`, { method: "POST", body: "{}" }));
  ok(bad.status === 403, "webhook without the right secret is refused");
  bookings.push(mk({ arrival: d(150), departure: d(153), firstName: "Dee" }));
  const good = await webhook(new Request(`http://x/api/webhooks/beds24?secret=hook-secret&property=${prop.slug}`, { method: "POST", body: "{\"anything\":true}" }));
  ok(good.status === 200 && !(await isAvailable(prop.id, d(150), d(153))), "webhook with the secret pulls the new Airbnb booking immediately");

  // 8. just-in-time check at checkout
  await db.property.update({ where: { id: prop.id }, data: { lastSyncAt: new Date() } });
  let calls = getCalls;
  await syncIfStale(prop.id, 30);
  ok(getCalls === calls, "a fresh sync is not repeated (no needless load on Beds24)");
  await db.property.update({ where: { id: prop.id }, data: { lastSyncAt: new Date(Date.now() - 120_000) } });
  bookings.push(mk({ arrival: d(200), departure: d(203), firstName: "Eli" }));
  calls = getCalls;
  await syncIfStale(prop.id, 30);
  ok(getCalls > calls && !(await isAvailable(prop.id, d(200), d(203))), "a stale sync is refreshed when a guest starts paying, catching a booking made seconds ago");
} finally {
  const all = await db.notification.findMany();
  await db.notification.deleteMany({ where: { id: { in: all.filter((n) => refs.some((r) => n.subject.includes(r) || n.body.includes(r))).map((n) => n.id) } } });
  await db.refund.deleteMany({ where: { booking: { propertyId: prop.id } } });
  await db.payment.deleteMany({ where: { booking: { propertyId: prop.id } } });
  await db.booking.deleteMany({ where: { propertyId: prop.id } });
  await db.property.delete({ where: { id: prop.id } });
  server.close();
  await db.$disconnect();
}
