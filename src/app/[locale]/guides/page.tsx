import type { Metadata } from "next";
import { getFeatured } from "@/lib/queries";
import { livePosts } from "@/lib/journal";
import type { Locale } from "@/lib/property";
import { CtaCard } from "@/components/CtaCard";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Motion";

const COPY = {
  en: { title: "Guides", h1: "Discovering the Ségala", lead: "Ideas for your stay: things to do around the estate, where to swim, what to eat and how to spend a rainy day.", none: "Articles are coming soon.", band: "Plan your stay", bandText: "The whole estate for your group, in the middle of all of this." },
  fr: { title: "Guides", h1: "Découvrir le Ségala", lead: "Des idées pour votre séjour : que faire autour du domaine, où se baigner, que manger et comment occuper un jour de pluie.", none: "Les articles arrivent bientôt.", band: "Préparez votre séjour", bandText: "Le domaine entier pour votre groupe, au cœur de tout cela." },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/guides">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return { title: COPY[locale].title, description: COPY[locale].lead, alternates: { languages: { en: "/en/guides", fr: "/fr/guides" } } };
}

export default async function JournalPage({ params }: PageProps<"/[locale]/guides">) {
  const locale = (await params).locale as Locale;
  const c = COPY[locale];
  const [posts, p] = await Promise.all([livePosts(locale), getFeatured()]);
  return (
    <main>
      <div className="mx-auto max-w-[1240px] px-5 pb-6 pt-12">
        <p className="eyebrow">{c.title}</p>
        <h1 className="mt-1 text-[36px] sm:text-[48px]">{c.h1}</h1>
        <p className="mt-3 max-w-2xl text-[17px] text-ink-soft">{c.lead}</p>
        {posts.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-line p-12 text-center text-ink-soft">{c.none}</p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal as="li" key={post.id} d={i % 3}><PostCard post={post} locale={locale} /></Reveal>
            ))}
          </ul>
        )}
      </div>
      <CtaCard locale={locale} slug={p?.slug} title={c.band} text={c.bandText} />
    </main>
  );
}
