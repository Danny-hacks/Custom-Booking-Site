import "server-only";

/**
 * Email sending behind one function. The provider is chosen from the settings, so changing service later (Resend,
 * Brevo, or an SMTP relay on Google Cloud) never touches the rest of the app:
 *   BREVO_API_KEY   -> Brevo (free plan: 300 emails a day, enough for testing)
 *   RESEND_API_KEY  -> Resend
 *   neither         -> nothing is sent; messages stay in Admin -> Notifications
 * MAIL_FROM is the sender, as "Name <address@domain>" or just an address. The provider must have verified it.
 */
export type MailProvider = "brevo" | "resend" | null;

export const mailProvider = (): MailProvider =>
  process.env.BREVO_API_KEY ? "brevo" : process.env.RESEND_API_KEY ? "resend" : null;

/** Splits "La Bastide <hello@x.com>" into a name and an address (Brevo wants them separately). */
export function parseSender(from: string | undefined) {
  const raw = (from ?? "").trim();
  const m = raw.match(/^(.*?)\s*<([^>]+)>$/);
  return m ? { name: m[1].replace(/^"|"$/g, "").trim() || undefined, email: m[2].trim() } : { name: undefined, email: raw };
}

export async function sendMail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const provider = mailProvider();
  if (!provider) return { ok: false, error: "no email provider configured" };
  try {
    if (provider === "brevo") {
      const sender = parseSender(process.env.MAIL_FROM);
      if (!sender.email) return { ok: false, error: "MAIL_FROM is not set (use an address verified in Brevo)" };
      const res = await fetch(process.env.BREVO_API_URL ?? "https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${(await res.text()).slice(0, 200)}` };
      return { ok: true };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
