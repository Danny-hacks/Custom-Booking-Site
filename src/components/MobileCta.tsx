"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

/** Phone-only sticky booking bar: price on the left, one clear action on the right. Hidden where it would get in the way. */
export function MobileCta({ href, from, price, label }: { href: string; from: string; price: string; label: string }) {
  const path = usePathname();
  if (/\/(book|pay|account|legal|contact)(\/|$)/.test(path)) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(15,34,51,0.4)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[600px] items-center justify-between gap-4">
        <p className="leading-tight"><span className="block text-xs text-ink-soft">{from}</span><span className="serif text-xl">{price}</span></p>
        <Link href={href} className="btn !min-h-11">{label} <Icon name="arrow" size={18} /></Link>
      </div>
    </div>
  );
}
