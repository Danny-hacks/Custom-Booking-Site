import "server-only";
import { createHash } from "node:crypto";
import type { Property } from "@prisma/client";
import { db } from "../db";
import { today } from "../dates";
import type { Channel, PullOptions } from "./index";

/**
 * Beds24 API v2 connection: a channel manager that talks to Airbnb through Airbnb's own partner API, so a booking made
 * here closes the dates on Airbnb and an Airbnb booking reaches us, both within about a minute (Beds24's webhooks are
 * documented as ~1 minute on average).
 *
 * STATUS: rebuilt against Beds24's public documentation and tested against a pretend Beds24 server
 * (scripts/beds24-test.mts). NOT yet tried against a real Beds24 account; Beds24 has no sandbox, so the first real
 * run should use a test dates range and be watched (see README "Instant sync with Beds24").
 *
 * Setup: BEDS24_REFRESH_TOKEN (from an invite code created in Beds24 → Settings → Marketplace → API, with scopes
 * bookings read+write and bookings-personal read+write), CHANNEL_PROVIDER=beds24, and each property's Beds24 room id.
 * Access tokens last 24 hours, so we exchange the refresh token for one and renew it automatically.
 */
const base = () => process.env.BEDS24_BASE_URL ?? "https://beds24.com/api/v2";

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(force = false): Promise<string> {
  const refresh = process.env.BEDS24_REFRESH_TOKEN;
  if (!refresh) {
    // A long-life token only reads: fine for watching bookings, not for sending ours.
    const fixed = process.env.BEDS24_TOKEN;
    if (!fixed) throw new Error("Beds24 is not connected yet (BEDS24_REFRESH_TOKEN is not set)");
    return fixed;
  }
  if (!force && cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;
  const res = await fetch(`${base()}/authentication/token`, { headers: { refreshToken: refresh }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Beds24 would not renew its access (HTTP ${res.status}). The refresh token may have been revoked or unused for 30 days.`);
  const j = (await res.json()) as { token?: string; expiresIn?: number };
  if (!j.token) throw new Error("Beds24 sent no access token");
  cached = { token: j.token, expiresAt: Date.now() + (j.expiresIn ?? 3600) * 1000 };
  return j.token;
}

async function api(path: string, init: RequestInit = {}, timeoutMs = 20000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(base() + path, {
      ...init,
      headers: { token: await accessToken(attempt === 1), "Content-Type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 401 && attempt === 0) continue; // expired token: renew once and retry
    if (res.status === 429) throw new Error("Beds24 usage limit reached; it clears within 5 minutes");
    if (!res.ok) throw new Error(`Beds24 ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  throw new Error("Beds24 rejected the access token");
}

/** POST /bookings answers per item with success true/false: a 200 can still contain a failure. */
function assertWritten(result: unknown) {
  const items = Array.isArray(result) ? result : [result];
  const bad = items.find((i) => i && typeof i === "object" && (i as { success?: boolean }).success === false);
  if (bad) throw new Error(`Beds24 refused the change: ${JSON.stringify((bad as { errors?: unknown }).errors ?? bad).slice(0, 200)}`);
}

const hashRef = (uid: string) => "B2" + createHash("sha1").update(uid).digest("hex").slice(0, 8).toUpperCase();

type B24Booking = {
  id: number; status?: string; arrival: string; departure: string; apiReference?: string; channel?: string;
  firstName?: string; lastName?: string; email?: string; numAdult?: number;
};

export const beds24Channel: Channel = {
  name: "beds24",

  async pushBooking(b) {
    if (!b.property.beds24Id) return;
    const [first, ...rest] = b.guestName.trim().split(/\s+/);
    assertWritten(
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify([
          {
            roomId: Number(b.property.beds24Id),
            status: "confirmed",
            arrival: b.checkIn,
            departure: b.checkOut,
            numAdult: b.adults,
            numChild: b.children,
            firstName: first ?? "",
            lastName: rest.join(" "),
            email: b.guestEmail,
            price: b.total / 100, // API-created bookings are not priced for us
            apiReference: b.ref, // lets us recognise our own bookings coming back
          },
        ]),
      }),
    );
  },

  async cancelBooking(b) {
    if (!b.property.beds24Id) return;
    const found = await api(`/bookings?apiReference=${encodeURIComponent(b.ref)}`);
    const id = found?.data?.[0]?.id;
    if (!id) throw new Error(`booking ${b.ref} was not found in Beds24, so it could not be cancelled there`);
    assertWritten(await api("/bookings", { method: "POST", body: JSON.stringify([{ id, status: "cancelled" }]) }));
  },

  async pull(property: Property, opts?: PullOptions): Promise<{ imported: number; cancelled: number; note: string }> {
    if (!property.beds24Id) return { imported: 0, cancelled: 0, note: "No Beds24 room id set" };
    const timeout = opts?.timeoutMs ?? 20000;
    try {
      const rows: B24Booking[] = [];
      for (let page = 1; page <= 20; page++) {
        const data = await api(`/bookings?roomId=${property.beds24Id}&departureFrom=${today()}&page=${page}`, {}, timeout);
        rows.push(...(data?.data ?? []));
        if (!data?.pages?.nextPageExists) break;
      }

      let imported = 0;
      const seen = new Set<string>();
      for (const x of rows) {
        if (x.apiReference) continue; // ours: we already know it
        const uid = `beds24-${x.id}`;
        const st = (x.status ?? "confirmed").toLowerCase();
        const blocking = st === "confirmed" || st === "new" || st === "black";
        if (blocking) seen.add(uid);
        const existing = await db.booking.findUnique({ where: { externalUid: uid } });
        const status = blocking ? "confirmed" : "cancelled";
        if (!existing) {
          if (!blocking) continue; // inquiries and requests do not hold dates
          const isBlock = st === "black";
          await db.booking.create({
            data: {
              ref: hashRef(uid),
              propertyId: property.id,
              guestName: isBlock ? "Blocked (Beds24)" : `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() || "Channel guest",
              guestEmail: x.email || "channel@import.local",
              checkIn: x.arrival,
              checkOut: x.departure,
              nights: Math.max(1, Math.round((Date.parse(x.departure) - Date.parse(x.arrival)) / 86400000)),
              adults: x.numAdult ?? 1,
              source: isBlock ? "block" : (x.channel ?? "manual").toLowerCase(),
              status,
              externalUid: uid,
            },
          });
          imported++;
        } else if (existing.status !== status || existing.checkIn !== x.arrival || existing.checkOut !== x.departure) {
          await db.booking.update({
            where: { id: existing.id },
            data: { status, checkIn: x.arrival, checkOut: x.departure, nights: Math.max(1, Math.round((Date.parse(x.departure) - Date.parse(x.arrival)) / 86400000)), cancelledAt: status === "cancelled" ? new Date() : null },
          });
          imported++;
        }
      }

      // Imported bookings that no longer come back (deleted in Beds24) free their dates.
      const stale = await db.booking.findMany({
        where: { propertyId: property.id, externalUid: { startsWith: "beds24-" }, status: "confirmed", checkOut: { gte: today() } },
      });
      let cancelled = 0;
      for (const b of stale) {
        if (b.externalUid && !seen.has(b.externalUid)) {
          await db.booking.update({ where: { id: b.id }, data: { status: "cancelled", cancelledAt: new Date() } });
          cancelled++;
        }
      }

      const note = `Beds24: read ${rows.length} bookings, ${imported} new or changed, ${cancelled} removed`;
      await db.property.update({ where: { id: property.id }, data: { lastSyncAt: new Date(), lastSyncNote: note } });
      return { imported, cancelled, note };
    } catch (e) {
      const note = `Sync failed: ${(e as Error).message}`;
      await db.property.update({ where: { id: property.id }, data: { lastSyncAt: new Date(), lastSyncNote: note } });
      return { imported: 0, cancelled: 0, note };
    }
  },
};
