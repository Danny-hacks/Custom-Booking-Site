import "server-only";
import { db } from "./db";
import { mailProvider, sendMail } from "./mail";

/** Stores every message in the Outbox (visible in admin) and emails it when a provider is configured. */
export async function notify(audience: "owner" | "guest", to: string, subject: string, body: string) {
  const row = await db.notification.create({ data: { audience, to, subject, body } });
  if (!mailProvider()) return row;
  const sent = await sendMail(to, subject, body);
  if (sent.ok) await db.notification.update({ where: { id: row.id }, data: { delivered: true } });
  else console.error(`[mail] could not send "${subject}" to ${to}: ${sent.error}`); // stays undelivered in the outbox
  return row;
}

export const ownerEmail = () => process.env.OWNER_EMAIL ?? "owner@example.com";
