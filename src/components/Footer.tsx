import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { Icon } from "./Icon";
import { PHOTO_CREDIT } from "@/lib/brand";

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <footer className="mt-24 border-t border-line bg-navy text-[#eadcc6]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="wordmark text-xl text-white">Lestrebaldie</p>
          <p className="italic-serif mt-1 text-[#f0dcc0]">{d.footer.tag}</p>
                    <p className="mt-4 flex items-center gap-2 text-sm opacity-80"><Icon name="pin" size={18} /> Centrès, Aveyron, France</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2 text-[15px]">
          <Link className="hover:underline" href={`/${locale}/offers`}>{d.offers.nav}</Link>
          <Link className="hover:underline" href={`/${locale}/area`}>{d.nav.area}</Link>
          <Link className="hover:underline" href={`/${locale}/faq`}>{d.nav.faq}</Link>
          <Link className="hover:underline" href={`/${locale}/contact`}>{d.nav.contact}</Link>
          <Link className="hover:underline" href={`/${locale}/account`}>{d.nav.account}</Link>
        </nav>
        <nav aria-label="Legal" className="grid content-start gap-2 text-[15px]">
          <Link className="hover:underline" href={`/${locale}/legal/terms`}>{d.footer.terms}</Link>
          <Link className="hover:underline" href={`/${locale}/legal/privacy`}>{d.footer.privacy}</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs opacity-70">
        © {new Date().getFullYear()} La Bastide de Lestrebaldie · {d.footer.rights} · {d.footer.photos} {PHOTO_CREDIT} · <Link href={`/${locale}/area#credits`} className="underline">{d.footer.areaPhotos}</Link>
      </div>
    </footer>
  );
}
