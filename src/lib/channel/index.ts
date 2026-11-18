import "server-only";
import type { Booking, Property } from "@prisma/client";
import { db } from "../db";
import { notify, ownerEmail } from "../notify";
import { icalChannel } from "./ical";
import { beds24Channel } from "./beds24";

export type SyncResult = { imported: number; cancelled: number; note: string };
export type PullOptions = { timeoutMs?: number };

/**
 * A channel provider keeps our calendar and the booking platforms (Airbnb, later Booking.com…) in step.
 * - ical:   free; Airbnb pulls our export feed and we poll Airbnb's feed. Airbnb only re-reads OUR feed every few
 *           hours (its limit), so a direct booking is not seen by Airbnb straight away.
 * - beds24: channel-manager API; near real time in both directions. Needs a Beds24 account (see beds24.ts).
 */
export interface Channel {
  name: string;
  pushBooking(b: Booking & { property: Property }): Promise<void>;
  cancelBooking(b: Booking & { property: Property }): Promise<void>;
  pull(property: Property, opts?: PullOptions): Promise<SyncResult>;
}

export const isBeds24 = () => process.env.CHANNEL_PROVIDER === "beds24";
export function channel(): Channel {
  return isBeds24() ? beds24Channel : icalChannel;
}

/**
 * Brings Airbnb's bookings in right now if the last sync is older than `maxAgeSeconds`. Called at the moment a guest
 * checks a price or starts paying, so the dates they are about to buy are checked against Airbnb's latest state.
 * Never throws and never waits long: if Airbnb is slow we carry on with what we have.
 */
export async function syncIfStale(propertyId: string, maxAgeSeconds = 60) {
  try {
    const p = await db.property.findUnique({ where: { id: propertyId } });
    if (!p || !(isBeds24() ? p.beds24Id : p.icalImportUrl)) return;
    if (p.lastSyncAt && Date.now() - p.lastSyncAt.getTime() < maxAgeSeconds * 1000) return;
    await channel().pull(p, { timeoutMs: 4000 });
  } catch {
    /* best effort */
  }
}

/**
 * Tells the booking platforms about a booking change. A failure must never undo the guest's booking, but the owner has
 * to hear about it at once: until the platform is told, the dates may still be sellable there.
 */
export async function pushSafely(kind: "push" | "cancel", b: Booking & { property: Property }) {
  try {
    if (kind === "push") await channel().pushBooking(b);
    else await channel().cancelBooking(b);
  } catch (e) {
    await notify(
      "owner",
      ownerEmail(),
      `ACTION NEEDED: ${b.ref} was not sent to ${channel().name === "beds24" ? "Beds24" : "the channel"}`,
      `Booking ${b.ref} (${b.checkIn} to ${b.checkOut}) was ${kind === "push" ? "confirmed" : "cancelled"} here, but updating the channel failed: ${(e as Error).message}.\n\n` +
        (kind === "push"
          ? "Block these dates on Airbnb by hand right now so nobody else can book them, then check Admin → Calendar sync."
          : "Re-open these dates on Airbnb by hand, then check Admin → Calendar sync."),
    );
  }
}
