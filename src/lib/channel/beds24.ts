import "server-only";
import type { Property } from "@prisma/client";
import { db } from "../db";
import type { Channel } from "./index";

/**
 * Beds24 API v2 adapter (channel manager that talks to Airbnb in real time).
 * STATUS: written from the public API docs, NOT yet verified against a live account.
 * Verify in the integration spike: auth header, rate limits, booking payload fields,
 * and that a POSTed booking closes the dates on the connected Airbnb listing.
 * Requires BEDS24_TOKEN and Property.beds24Id (the Beds24 room id).
 */
const BASE = "https://beds24.com/api/v2";

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { token: process.env.BEDS24_TOKEN ?? "", "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Beds24 ${res.status}: ${await res.text()}`);
  return res.json();
}

export const beds24Channel: Channel = {
  name: "beds24",

  async pushBooking(b) {
    if (!b.property.beds24Id) return;
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
          firstName: b.guestName,
          email: b.guestEmail,
          apiReference: b.ref,
        },
      ]),
    });
  },

  async cancelBooking(b) {
    if (!b.property.beds24Id) return;
    const found = await api(`/bookings?apiReference=${encodeURIComponent(b.ref)}`);
    const id = found?.data?.[0]?.id;
    if (id) await api("/bookings", { method: "POST", body: JSON.stringify([{ id, status: "cancelled" }]) });
  },

  async pull(property: Property) {
    if (!property.beds24Id) return { imported: 0, cancelled: 0, note: "No Beds24 room id set" };
    const data = await api(`/bookings?roomId=${property.beds24Id}&arrivalFrom=${new Date().toISOString().slice(0, 10)}`);
    let imported = 0;
    for (const x of data?.data ?? []) {
      if (x.apiReference) continue; // ours
      const uid = `beds24-${x.id}`;
      const status = x.status === "cancelled" ? "cancelled" : "confirmed";
      const existing = await db.booking.findUnique({ where: { externalUid: uid } });
      const nights = Math.max(1, Math.round((Date.parse(x.departure) - Date.parse(x.arrival)) / 86400000));
      if (!existing) {
        await db.booking.create({
          data: {
            ref: "B24" + String(x.id).slice(-5),
            propertyId: property.id,
            guestName: `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() || "Channel guest",
            guestEmail: x.email || "channel@import.local",
            checkIn: x.arrival,
            checkOut: x.departure,
            nights,
            adults: x.numAdult ?? 1,
            source: String(x.channel ?? "airbnb").toLowerCase(),
            status,
            externalUid: uid,
          },
        });
        imported++;
      } else if (existing.status !== status) {
        await db.booking.update({ where: { id: existing.id }, data: { status } });
        imported++;
      }
    }
    const note = `Beds24 sync: ${imported} changes`;
    await db.property.update({ where: { id: property.id }, data: { lastSyncAt: new Date(), lastSyncNote: note } });
    return { imported, cancelled: 0, note };
  },
};
