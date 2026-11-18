import { db } from "../src/lib/db";
import { createHold, confirmBooking, cancelBooking, BookingError } from "../src/lib/booking";
import { addDays, today } from "../src/lib/dates";
import { parseIcs } from "../src/lib/ical";

const ok = (c: boolean, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };
const p = await db.property.findFirstOrThrow();
const base = { propertyId: p.id, adults: 4, children: 0, pets: 0, name: "Test Guest", email: "t@example.com", locale: "en" };

// 1. free dates: hold -> pay -> confirmed, totals correct
const from = addDays(today(), 100), to = addDays(from, 3);
const hold = await createHold({ ...base, from, to });
ok(hold.status === "hold" && hold.total > 0, `hold created, total ${hold.total}`);
await db.payment.create({ data: { bookingId: hold.id, amount: hold.total, provider: "demo" } });

// 2. same dates while held -> rejected
let err = "";
try { await createHold({ ...base, from, to }); } catch (e) { err = e instanceof BookingError ? e.message : String(e); }
ok(/no longer available/.test(err), "double booking blocked while hold is live: " + err);

// 3. overlapping partial dates also blocked
try { await createHold({ ...base, from: addDays(from, 2), to: addDays(from, 5) }); err = ""; } catch (e) { err = (e as Error).message; }
ok(err !== "", "partial overlap blocked");

// 4. back-to-back (checkout day = next arrival) allowed
const b2 = await createHold({ ...base, from: to, to: addDays(to, 2) });
ok(!!b2.id, "back-to-back stay allowed");

// 5. below min nights / over capacity / past
for (const [label, o] of [["min nights", { from: addDays(today(), 200), to: addDays(today(), 201) }], ["capacity", { from: addDays(today(), 210), to: addDays(today(), 214), adults: 21 }], ["past", { from: addDays(today(), -3), to: addDays(today(), 1) }]] as const) {
  try { await createHold({ ...base, ...o }); ok(false, label + " should fail"); } catch (e) { ok(e instanceof BookingError, label + " rejected: " + (e as Error).message); }
}

// 6. confirm -> owner + guest notifications, ical feed includes it
const done = await confirmBooking(hold.ref, "pi_test");
ok(done?.status === "confirmed", "booking confirmed");
const notes = await db.notification.findMany({ where: { body: { contains: "Test Guest" } } });
ok(notes.length >= 1, "owner/guest notifications stored");
const ics = await (await fetch(`http://localhost:3000/api/ical/${p.icalToken}.ics`)).text();
const ev = parseIcs(ics);
ok(ev.some((e) => e.uid.startsWith(hold.ref) && e.start === from && e.end === to), "calendar feed exports the booking for Airbnb");

// 7. cancel >30 days out -> full refund
const c = await cancelBooking(hold.ref, { by: "guest" });
ok(c?.refunded === hold.total, `guest cancel 100 days out refunds in full (${c?.refunded}/${hold.total})`);
ok((await db.booking.findUnique({ where: { id: hold.id } }))?.status === "cancelled", "dates released");
const again = await createHold({ ...base, from, to });
ok(!!again.id, "cancelled dates bookable again");

// 8. late cancel -> no refund per policy (arrival in 5 days)
const lf = addDays(today(), 5);
const late = await createHold({ ...base, from: lf, to: addDays(lf, 2) });
await db.payment.create({ data: { bookingId: late.id, amount: late.total, provider: "demo" } });
await confirmBooking(late.ref, "pi_late");
const lc = await cancelBooking(late.ref, { by: "guest" });
ok(lc?.refunded === 0, "guest cancel 5 days out: no refund per policy");
const ac = await db.booking.create({ data: { ...{ ref: "ZZADM1", propertyId: p.id, guestName: "A", guestEmail: "a@a.a", checkIn: addDays(today(), 300), checkOut: addDays(today(), 302), nights: 2, total: 100000, status: "confirmed" } } });
await db.payment.create({ data: { bookingId: ac.id, amount: 100000, status: "paid", provider: "demo" } });
const adm = await cancelBooking("ZZADM1", { by: "admin", refundCents: 25000, reason: "goodwill" });
ok(adm?.refunded === 25000, "admin custom refund honoured");

// 9. Airbnb ical parse
const sample = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:abc123@airbnb.com\r\nDTSTART;VALUE=DATE:20270110\r\nDTEND;VALUE=DATE:20270114\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nEND:VCALENDAR";
const pe = parseIcs(sample);
ok(pe.length === 1 && pe[0].start === "2027-01-10" && pe[0].end === "2027-01-14", "Airbnb ICS parsed");
await db.$disconnect();
