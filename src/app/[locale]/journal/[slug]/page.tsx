import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFeatured } from "@/lib/queries";
import { POST_CATEGORIES, livePost, livePosts } from "@/lib/journal";
import { PLACES, driveLabel } from "@/lib/area";
import type { Locale } from "@/lib/property";
import { DarkBand } from "@/components/DarkBand";
import { Icon } from "@/components/Icon";
import { PostCard, postDate, readingMinutes } from "@/components/PostCard";
import { Reveal } from "@/components/Motion";
import { RichText } from "@/components/RichText";

export async function generateMetadata({ params }: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const post = await livePost(slug, locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { languages: { en: `/en/journal/${slug}`, fr: `/fr/journal/${slug}` } },
    openGraph: { type: "article", title: post.title, description: post.excerpt || undefined, ...(post.cover ? { images: [post.cover] } : {}) },
  };
}

export default async function PostPage({ params }: PageProps<"/[locale]/journal/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const fr = locale === "fr";
  const post = await livePost(slug, locale);
  if (!post) notFound();
  const [p, all] = await Promise.all([getFeatured(), livePosts(locale)]);
  const more = all.filter((x) => x.id !== post.id).slice(0, 3);
  const mentioned = post.places.flatMap((s) => PLACES.filter((x) => x.slug === s));
  const cat = POST_CATEGORIES.find((c) => c.key === post.category)?.label[locale];

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    inLanguage: locale,
    ...(post.cover ? { image: post.cover } : {}),
    publisher: { "@type": "Organization", name: "La Bastide de Lestrebaldie" },
  };

  return (
    <main className="pb-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section>
        <div className="relative isolate flex min-h-[300px] items-end overflow-hidden bg-navy sm:min-h-[400px]">
          {post.cover ? <Image src={post.cover} alt="" fill priority sizes="100vw" className="-z-10 object-cover" /> : <div className="absolute inset-0 -z-10 grid place-items-center text-sun-bright/40"><Icon name="leaf" size={120} weight="duotone" /></div>}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
          <div className="mx-auto w-full max-w-[1240px] px-5 pb-9 sm:pb-12">
            <Link href={`/${locale}/journal`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white/90 hover:underline">
              <Icon name="arrow" size={16} className="rotate-180" /> Journal
            </Link>
            <h1 className="rise mt-1 max-w-3xl text-[34px] text-white sm:text-[50px]">{post.title}</h1>
            <p className="rise mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white [--d:1]">
              {cat && <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{cat}</span>}
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{postDate(post.publishedAt, locale)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{readingMinutes(post.body)} min {fr ? "de lecture" : "read"}</span>
            </p>
          </div>
        </div>
      </section>

      <article className="mx-auto mt-12 max-w-[720px] px-5">
        {post.excerpt && <p className="mb-8 text-[21px] font-medium leading-snug">{post.excerpt}</p>}
        <RichText text={post.body} />
        {post.coverCredit && <p className="mt-10 text-xs text-ink-soft">{fr ? "Photo : " : "Photo: "}{post.coverCredit}</p>}
      </article>

      {mentioned.length > 0 && (
        <section className="mx-auto mt-14 max-w-[1240px] px-5">
          <h2 className="text-[24px] sm:text-[30px]">{fr ? "Les lieux de cet article" : "Places in this article"}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentioned.map((x) => (
              <li key={x.slug}>
                <Link href={`/${locale}/area/${x.slug}`} className="card lift block h-full p-5">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft"><Icon name="car" size={15} /> {driveLabel(x.drive, locale)}</span>
                  <span className="mt-2 block text-lg font-semibold">{fr ? x.nameFr ?? x.name : x.name}</span>
                  <span className="mt-1 block text-[14px] text-ink-soft">{x.summary[locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1240px] px-5">
          <h2 className="text-[24px] sm:text-[30px]">{fr ? "À lire aussi" : "Keep reading"}</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((x, i) => <Reveal as="li" key={x.id} d={i}><PostCard post={x} locale={locale} /></Reveal>)}
          </ul>
        </section>
      )}

      <DarkBand locale={locale} slug={p?.slug} title={fr ? "Séjournez au cœur du Ségala" : "Stay in the heart of the Ségala"} text={fr ? "Le domaine entier pour votre groupe, à quelques minutes des plus beaux sites du pays." : "The whole estate for your group, a few minutes from the best of the country."} />
    </main>
  );
}
