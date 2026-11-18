import { titleMeta } from "@/lib/meta";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("faq");

export default async function Faq({ params }: PageProps<"/[locale]/faq">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
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
    </main>
  );
}
