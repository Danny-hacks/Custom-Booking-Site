import Link from "next/link";
import { headers } from "next/headers";
import { Icon } from "@/components/Icon";
import { t } from "@/lib/i18n";

export default async function NotFound() {
  const h = await headers();
  const locale = (h.get("x-pathname") ?? "").startsWith("/fr") ? "fr" : "en";
  const d = t(locale).notFound;
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-[36px] sm:text-[48px]">{d.title}</h1>
      <p className="mt-3 text-ink-soft">{d.text}</p>
      <Link href={`/${locale}`} className="btn mt-8">{d.home} <Icon name="arrow" size={18} /></Link>
    </main>
  );
}
