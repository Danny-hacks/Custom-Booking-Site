"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function Inner({ locale }: { locale: string }) {
  const path = usePathname();
  const sp = useSearchParams().toString();
  const other = locale === "en" ? "fr" : "en";
  const href = path.replace(/^\/(en|fr)/, `/${other}`) + (sp ? `?${sp}` : "");
  return (
    <Link
      href={href}
      hrefLang={other}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-paper"
      aria-label={other === "fr" ? "Passer en français" : "Switch to English"}
    >
      {other}
    </Link>
  );
}

export function LangSwitch({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<span className="w-11" />}>
      <Inner locale={locale} />
    </Suspense>
  );
}
