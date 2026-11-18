import { titleMeta } from "@/lib/meta";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { Icon } from "@/components/Icon";

export const generateMetadata = titleMeta("contact");

export default async function Contact({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  const d = t(locale);
  const mail = process.env.OWNER_EMAIL ?? "owner@lestrebaldie.example";
  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-tint text-brand-deep"><Icon name="chat" size={32} /></span>
      <h1 className="mt-6 text-[36px] sm:text-[44px]">{d.contact.title}</h1>
      <p className="mt-3 text-ink-soft">{d.contact.lead}</p>
      <a href={`mailto:${mail}`} className="btn mt-8"><Icon name="mail" size={20} /> {d.contact.send}</a>
      <p className="mt-4 text-sm text-ink-soft">{mail}</p>
    </main>
  );
}
