import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Ornament } from "@/components/Ornament";
import { Reveal } from "@/components/Motion";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";

/** Closing call to action: a contained brown card, so it never merges with the footer or looks like a second footer. */
export function CtaCard({ locale, slug, title, text }: { locale: Locale; slug?: string; title: string; text: string }) {
  const d = t(locale);
  return (
    <section className="mx-auto mt-20 max-w-[1240px] px-5">
      <Reveal kind="scale" className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-brand to-brand-deep px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-sun-bright/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 -z-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Ornament className="mx-auto max-w-[200px] text-sun-bright" />
        <h2 className="mx-auto mt-4 max-w-2xl text-[28px] sm:text-[38px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[17px] text-white/85">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {slug && (
            <Link href={`/${locale}/properties/${slug}#book`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-7 font-bold text-ink shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]">
              {d.card.reserve} <Icon name="arrow" size={18} />
            </Link>
          )}
          <Link href={`/${locale}/contact`} className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-white/50 px-6 font-semibold text-white transition hover:bg-white/10 active:scale-[0.97]">
            <Icon name="chat" size={18} /> {d.nav.contact}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
