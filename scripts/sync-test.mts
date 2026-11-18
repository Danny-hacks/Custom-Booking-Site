// Tests the Airbnb calendar sync end to end WITHOUT Airbnb: a local server plays Airbnb's export feed, a throwaway
// property receives the imports, and our real export feed is fetched from the running dev server (:3000).
// Run:  npx tsx --env-file=.env scripts/sync-test.mts      (dev server must be running)
import http from "node:http";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { createHold, BookingError } from "../src/lib/booking";
import { isAvailable } from "../src/lib/availability";
import { icalChannel, inspectFeed } from "../src/lib/channel/ical";
import { buildIcs, type IcsEvent } from "../src/lib/ical";
import { addDays, today } from "../src/lib/dates";

const ok = (c: boolean, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };

// ── a pretend Airbnb ────────────────────────────────────────────────────────
let body = buildIcs("Airbnb", []);
let status = 200;
let contentType = "text/calendar";
const server = http.createServer((_, res) => { res.writeHead(status, { "Content-Type": contentType }); res.end(body); });
await new Promise<void>((r) => server.listen(4599, r));
const feed = (events: IcsEvent[]) => { body = buildIcs("Airbnb", events); status = 200; contentType = "text/calendar"; };

// ── a throwaway property (never touches the real one) ───────────────────────
const real = await db.property.findFirstOrThrow({ where: { status: "published" } });
const { id: _id, createdAt: _c, ...rest } = real;
const prop = await db.property.create({
  data: { ...rest, slug: "sync-test-" + Date.now(), name: "Sync test", icalToken: randomUUID(), icalImportUrl: "http://127.0.0.1:4599/airbnb.ics", lastSyncAt: null, lastSyncNote: null },
});
const reload = () => db.property.findUniqueOrThrow({ where: { id: prop.id } });
const pull = async () => icalChannel.pull(await reload());
const t = today();
const d = (n: number) => addDays(t, n);
const ev = (uid: string, a: number, b: number, summary = "Reserved"): IcsEvent => ({ uid, start: d(a), end: d(b), summary });
const guest = { propertyId: prop.id, adults: 2, children: 0, pets: 0, name: "Sync Test", email: "sync@example.com", locale: "en" };

