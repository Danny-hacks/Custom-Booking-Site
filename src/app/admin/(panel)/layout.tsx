import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { Icon } from "@/components/Icon";
import { adminLogout } from "../actions";
import { db } from "@/lib/db";

const nav = [
  ["/admin", "dash", "Overview"],
  ["/admin/bookings", "list", "Bookings"],
  ["/admin/calendar", "calendar", "Calendar"],
  ["/admin/sync", "sync", "Calendar sync"],
  ["/admin/properties", "house", "Properties"],
  ["/admin/offers", "percent", "Offers"],
  ["/admin/reviews", "star", "Reviews"],
  ["/admin/guests", "users", "Guests"],
  ["/admin/outbox", "bell", "Notifications"],
] as const;

export default async function Panel({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const unsent = await db.notification.count({ where: { delivered: false, audience: "owner" } });
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-none">
      <aside className="bg-navy p-4 text-[#e9e3d6] md:sticky md:top-0 md:h-dvh">
        <p className="serif px-2 py-3 text-xl text-white">Lestrebaldie<span className="block font-sans text-[10px] uppercase tracking-[0.2em] opacity-60">Owner dashboard</span></p>
        <nav aria-label="Admin" className="mt-4 flex gap-1 overflow-x-auto md:flex-col">
          {nav.map(([href, icon, label]) => (
            <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] hover:bg-white/10">
              <Icon name={icon} size={20} /> {label}
              {label === "Notifications" && unsent > 0 && <span className="ml-auto rounded-full bg-brand px-2 text-xs text-white">{unsent}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-6 hidden border-t border-white/10 pt-4 text-sm md:block">
          <p className="truncate opacity-70">{user.email}</p>
          <Link href="/en" className="mt-2 flex items-center gap-2 py-1 hover:underline" target="_blank"><Icon name="arrow" size={16} /> View site</Link>
          <form action={adminLogout}><button className="flex items-center gap-2 py-1 hover:underline"><Icon name="signout" size={16} /> Log out</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-8">{children}</main>
    </div>
  );
}
