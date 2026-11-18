import "server-only";
import { db } from "./db";
import { eachNight } from "./dates";

const activeWhere = (now: Date) => ({
  OR: [
    { status: "confirmed" },
    { status: "hold", holdExpiresAt: { gt: now } },
  ],
});

/** Every night (YYYY-MM-DD) that cannot be booked: confirmed stays, Airbnb stays, owner blocks, live holds. */
export async function blockedNights(propertyId: string, from?: string, to?: string) {
  const rows = await db.booking.findMany({
    where: {
      propertyId,
      ...activeWhere(new Date()),
      ...(from && to ? { checkIn: { lt: to }, checkOut: { gt: from } } : {}),
    },
    select: { checkIn: true, checkOut: true },
  });
  const set = new Set<string>();
  for (const r of rows) for (const n of eachNight(r.checkIn, r.checkOut)) set.add(n);
  return [...set].sort();
}

export async function isAvailable(propertyId: string, from: string, to: string, ignoreBookingId?: string) {
  const clash = await db.booking.findFirst({
    where: {
      propertyId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      checkIn: { lt: to },
      checkOut: { gt: from },
      ...activeWhere(new Date()),
    },
    select: { id: true },
  });
  return !clash;
}
