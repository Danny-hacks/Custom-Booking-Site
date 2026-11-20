import Link from "next/link";
import { Icon } from "./Icon";
import { Reveal } from "./Motion";
import { RATING, type ReviewView } from "@/lib/reviews";
import type { Locale } from "@/lib/property";

export const Stars = ({ n, size = 18 }: { n: number; size?: number }) => (
  <span className="flex gap-0.5 text-sun" role="img" aria-label={`${n} / 5`}>
    {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={size} weight={i < n ? "fill" : "regular"} />)}
  </span>
);

export function ReviewCard({ r, fr }: { r: ReviewView; fr: boolean }) {
  return (
    <figure className="card lift flex h-full flex-col p-6">
        <Stars n={r.rating} />
        <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">“{r.text}”</blockquote>
        <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint font-bold text-brand-deep" aria-hidden>{r.name.trim().charAt(0).toUpperCase()}</span>
          <span className="min-w-0 text-sm">
            <span className="block truncate font-bold">{r.name}</span>
            <span className="block truncate text-ink-soft">{[r.origin, r.stayLabel].filter(Boolean).join(" · ")}</span>
          </span>
        </figcaption>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">{sourceLabel(r.source, fr)}</p>
      </figure>
  );
}

const sourceLabel = (s: string, fr: boolean) =>
  s === "airbnb" ? (fr ? "Avis Airbnb" : "Airbnb review") : s === "google" ? (fr ? "Avis Google" : "Google review") : fr ? "Séjour en direct" : "Direct guest";

/** Rating summary on the left, quote cards on the right. Used on the home and property pages. */
export function ReviewsSection({ reviews, locale, id, dark }: { reviews: ReviewView[]; locale: Locale; id?: string; dark?: boolean }) {
  const fr = locale === "fr";
  return (
    <section id={id} className={dark ? "band-dark mt-24 scroll-mt-24 bg-navy py-20 text-[#eadcc6]" : "mt-24 scroll-mt-24"}>
     <div className="mx-auto max-w-[1240px] px-5">
      <Reveal>
        <p className="eyebrow">{fr ? "Avis" : "Reviews"}</p>
        <h2 className={"mt-1 text-[30px] sm:text-[40px]" + (dark ? " text-white" : "")}>{fr ? "Ils ont séjourné chez nous" : "Guests who stayed with us"}</h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
        <Reveal>
          <div className="card flex h-full flex-col justify-center p-7 text-center lg:text-left">
            <p className="serif text-[64px] leading-none">{RATING.score.toFixed(2)}</p>
            <div className="mt-3 flex justify-center lg:justify-start"><Stars n={5} size={22} /></div>
            <p className="mt-3 font-semibold">{RATING.count} {fr ? "avis sur Airbnb" : "reviews on Airbnb"}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink-soft lg:justify-start"><Icon name="shield" size={16} className="text-leaf" weight="fill" /> {fr ? "Coup de cœur voyageurs" : "Guest Favorite"}</p>
            <a href={RATING.url} target="_blank" rel="noopener noreferrer" className="mt-5 font-bold text-brand hover:underline">
              {fr ? "Lire les avis sur Airbnb" : "Read reviews on Airbnb"} →
            </a>
            <Link href={`/${locale}/reviews`} className="mt-2 block font-bold text-brand hover:underline">{fr ? "Tous les avis de nos hôtes" : "All guest reviews"} →</Link>
          </div>
        </Reveal>
        {reviews.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {reviews.slice(0, 3).map((r, i) => (
              <Reveal as="li" key={r.id} d={i}><ReviewCard r={r} fr={fr} /></Reveal>
            ))}
          </ul>
        )}
      </div>
     </div>
    </section>
  );
}
