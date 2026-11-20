import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Motion";
import { DarkBand } from "@/components/DarkBand";
import { getFeatured } from "@/lib/queries";
import { ReviewCard, Stars } from "@/components/Reviews";
import { RATING, liveReviews } from "@/lib/reviews";
import type { Locale } from "@/lib/property";

export async function generateMetadata({ params }: PageProps<"/[locale]/reviews">): Promise<Metadata> {
  const fr = (await params).locale === "fr";
  return { title: fr ? "Avis de nos hôtes" : "Guest reviews" };
}

export default async function ReviewsPage({ params }: PageProps<"/[locale]/reviews">) {
  const locale = (await params).locale as Locale;
  const fr = locale === "fr";
  const reviews = await liveReviews(locale, 100);
  const p = await getFeatured();
  return (
    <main>
     <div className="mx-auto max-w-[1240px] px-5 py-12">
      <p className="eyebrow">{fr ? "Avis" : "Reviews"}</p>
      <h1 className="mt-1 text-[36px] sm:text-[48px]">{fr ? "Ce que disent nos hôtes" : "What our guests say"}</h1>
      <div className="card mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 p-6">
        <p className="text-[56px] font-bold leading-none">{RATING.score.toFixed(2)}</p>
        <div>
          <Stars n={5} size={22} />
          <p className="mt-1 font-semibold">{RATING.count} {fr ? "avis sur Airbnb" : "reviews on Airbnb"} · {fr ? "Coup de cœur voyageurs" : "Guest Favorite"}</p>
        </div>
        <a href={RATING.url} target="_blank" rel="noopener noreferrer" className="btn-ghost ml-auto">{fr ? "Lire les avis sur Airbnb" : "Read reviews on Airbnb"} <Icon name="arrow" size={18} /></a>
      </div>
      {reviews.length > 0 && (
        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => <Reveal as="li" key={r.id} d={i % 3}><ReviewCard r={r} fr={fr} /></Reveal>)}
        </ul>
      )}
      <div className="mt-12 rounded-[28px] bg-tint p-7 sm:p-10">
        <h2 className="text-[24px] sm:text-[30px]">{fr ? "Vous avez séjourné chez nous ?" : "Stayed with us?"}</h2>
        <p className="mt-2 max-w-xl text-ink-soft">{fr ? "Connectez-vous à votre compte, ouvrez votre séjour et laissez votre avis. Il sera publié après validation." : "Log in to your account, open your stay and leave a review. It is published once we have approved it."}</p>
        <Link href={`/${locale}/account`} className="btn mt-5">{fr ? "Laisser un avis" : "Leave a review"} <Icon name="arrow" size={18} /></Link>
      </div>
     </div>
     <DarkBand locale={locale} slug={p?.slug} title={fr ? "Prêts à réserver ?" : "Ready to book?"} text={fr ? "Réservez en direct, sans frais de plateforme." : "Book direct, with no platform fees."} />
    </main>
  );
}
