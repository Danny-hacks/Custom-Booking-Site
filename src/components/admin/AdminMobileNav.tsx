"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";

type Item = { href: string; label: string; icon: string; badge?: number };

/** Phone navigation for the owner dashboard: a menu button that opens every section, "View site" and "Log out". */
export function AdminMobileNav({ items, email, logout }: { items: Item[]; email: string; logout: () => void | Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const close = () => ref.current?.close();
  const current = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { ref.current?.showModal(); setOpen(true); }}
        className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white md:hidden"
      >
        <Icon name="menu" size={22} />
        {items.some((i) => i.badge) && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-deal" />}
      </button>

      <dialog
        ref={ref}
        aria-label="Dashboard menu"
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === ref.current) close(); }}
        className="menu-sheet m-0 w-full max-w-none rounded-b-3xl border-0 bg-navy p-0 text-[#e9e3d6] shadow-2xl md:hidden"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="serif text-lg text-white">Owner dashboard</span>
          <button type="button" aria-label="Close menu" onClick={close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><Icon name="x" size={24} /></button>
        </div>
        <nav aria-label="Dashboard" className="px-2 pb-2">
          <ul>
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={close}
                  aria-current={current(it.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-4 rounded-xl px-3 text-[17px] font-semibold ${current(it.href) ? "bg-white/15 text-white" : "hover:bg-white/10"}`}
                >
                  <Icon name={it.icon} size={22} /> {it.label}
                  {!!it.badge && <span className="ml-auto rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{it.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="truncate opacity-70">{email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/en" target="_blank" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold"><Icon name="arrow" size={16} /> View site</Link>
            <form action={logout} className="flex-1">
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/30 font-semibold"><Icon name="signout" size={16} /> Log out</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
