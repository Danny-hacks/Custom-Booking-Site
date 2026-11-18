import "server-only";
import { createHash } from "node:crypto";
import type { Property } from "@prisma/client";
import { db } from "../db";
import { parseIcs, type IcsEvent } from "../ical";
import { addDays, diffDays, today } from "../dates";
import type { Channel, PullOptions } from "./index";

/** Events we exported ourselves carry this suffix; they must never be imported back. */
const ours = (uid: string) => uid.endsWith("@lestrebaldie");
const isReservation = (e: IcsEvent) => /reserved/i.test(e.summary);

type Feed = { ok: true; events: IcsEvent[] } | { ok: false; error: string };

/**
 * Downloads and validates an iCal feed. A page that is not a calendar (login wall, error page, wrong link)
 * is a failure, never "an empty calendar": otherwise one bad response would cancel every imported booking.
 */
export async function readFeed(url: string, timeoutMs = 15000): Promise<Feed> {
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "text/calendar" } });
    if (!res.ok) return { ok: false, error: `The link answered with an error (HTTP ${res.status}). Check that it is the Airbnb export link.` };
    const text = await res.text();
    if (!/BEGIN:VCALENDAR/i.test(text)) return { ok: false, error: "The link did not return a calendar. Make sure you copied the Airbnb Export calendar link, not a web page." };
    return { ok: true, events: parseIcs(text).filter((e) => e.end >= today()) };
  } catch (e) {
    return { ok: false, error: `Could not reach the link (${(e as Error).message}).` };
  }
}

/** Nights currently held by our own bookings (direct, manual, owner blocks), used to recognise Airbnb echoing them back. */
async function ownNights(propertyId: string) {
  const rows = await db.booking.findMany({
    where: {
      propertyId, externalUid: null, source: { in: ["direct", "manual", "block"] },
      OR: [{ status: "confirmed" }, { status: "hold", holdExpiresAt: { gt: new Date() } }],
      checkOut: { gte: today() },
    },
    select: { checkIn: true, checkOut: true },
  });
  const nights = new Set<string>();
  for (const b of rows) for (let d = b.checkIn; d < b.checkOut; d = addDays(d, 1)) nights.add(d);
  return nights;
}

/**
 * Airbnb re-publishes dates blocked by an imported calendar as "Not available". If every night of a non-reservation
 * event is already held by one of our own bookings, it is our own booking coming back and is not imported again.
 * Real reservations are never treated as echoes: hiding one would risk a double booking.
 */
const isEcho = (e: IcsEvent, own: Set<string>) => {
  if (isReservation(e)) return false;
  for (let d = e.start; d < e.end; d = addDays(d, 1)) if (!own.has(d)) return false;
  return true;
};

export type FeedReport =
  | { ok: false; error: string }
  | { ok: true; reservations: IcsEvent[]; blocks: IcsEvent[]; echoes: number; ours: number };

/** Read-only check of an Airbnb link: what would a sync import? Writes nothing. */
export async function inspectFeed(url: string, propertyId: string): Promise<FeedReport> {
  const feed = await readFeed(url);
  if (!feed.ok) return feed;
  const own = await ownNights(propertyId);
  const theirs = feed.events.filter((e) => !ours(e.uid));
  const echoes = theirs.filter((e) => isEcho(e, own));
  return {
    ok: true,
    reservations: theirs.filter(isReservation),
    blocks: theirs.filter((e) => !isReservation(e) && !isEcho(e, own)),
    echoes: echoes.length,
    ours: feed.events.length - theirs.length,
  };
}

export const icalChannel: Channel = {
  name: "ical",
  // Airbnb polls /api/ical/<token>, so there is nothing to push.
  async pushBooking() {},
  async cancelBooking() {},

  async pull(property: Property, opts?: PullOptions) {
    if (!property.icalImportUrl) return { imported: 0, cancelled: 0, note: "No Airbnb calendar link saved yet" };
    const feed = await readFeed(property.icalImportUrl, opts?.timeoutMs);
    if (!feed.ok) {
      const note = `Sync failed: ${feed.error}`;
      await db.property.update({ where: { id: property.id }, data: { lastSyncAt: new Date(), lastSyncNote: note } });
      return { imported: 0, cancelled: 0, note };
    }
    const own = await ownNights(property.id);
    const events = feed.events.filter((e) => !ours(e.uid) && !isEcho(e, own));
    const seen = new Set(events.map((e) => e.uid));
    let imported = 0;

    for (const e of events) {
      const data = {
        checkIn: e.start,
        checkOut: e.end,
        nights: diffDays(e.start, e.end),
        status: "confirmed",
        source: isReservation(e) ? "airbnb" : "block",
        guestName: isReservation(e) ? "Airbnb guest" : "Blocked (Airbnb)",
        cancelledAt: null,
      };
      const existing = await db.booking.findUnique({ where: { externalUid: e.uid } });
      if (existing) {
        if (existing.checkIn !== e.start || existing.checkOut !== e.end || existing.status !== "confirmed") {
          await db.booking.update({ where: { id: existing.id }, data });
          imported++;
        }
      } else {
        await db.booking.create({
          data: {
            ...data,
            // derived from the whole event id: Airbnb ids all end the same way (@airbnb.com), so a suffix would collide
            ref: "AB" + createHash("sha1").update(e.uid).digest("hex").slice(0, 8).toUpperCase(),
            propertyId: property.id,
            guestEmail: "airbnb@import.local",
            externalUid: e.uid,
          },
        });
        imported++;
      }
    }

    // Anything we imported earlier that vanished from the feed was cancelled (or unblocked) on Airbnb.
    const stale = await db.booking.findMany({
      where: {
        propertyId: property.id,
        externalUid: { not: null },
        status: "confirmed",
        source: { in: ["airbnb", "block"] },
        checkOut: { gte: today() },
      },
    });
    let cancelled = 0;
    for (const b of stale) {
      if (b.externalUid && !seen.has(b.externalUid)) {
        await db.booking.update({ where: { id: b.id }, data: { status: "cancelled", cancelledAt: new Date() } });
        cancelled++;
      }
    }
    const note = `Read ${events.length} Airbnb dates: ${imported} new or changed, ${cancelled} removed`;
    await db.property.update({ where: { id: property.id }, data: { lastSyncAt: new Date(), lastSyncNote: note } });
    return { imported, cancelled, note };
  },
};
