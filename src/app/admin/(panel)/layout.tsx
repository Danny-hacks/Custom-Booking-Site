import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { Icon } from "@/components/Icon";
import { adminLogout } from "../actions";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { db } from "@/lib/db";

const nav = [
  ["/admin", "dash", "Overview"],
  ["/admin/bookings", "list", "Bookings"],
  ["/admin/calendar", "calendar", "Calendar"],
  ["/admin/sync", "sync", "Calendar sync"],
  ["/admin/properties", "house", "Properties"],
  ["/admin/offers", "percent", "Offers"],
  ["/admin/reviews", "star", "Reviews"],
  ["/admin/guides", "edit", "Guides"],
  ["/admin/guests", "users", "Guests"],
  ["/admin/outbox", "bell", "Notifications"],
] as const;

export default async function Panel({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const unsent = await db.notification.count({ where: { delivered: false, audience: "owner" } });
  const pendingReviews = await db.review.count({ where: { status: "pending" } });
  const badge = (label: string) => (label === "Notifications" ? unsent : label === "Reviews" ? pendingReviews : 0);
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-none">
      <aside className="sticky top-0 z-30 bg-navy text-[#e9e3d6] md:h-dvh md:p-4">
        {/* phones: a slim bar with a menu button */}
        <div className="flex h-14 items-center justify-between px-4 md:hidden">
          <p className="serif text-lg text-white">Lestrebaldie</p>
          <AdminMobileNav
            items={nav.map(([href, icon, label]) => ({ href, icon, label, badge: badge(label) }))}
            email={user.email}
            logout={adminLogout}
          />
        </div>

        {/* tablets and desktop: the full sidebar */}
        <div className="hidden md:block">
          <p className="serif px-2 py-3 text-xl text-white">Lestrebaldie<span className="block font-sans text-[10px] uppercase tracking-[0.2em] opacity-60">Owner dashboard</span></p>
          <nav aria-label="Admin" className="mt-4 flex flex-col gap-1">
            {nav.map(([href, icon, label]) => (
              <Link key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] hover:bg-white/10">
                <Icon name={icon} size={20} /> {label}
                {badge(label) > 0 && <span className="ml-auto rounded-full bg-brand px-2 text-xs text-white">{badge(label)}</span>}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4 text-sm">
            <p className="truncate opacity-70">{user.email}</p>
            <Link href="/en" className="mt-2 flex items-center gap-2 py-1 hover:underline" target="_blank"><Icon name="arrow" size={16} /> View site</Link>
            <form action={adminLogout}><button className="flex items-center gap-2 py-1 hover:underline"><Icon name="signout" size={16} /> Log out</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-8">{children}</main>
    </div>
  );
}
