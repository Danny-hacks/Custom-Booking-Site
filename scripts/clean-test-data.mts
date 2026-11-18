// Removes the bookings (and their payments, refunds and emails) left behind by scripts/flow-test.mts,
// so the demo dashboard only shows the seeded sample data. Real bookings are never named "Test Guest".
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const junk = await db.booking.findMany({ where: { source: "direct", guestName: { in: ["Test Guest", "A", "E2E Guest"] } }, select: { id: true, ref: true } });
const ids = junk.map((b) => b.id);
const refs = junk.map((b) => b.ref);
await db.refund.deleteMany({ where: { bookingId: { in: ids } } });
await db.payment.deleteMany({ where: { bookingId: { in: ids } } });
const notes = (await db.notification.findMany()).filter((n) => refs.some((r) => n.subject.includes(r) || n.body.includes(r)));
await db.notification.deleteMany({ where: { id: { in: notes.map((n) => n.id) } } });
await db.booking.deleteMany({ where: { id: { in: ids } } });
console.log(`removed ${ids.length} test bookings and ${notes.length} test emails`);
await db.$disconnect();
