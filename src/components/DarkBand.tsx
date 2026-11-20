import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Ornament } from "@/components/Ornament";
import { Reveal } from "@/components/Motion";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";

/** Full-width dark band that closes a page with a way forward. Alternates with the cream sections above it. */
export function DarkBand({ locale, slug, title, text }: { locale: Locale; slug?: string; title: string; text: string }) {
  const d = t(locale);
  return (
    <section className="band-dark mt-20 bg-navy py-16 text-[#eadcc6] sm:py-20">
      <Reveal className="mx-auto max-w-[1240px] px-5 text-center">
        <Ornament className="mx-auto max-w-[220px] text-sun-bright" />
        <h2 className="mx-auto mt-4 max-w-2xl text-[28px] text-white sm:text-[38px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[17px] opacity-90">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {slug && <Link href={`/${locale}/properties/${slug}#book`} className="btn">{d.card.reserve} <Icon name="arrow" size={18} /></Link>}
          <Link href={`/${locale}/contact`} className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-white/50 px-6 font-semibold text-white transition hover:bg-white/10">
            <Icon name="chat" size={18} /> {d.nav.contact}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
