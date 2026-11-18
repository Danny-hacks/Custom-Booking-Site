import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import { CopyCode } from "./CopyCode";
import { fmtDate } from "@/lib/dates";
import type { OfferView } from "@/lib/offers";
import type { Locale } from "@/lib/property";
import { t } from "@/lib/i18n";

/** Expedia-style deal card: photo, coral badge, headline, conditions, code chip and a clear CTA. */
export function OfferCard({ o, locale, href }: { o: OfferView; locale: Locale; href: string }) {
  const d = t(locale).offers;
  const meta = [
    o.bookTo && `${d.validUntil} ${fmtDate(o.bookTo, locale)}`,
    o.stayFrom && o.stayTo && `${d.stayBetween} ${fmtDate(o.stayFrom, locale)} → ${fmtDate(o.stayTo, locale)}`,
    o.minNights > 1 && `${o.minNights} ${d.minNights}`,
  ].filter(Boolean) as string[];
  return (
    <article className="card lift zoom flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        {o.imageUrl ? (
          <Image src={o.imageUrl} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-brand to-navy text-white/90"><Icon name="percent" size={64} weight="duotone" /></div>
        )}
        {o.badge && <span className="badge-deal absolute left-3 top-3 shadow"><Icon name="tag" size={12} weight="fill" /> {o.badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px]">{o.title}</h3>
        {o.body && <p className="mt-2 text-[15px] text-ink-soft">{o.body}</p>}
        {meta.length > 0 && (
          <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
            {meta.map((m) => <li key={m} className="flex items-center gap-1.5"><Icon name="clock" size={14} /> {m}</li>)}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          {o.code ? <CopyCode code={o.code} label={d.copy} done={d.copied} /> : <span />}
          <Link href={href} className="font-bold text-brand hover:underline">{d.view} →</Link>
        </div>
      </div>
    </article>
  );
}
