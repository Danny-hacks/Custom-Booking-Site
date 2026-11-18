// Checks how the site talks to Brevo, using a pretend Brevo server. It cannot prove a real Brevo account accepts the
// sender; use Admin -> Notifications -> "Send a test email" for that.   npx tsx --env-file=.env scripts/mail-test.mts
import http from "node:http";
import { db } from "../src/lib/db";
import { notify } from "../src/lib/notify";
import { mailProvider, parseSender, sendMail } from "../src/lib/mail";

const ok = (c: boolean, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };

type Seen = { headers: http.IncomingHttpHeaders; body: { sender: { name?: string; email: string }; to: { email: string }[]; subject: string; textContent: string } };
let seen: Seen | null = null;
const last = () => seen;
let status = 201;
const server = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    seen = { headers: req.headers, body: JSON.parse(b || "{}") };
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(status === 201 ? JSON.stringify({ messageId: "<x@y>" }) : JSON.stringify({ code: "unauthorized", message: "unrecognised IP address" }));
  });
});
await new Promise<void>((r) => server.listen(4597, r));

delete process.env.RESEND_API_KEY;
process.env.BREVO_API_URL = "http://127.0.0.1:4597/v3/smtp/email";

try {
  ok(parseSender('La Bastide <hello@lestrebaldie.fr>').email === "hello@lestrebaldie.fr" && parseSender('La Bastide <hello@lestrebaldie.fr>').name === "La Bastide", 'sender "Name <address>" is split into name and address');
  ok(parseSender("me@example.com").email === "me@example.com" && parseSender("me@example.com").name === undefined, "a plain address works too");

  delete process.env.BREVO_API_KEY;
  ok(mailProvider() === null, "no key: no provider (messages are only stored)");
  const stored = await notify("owner", "o@example.com", "mail-test stored", "body");
  ok(stored.delivered === false && last() === null, "no key: the message is stored and nothing is sent");

  process.env.BREVO_API_KEY = "xkeysib-test";
  process.env.MAIL_FROM = "La Bastide <hello@lestrebaldie.fr>";
  ok(mailProvider() === "brevo", "Brevo key present: Brevo is used");
  const r = await sendMail("guest@example.com", "Booking confirmed", "Hello there");
  ok(r.ok && last()?.headers["api-key"] === "xkeysib-test", "request carries the API key in Brevo's api-key header");
  ok(last()?.body.sender.email === "hello@lestrebaldie.fr" && last()?.body.sender.name === "La Bastide" && last()?.body.to[0].email === "guest@example.com" && last()?.body.subject === "Booking confirmed" && last()?.body.textContent === "Hello there", "sender, recipient, subject and text are in Brevo's format");

  const n = await notify("guest", "guest@example.com", "mail-test delivered", "body");
  const row = await db.notification.findUniqueOrThrow({ where: { id: n.id } });
  ok(row.delivered === true, "a sent message is marked delivered in the outbox");

  status = 401;
  const f = await sendMail("guest@example.com", "x", "y");
  ok(!f.ok && /401/.test(f.error ?? "") && /unrecognised IP/.test(f.error ?? ""), "a Brevo refusal returns Brevo's own explanation (shown by the test-email button)");
  const n2 = await notify("guest", "guest@example.com", "mail-test failed", "body");
  const row2 = await db.notification.findUniqueOrThrow({ where: { id: n2.id } });
  ok(row2.delivered === false, "a failed send never breaks the booking: the message stays undelivered in the outbox");

  delete process.env.MAIL_FROM;
  status = 201;
  const g = await sendMail("a@b.c", "x", "y");
  ok(!g.ok && /MAIL_FROM/.test(g.error ?? ""), "a missing sender is reported clearly");
} finally {
  await db.notification.deleteMany({ where: { subject: { startsWith: "mail-test" } } });
  server.closeAllConnections();
  server.close();
  await db.$disconnect();
}
