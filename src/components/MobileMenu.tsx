"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

type Item = { href: string; label: string; icon: string; accent?: boolean };

/**
 * Phone navigation: a hamburger button that opens a sheet with every page, the booking button and the account link.
 * Built on <dialog>, so Escape closes it, focus stays inside while it is open, and the page behind cannot be tapped.
 */
export function MobileMenu({
  items, cta, account, labels,
}: {
  items: Item[]; cta: { href: string; label: string }; account: Item; labels: { open: string; close: string; title: string };
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label={labels.open}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { ref.current?.showModal(); setOpen(true); }}
        className="ml-1 grid h-11 w-11 place-items-center rounded-full border border-line bg-paper md:hidden"
      >
        <Icon name="menu" size={22} />
      </button>

      <dialog
        ref={ref}
        aria-label={labels.title}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === ref.current) close(); }}
        className="menu-sheet m-0 w-full max-w-none rounded-b-3xl border-0 bg-paper p-0 text-ink shadow-2xl md:hidden"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="serif text-[19px]">Lestrebaldie</span>
          <button type="button" aria-label={labels.close} onClick={close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-canvas">
            <Icon name="x" size={24} />
          </button>
        </div>

        <nav aria-label={labels.title} className="px-3 pb-2">
          <ul>
            {items.map((it, i) => (
              <li key={it.href} className="rise" style={{ "--d": i } as React.CSSProperties}>
                <Link
                  href={it.href}
                  onClick={close}
                  className={`flex min-h-14 items-center gap-4 rounded-2xl px-3 text-[19px] font-semibold hover:bg-canvas ${it.accent ? "text-deal" : ""}`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${it.accent ? "bg-deal-tint" : "bg-tint text-brand"}`}>
                    <Icon name={it.icon} size={20} weight={it.accent ? "fill" : "regular"} />
                  </span>
                  {it.label}
                  <Icon name="right" size={18} className="ml-auto text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-line p-5">
          <Link href={cta.href} onClick={close} className="btn w-full text-lg">{cta.label} <Icon name="arrow" size={18} /></Link>
          <Link href={account.href} onClick={close} className="btn-ghost w-full"><Icon name={account.icon} size={18} /> {account.label}</Link>
        </div>
      </dialog>
    </>
  );
}
