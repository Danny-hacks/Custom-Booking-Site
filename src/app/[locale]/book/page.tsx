import { titleMeta } from "@/lib/meta";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProperty } from "@/lib/queries";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { priceStay } from "@/lib/offers";
import { isAvailable } from "@/lib/availability";
import { diffDays, eur, fmtDate, isValidISO, today } from "@/lib/dates";
import { currentUser } from "@/lib/session";
import { stripeEnabled } from "@/lib/payments";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("checkout", true);

export default async function Book({ params, searchParams }: PageProps<"/[locale]/book">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const p = await getProperty(s("slug"));
  if (!p) notFound();
  const from = s("from"), to = s("to");
  const back = `/${locale}/properties/${p.slug}#book`;
  if (!isValidISO(from) || !isValidISO(to) || from < today() || diffDays(from, to) < p.minNights) redirect(back);
  if (!(await isAvailable(p.id, from, to))) redirect(`/${locale}/properties/${p.slug}?unavailable=1#book`);

  const adults = Math.max(1, Number(s("adults")) || 1), children = Number(s("children")) || 0, pets = Number(s("pets")) || 0;
  const code = s("code");
  const { quote: q, offer, codeInvalid } = await priceStay(p, from, to, adults, locale, code);
  const d = t(locale);
  const user = await currentUser();

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-10">
      <Link href={back} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"><Icon name="back" size={18} /> {d.common.back}</Link>
      <h1 className="text-[32px] sm:text-[40px]">{d.checkout.title}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="order-2 lg:order-1">
          <CheckoutForm
            hidden={{ slug: p.slug, from, to, adults: String(adults), children: String(children), pets: String(pets), locale, code: offer?.code ? code : "" }}
            labels={{ ...d.checkout, ...d.card }}
            signedIn={!!user}
            defaults={{ name: user?.name ?? "", email: user?.email ?? "" }}
            total={eur(q.total, locale)}
            demo={!stripeEnabled()}
          />
        </div>
        <aside className="order-1 lg:order-2">
          <div className="sticky top-24 rounded-2xl border border-line bg-paper p-5">
            <div className="flex gap-4">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl"><Image src={p.photos[0].src} alt="" fill sizes="120px" className="object-cover" /></div>
              <div><p className="serif text-lg">{p.name}</p><p className="text-sm text-ink-soft">{p.location}</p></div>
            </div>
            <h2 className="mt-5 text-lg">{d.checkout.yourTrip}</h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-soft">{d.checkout.dates}</dt><dd>{fmtDate(from, locale)} → {fmtDate(to, locale)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">{d.checkout.guests}</dt><dd>{adults + children}{pets ? ` + ${pets} ${d.card.pets.toLowerCase()}` : ""}</dd></div>
            </dl>
            <h2 className="mt-5 border-t border-line pt-4 text-lg">{d.checkout.priceDetails}</h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div className="flex justify-between"><dt>{q.nights} {q.nights === 1 ? d.card.night : d.card.nights}</dt><dd>{eur(q.accommodation, locale)}</dd></div>
              {q.discount > 0 && <div className="flex items-start justify-between gap-3 font-semibold text-leaf"><dt className="flex min-w-0 items-start gap-1.5"><Icon name="tag" size={16} weight="fill" className="mt-1 shrink-0" /> <span>{q.offerTitle}</span></dt><dd className="shrink-0 whitespace-nowrap">−{eur(q.discount, locale)}</dd></div>}
              {codeInvalid && <p role="alert" className="text-sm text-danger">{locale === "fr" ? "Ce code promo n’est pas valable pour ce séjour." : "That promo code doesn’t apply to this stay."}</p>}
              <div className="flex justify-between"><dt>{d.card.cleaning}</dt><dd>{eur(q.cleaning, locale)}</dd></div>
              {q.tax > 0 && <div className="flex justify-between"><dt>{d.card.tax}</dt><dd>{eur(q.tax, locale)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>{d.card.total}</dt><dd>{eur(q.total, locale)}</dd></div>
            </dl>
            <div className="mt-5 flex gap-3 rounded-xl bg-canvas p-3 text-sm text-ink-soft">
              <Icon name="shield" size={22} className="shrink-0 text-brand" />
              <p><strong className="text-ink">{d.checkout.cancellation}.</strong> {d.prop.policyLines[0]}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
