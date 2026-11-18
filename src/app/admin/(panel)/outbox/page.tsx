import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { mailProvider } from "@/lib/mail";
import { ownerEmail } from "@/lib/notify";
import { sendTestEmail } from "../../actions";

export const metadata = { title: "Notifications" };

export default async function Outbox({ searchParams }: PageProps<"/admin/outbox">) {
  const sp = await searchParams;
  const rows = await db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const provider = mailProvider();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl">Notifications</h1>
      <p className="mt-1 text-ink-soft">Every email the site sends to you or your guests. {provider ? `Email delivery is on (via ${provider === "brevo" ? "Brevo" : "Resend"}).` : "Email delivery is OFF (no BREVO_API_KEY or RESEND_API_KEY is set), so messages are only stored here."}</p>
      {provider && (
        <form action={sendTestEmail} className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-ghost !min-h-10"><Icon name="mail" size={16} /> Send a test email to {ownerEmail()}</button>
        </form>
      )}
      {sp.test === "ok" && <p role="status" className="mt-4 rounded-xl bg-[#dff3e8] p-3 text-leaf">Sent. Check the inbox of {ownerEmail()} (and its spam folder).</p>}
      {sp.test === "fail" && <p role="alert" className="mt-4 break-words rounded-xl bg-[#fdecea] p-3 text-danger"><strong>Could not send.</strong> {typeof sp.msg === "string" ? sp.msg : ""}</p>}
      <ul className="mt-6 space-y-3">
        {rows.length === 0 && <li className="text-ink-soft">Nothing yet.</li>}
        {rows.map((n) => (
          <li key={n.id} className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-semibold"><Icon name={n.audience === "owner" ? "bell" : "mail"} size={18} className="text-brand" /> {n.subject}</p>
              <span className="text-xs text-ink-soft">{n.createdAt.toLocaleString("en-GB")} · to {n.to} · {n.delivered ? "sent" : "stored"}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
