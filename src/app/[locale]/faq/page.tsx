import { titleMeta } from "@/lib/meta";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { Icon } from "@/components/Icon";
import { CtaCard } from "@/components/CtaCard";
import { getFeatured } from "@/lib/queries";

export const generateMetadata = titleMeta("faq");

export default async function Faq({ params }: PageProps<"/[locale]/faq">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const p = await getFeatured();
  const fr = locale === "fr";
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <main>
     <div className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 className="text-[36px] sm:text-[48px]">{d.faq.title}</h1>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {d.faq.items.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
              {q}<Icon name="down" size={20} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
     </div>
     <CtaCard locale={locale} slug={p?.slug} title={fr ? "Une autre question ?" : "Still have a question?"} text={fr ? "Écrivez-nous, nous répondons en général dans l’heure." : "Write to us. We usually reply within the hour."} />
    </main>
  );
}
