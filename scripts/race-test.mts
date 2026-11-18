// Fires many simultaneous bookings for the SAME dates. Exactly one may win; the rest must be told the dates are gone.
// This is the double-booking guarantee. It matters most on Postgres (production), where transactions run in parallel.
// Run: npx tsx --env-file=.env scripts/race-test.mts
import { db } from "../src/lib/db";
import { createHold, BookingError } from "../src/lib/booking";
import { addDays, today } from "../src/lib/dates";

const p = await db.property.findFirstOrThrow({ where: { status: "published" } });
const from = addDays(today(), 200), to = addDays(from, 3);
const N = 12;

const results = await Promise.allSettled(
  Array.from({ length: N }, (_, i) =>
    createHold({ propertyId: p.id, from, to, adults: 2, children: 0, pets: 0, name: "Race " + i, email: `race${i}@example.com`, locale: "en" }),
  ),
);
const won = results.filter((r) => r.status === "fulfilled").length;
const refused = results.filter((r) => r.status === "rejected" && r.reason instanceof BookingError).length;
const crashed = results.filter((r) => r.status === "rejected" && !(r.reason instanceof BookingError));

console.log(`${N} simultaneous bookings for the same dates: ${won} accepted, ${refused} refused, ${crashed.length} crashed`);
if (crashed.length) console.log("first crash:", String((crashed[0] as PromiseRejectedResult).reason).slice(0, 200));
console.log(won === 1 && refused === N - 1 ? "PASS exactly one guest got the dates" : "FAIL double booking possible");
if (!(won === 1 && refused === N - 1)) process.exitCode = 1;

await db.booking.deleteMany({ where: { guestName: { startsWith: "Race " } } });
await db.$disconnect();
