import Link from "next/link";
import { Icon } from "./Icon";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { LangSwitch } from "./LangSwitch";
import { MobileMenu } from "./MobileMenu";

export function Header({ locale, signedIn, slug, hasOffers }: { locale: Locale; signedIn: boolean; slug: string; hasOffers?: boolean }) {
  const d = t(locale);
  const fr = locale === "fr";
  const stay = `/${locale}/properties/${slug}`;
  const items = [
    { href: stay, label: d.nav.stay, icon: "house" },
    ...(hasOffers ? [{ href: `/${locale}/offers`, label: d.offers.nav, icon: "tag", accent: true }] : []),
    { href: `/${locale}/area`, label: d.nav.area, icon: "mountains" },
    { href: `/${locale}/faq`, label: d.nav.faq, icon: "chat" },
    { href: `/${locale}/contact`, label: d.nav.contact, icon: "mail" },
  ];
  return (
    <header className="site-header sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5">
        <Link href={`/${locale}`} className="flex min-h-11 items-center gap-2.5" aria-label="La Bastide de Lestrebaldie">
          <span className="grid h-9 w-9 place-items-center logo-mark rounded-t-full rounded-b-md bg-brand text-white">
            <Icon name="house" size={20} weight="fill" />
          </span>
          <span className="wordmark text-[18px] leading-none">
            Lestrebaldie
            <span className="mt-1 block font-sans text-[11px] font-semibold tracking-[0.3em] text-ink-soft">AVEYRON</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[15px]">
          <Link className="navlink hidden rounded-lg px-3 py-2 md:block" href={stay}>{d.nav.stay}</Link>
          {hasOffers && (
            <Link className="navlink hidden items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-deal md:flex" href={`/${locale}/offers`}>
              <Icon name="tag" size={16} weight="fill" /> {d.offers.nav}
            </Link>
          )}
          <Link className="navlink hidden rounded-lg px-3 py-2 md:block" href={`/${locale}/area`}>{d.nav.area}</Link>
          <Link className="navlink hidden rounded-lg px-3 py-2 md:block" href={`/${locale}/faq`}>{d.nav.faq}</Link>
          <LangSwitch locale={locale} />
          <Link href={`/${locale}/properties/${slug}#book`} className="btn ml-2 !min-h-10 !px-5 max-md:!hidden">{d.card.reserve}</Link>
          <Link
            href={`/${locale}/account`}
            className="ml-1 hidden min-h-11 items-center gap-2 rounded-full border border-line bg-paper px-3.5 hover:shadow-sm md:flex"
          >
            <Icon name="user" size={20} />
            <span className="text-sm font-medium">{signedIn ? d.nav.account : d.nav.login}</span>
          </Link>
          <MobileMenu
            items={items}
            cta={{ href: `${stay}#book`, label: d.card.reserve }}
            account={{ href: `/${locale}/account`, label: signedIn ? d.nav.account : d.nav.login, icon: "user" }}
            labels={{ open: fr ? "Ouvrir le menu" : "Open menu", close: fr ? "Fermer le menu" : "Close menu", title: fr ? "Menu" : "Menu" }}
          />
        </nav>
      </div>
    </header>
  );
}
