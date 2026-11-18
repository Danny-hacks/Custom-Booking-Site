import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Notifications" };

export default async function Outbox() {
  const rows = await db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const live = !!process.env.RESEND_API_KEY;
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl">Notifications</h1>
      <p className="mt-1 text-ink-soft">Every email the site sends to you or your guests. {live ? "Email delivery is on." : "Email delivery is OFF (no RESEND_API_KEY), so messages are only stored here."}</p>
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
