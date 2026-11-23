import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { POST_CATEGORIES, type PostView } from "@/lib/journal";
import type { Locale } from "@/lib/property";

export const postDate = (d: Date, locale: Locale) =>
  d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));

export function PostCard({ post, locale }: { post: PostView; locale: Locale }) {
  const fr = locale === "fr";
  const cat = POST_CATEGORIES.find((c) => c.key === post.category)?.label[locale];
  return (
    <Link href={`/${locale}/journal/${post.slug}`} className="card lift zoom flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-tint">
        {post.cover ? (
          <Image src={post.cover} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-brand/60"><Icon name="leaf" size={48} weight="duotone" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          {cat && <span className="rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-brand-deep">{cat}</span>}
          <span className="text-ink-soft">{postDate(post.publishedAt, locale)}</span>
        </div>
        <h3 className="mt-3 text-[21px]">{post.title}</h3>
        {post.excerpt && <p className="mt-1.5 text-[15px] text-ink-soft">{post.excerpt}</p>}
        <span className="mt-auto pt-4 text-sm font-bold text-brand">{fr ? "Lire l’article" : "Read the article"} →</span>
      </div>
    </Link>
  );
}
