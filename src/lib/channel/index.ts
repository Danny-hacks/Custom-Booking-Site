import "server-only";
import type { Booking, Property } from "@prisma/client";
import { icalChannel } from "./ical";
import { beds24Channel } from "./beds24";

export type SyncResult = { imported: number; cancelled: number; note: string };

/**
 * A channel provider keeps our calendar and the booking platforms (Airbnb, later Booking.com…) in step.
 * - ical:   free; Airbnb pulls our export feed and we poll Airbnb's feed (minutes of delay, no rates).
 * - beds24: channel-manager API (real-time, two-way). Needs the Beds24 account; see beds24.ts.
 */
export interface Channel {
  name: string;
  pushBooking(b: Booking & { property: Property }): Promise<void>;
  cancelBooking(b: Booking & { property: Property }): Promise<void>;
  pull(property: Property): Promise<SyncResult>;
}

export function channel(): Channel {
  return process.env.CHANNEL_PROVIDER === "beds24" ? beds24Channel : icalChannel;
}
