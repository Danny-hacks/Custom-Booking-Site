import { titleMeta } from "@/lib/meta";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { view } from "@/lib/property";
import { refundPct } from "@/lib/pricing";
import { eur, fmtDate, today } from "@/lib/dates";
import { AuthForms } from "@/components/AuthForms";
import { cancelMine, logout, submitReview } from "@/app/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("account", true);

export default async function Account({ params, searchParams }: PageProps<"/[locale]/account">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const fr = locale === "fr";
  const d = t(locale);
  const user = await currentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="mb-8 text-center text-4xl">{d.account.title}</h1>
        <div className="rounded-2xl border border-line bg-paper p-6"><AuthForms locale={locale} labels={d.account} /></div>
      </main>
    );
  }

  const bookings = await db.booking.findMany({
    where: { userId: user.id, source: "direct", status: { in: ["confirmed", "cancelled"] } },
    include: { property: true },
    orderBy: { checkIn: "desc" },
  });

  const mine = await db.review.findMany({ where: { userId: user.id } });
  const reviewOf = new Map(mine.map((r) => [r.bookingId, r]));

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">{user.name}</h1>
          <p className="text-ink-soft">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && <Link href="/admin" className="btn-ghost"><Icon name="dash" size={18} /> Admin</Link>}
          <form action={logout.bind(null, locale)}><button className="btn-ghost"><Icon name="signout" size={18} /> {d.nav.logout}</button></form>
        </div>
      </div>

      <h2 className="mt-12 text-2xl">{d.account.bookings}</h2>
      {bookings.length === 0 && <p className="mt-4 text-ink-soft">{d.account.none}</p>}
      <ul className="mt-5 space-y-4">
        {bookings.map((b) => {
          const pct = b.status === "confirmed" ? refundPct(view(b.property).policy, b.checkIn, today()) : 0;
          const refund = Math.round((b.total * pct) / 100);
          const upcoming = b.checkIn >= today();
          return (
            <li key={b.id} id={`stay-${b.ref}`} className="scroll-mt-24 rounded-2xl border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="serif text-xl">{b.property.name}</p>
                  <p className="text-ink-soft">{fmtDate(b.checkIn, locale)} → {fmtDate(b.checkOut, locale)} · {b.nights} {d.card.nights}</p>
                  <p className="mt-1 text-sm text-ink-soft">{b.ref} · {d.account.receipt} {eur(b.total, locale)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${b.status === "confirmed" ? "bg-[#e6ecd9] text-leaf" : "bg-[#f3e0dd] text-danger"}`}>
                  {b.status === "confirmed" ? d.account.confirmed : d.account.cancelled}
                </span>
              </div>
              {b.status === "confirmed" && upcoming && (
                <form action={cancelMine.bind(null, b.ref, locale)} className="mt-4 border-t border-line pt-4">
                  <p className="mb-3 text-sm text-ink-soft">{d.account.cancelConfirm} <strong className="text-ink">{eur(refund, locale)}</strong> ({d.account.refundPolicy}).</p>
                  <ConfirmButton className="btn-ghost !border-danger text-danger" message={`${d.account.cancelConfirm} ${eur(refund, locale)}`}>{d.account.cancel}</ConfirmButton>
                </form>
              )}
              {b.status === "confirmed" && !upcoming && b.checkOut <= today() && (() => {
                const r = reviewOf.get(b.id);
                return (
                  <div className="mt-4 border-t border-line pt-4">
                    {r ? (
                      <p className="flex items-start gap-2 text-sm text-ink-soft">
                        <Icon name="star" size={18} weight="fill" className="mt-0.5 shrink-0 text-sun" />
                        <span>{r.status === "approved" ? (fr ? "Merci ! Votre avis est publié sur le site." : "Thank you! Your review is live on the site.") : r.status === "rejected" ? (fr ? "Votre avis n’a pas été retenu. Écrivez-nous si vous avez des questions." : "Your review was not published. Contact us if you have questions.") : (fr ? "Merci ! Votre avis sera visible après validation par nos soins." : "Thank you! Your review will appear once we have approved it.")}</span>
                      </p>
                    ) : (
                      <form action={submitReview.bind(null, b.ref, locale)} className="grid gap-3">
                        <p className="font-semibold">{fr ? "Comment était votre séjour ?" : "How was your stay?"}</p>
                        <fieldset className="flex items-center gap-3">
                          <legend className="sr-only">{fr ? "Note" : "Rating"}</legend>
                          <span className="stars">
                            {[5, 4, 3, 2, 1].map((n) => (
                              <span key={n} className="contents"><input type="radio" name="rating" id={`r-${b.ref}-${n}`} value={n} required defaultChecked={n === 5} /><label htmlFor={`r-${b.ref}-${n}`} title={`${n}/5`}><Icon name="star" size={30} weight="fill" /><span className="sr-only">{n}/5</span></label></span>
                            ))}
                          </span>
                        </fieldset>
                        <label className="grid gap-1.5 text-sm font-semibold">
                          {fr ? "Votre avis" : "Your review"}
                          <textarea name="text" required minLength={20} maxLength={1500} rows={4} className="field font-normal" placeholder={fr ? "Ce que vous avez aimé, pour qui, à quelle saison…" : "What you loved, who it suits, the season you came…"} />
                        </label>
                        {sp.review === "invalid" && <p className="text-sm text-danger" role="alert">{fr ? "Merci d’écrire au moins 20 caractères." : "Please write at least 20 characters."}</p>}
                        <p className="text-xs text-ink-soft">{fr ? "Votre prénom et l’initiale de votre nom seront affichés. L’avis est publié après validation." : "Your first name and last initial are shown. Reviews are published after approval."}</p>
                        <button className="btn w-fit">{fr ? "Envoyer mon avis" : "Send my review"}</button>
                      </form>
                    )}
                  </div>
                );
              })()}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