try {
  // 1. Airbnb reservation + owner block come in and block the dates
  feed([ev("res-1@airbnb.com", 30, 34), ev("blk-1@airbnb.com", 50, 52, "Airbnb (Not available)")]);
  let r = await pull();
  ok(r.imported === 2, `first sync imports the reservation and the block (${r.note})`);
  const res = await db.booking.findUnique({ where: { externalUid: "res-1@airbnb.com" } });
  const blk = await db.booking.findUnique({ where: { externalUid: "blk-1@airbnb.com" } });
  ok(res?.source === "airbnb" && res.status === "confirmed", "reservation stored as an Airbnb booking");
  ok(blk?.source === "block", "“Not available” stored as a block");
  ok(!(await isAvailable(prop.id, d(31), d(33))), "reservation dates are no longer available on our site");
  let err = "";
  try { await createHold({ ...guest, from: d(32), to: d(36) }); } catch (e) { err = e instanceof BookingError ? e.message : String(e); }
  ok(/no longer available/.test(err), "a direct booking over an Airbnb reservation is refused");
  ok(await isAvailable(prop.id, d(34), d(37)), "the night Airbnb's guest leaves (check-out day) is bookable again");

  // 2. running it again changes nothing
  r = await pull();
  ok(r.imported === 0 && r.cancelled === 0, "second sync is a no-op (nothing duplicated)");

  // 3. dates changed on Airbnb
  feed([ev("res-1@airbnb.com", 31, 35), ev("blk-1@airbnb.com", 50, 52, "Airbnb (Not available)")]);
  r = await pull();
  ok(r.imported === 1, "moved reservation is updated");
  ok((await isAvailable(prop.id, d(30), d(31))) && !(await isAvailable(prop.id, d(34), d(35))), "old night freed, new night blocked");

  // 4. cancelled on Airbnb
  feed([ev("blk-1@airbnb.com", 50, 52, "Airbnb (Not available)")]);
  r = await pull();
  ok(r.cancelled === 1, "reservation missing from the feed is cancelled here");
  ok(await isAvailable(prop.id, d(31), d(35)), "its dates are free again");
  const h = await createHold({ ...guest, from: d(31), to: d(35) });
  ok(h.status === "hold", "and can be booked directly");
  await db.booking.update({ where: { id: h.id }, data: { status: "cancelled" } });

  // 5. safety: a wrong link (web page) must not wipe the calendar
  feed([ev("res-2@airbnb.com", 40, 43)]);
  await pull();
  body = "<html><body>Please log in</body></html>"; contentType = "text/html";
  r = await pull();
  const kept = await db.booking.findUnique({ where: { externalUid: "res-2@airbnb.com" } });
  ok(/Sync failed/.test(r.note) && kept?.status === "confirmed", "a web page instead of a calendar fails safely and cancels nothing");
  status = 500;
  r = await pull();
  ok(/Sync failed/.test(r.note) && (await db.booking.findUnique({ where: { externalUid: "res-2@airbnb.com" } }))?.status === "confirmed", "an HTTP error fails safely too");
  await db.property.update({ where: { id: prop.id }, data: { icalImportUrl: "http://127.0.0.1:1/none.ics" } });
  r = await pull();
  ok(/Sync failed/.test(r.note) && (await db.booking.findUnique({ where: { externalUid: "res-2@airbnb.com" } }))?.status === "confirmed", "an unreachable link fails safely too");
  await db.property.update({ where: { id: prop.id }, data: { icalImportUrl: "http://127.0.0.1:4599/airbnb.ics" } });
  const failedProp = await reload();
  ok(true, `status shown to the owner: “${failedProp.lastSyncNote ?? ""}”`.slice(0, 120));

  // 6. echoes: Airbnb hands our own bookings back as "Not available"
  const own = await db.booking.create({ data: { ref: "SYT" + Math.random().toString(36).slice(2, 6).toUpperCase(), propertyId: prop.id, guestName: "Direct guest", guestEmail: "d@example.com", checkIn: d(60), checkOut: d(63), nights: 3, source: "direct", status: "confirmed" } });
  const own2 = await db.booking.create({ data: { ref: "SYU" + Math.random().toString(36).slice(2, 6).toUpperCase(), propertyId: prop.id, guestName: "Direct guest 2", guestEmail: "d@example.com", checkIn: d(63), checkOut: d(65), nights: 2, source: "direct", status: "confirmed" } });
  feed([ev("res-2@airbnb.com", 40, 43), ev("echo-1@airbnb.com", 60, 63, "Airbnb (Not available)"), ev("echo-merged@airbnb.com", 60, 65, "Airbnb (Not available)")]);
  const rep = await inspectFeed("http://127.0.0.1:4599/airbnb.ics", prop.id);
  ok(rep.ok && rep.echoes === 2 && rep.blocks.length === 0 && rep.reservations.length === 1, "dry-run test reports the echoes (also when Airbnb merges two bookings into one range)");
  const before = await db.booking.count({ where: { propertyId: prop.id } });
  await inspectFeed("http://127.0.0.1:4599/airbnb.ics", prop.id);
  ok((await db.booking.count({ where: { propertyId: prop.id } })) === before, "dry-run test writes nothing");
  await pull();
  ok(!(await db.booking.findUnique({ where: { externalUid: "echo-1@airbnb.com" } })) && !(await db.booking.findUnique({ where: { externalUid: "echo-merged@airbnb.com" } })), "echoes of our own bookings are not imported as duplicates");

  // 7. a REAL Airbnb reservation on dates we already sold must never be hidden as an "echo"
  feed([ev("res-2@airbnb.com", 40, 43), ev("clash@airbnb.com", 60, 63, "Reserved")]);
  await pull();
  ok((await db.booking.findUnique({ where: { externalUid: "clash@airbnb.com" } }))?.source === "airbnb", "a real Airbnb reservation on already-sold dates is imported (so the clash is visible, not hidden)");

  // 8. our export feed carries OUR bookings only: no loop back to Airbnb
  let exported = "";
  try { exported = await (await fetch(`http://localhost:3000/api/ical/${prop.icalToken}.ics`)).text(); } catch { /* dev server down */ }
  if (exported) {
    ok(exported.includes(`${own.ref}@lestrebaldie`) && exported.includes(`${own2.ref}@lestrebaldie`), "export feed contains our direct bookings");
    ok(!/airbnb\.com/.test(exported) && !exported.includes("res-2") && !exported.includes("clash"), "export feed never sends Airbnb's own dates back (no loop)");
  } else {
    console.log("SKIP export feed checks (dev server not running on :3000)");
  }

  // 9. an empty but valid calendar really does mean "everything was cancelled"
  feed([]);
  r = await pull();
  ok((await db.booking.count({ where: { propertyId: prop.id, externalUid: { not: null }, status: "confirmed" } })) === 0, "a valid empty calendar clears all imported dates");
} finally {
  await db.booking.deleteMany({ where: { propertyId: prop.id } });
  await db.property.delete({ where: { id: prop.id } });
  server.close();
  await db.$disconnect();
}
