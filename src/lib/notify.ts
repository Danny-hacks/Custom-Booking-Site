import "server-only";
import { db } from "./db";

/** Stores every message in the Outbox (visible in admin) and sends via Resend when configured. */
export async function notify(audience: "owner" | "guest", to: string, subject: string, body: string) {
  const row = await db.notification.create({ data: { audience, to, subject, body } });
  const key = process.env.RESEND_API_KEY;
  if (!key) return row;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text: body,
      }),
    });
    if (res.ok) await db.notification.update({ where: { id: row.id }, data: { delivered: true } });
  } catch {
    /* stays undelivered in outbox, visible to the owner */
  }
  return row;
}

export const ownerEmail = () => process.env.OWNER_EMAIL ?? "owner@example.com";
