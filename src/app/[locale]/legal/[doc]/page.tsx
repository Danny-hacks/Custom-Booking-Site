import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";

const body = {
  en: {
    terms: [
      "Booking: the estate is rented as a whole. A booking is confirmed once payment is received.",
      "Payment: the full amount is charged at booking by card through Stripe.",
      "Cancellation: full refund up to 30 days before arrival, 50% between 30 and 14 days, no refund after.",
      "Check-in from 16:00, check-out by 10:00. Tourist tax is collected per adult per night.",
      "House rules: quiet hours 22:00 to 08:00, no events without agreement, pets welcome.",
    ],
    privacy: [
      "We collect the details you enter to manage your booking: name, email, phone and stay details.",
      "Payments are processed by Stripe; we never see or store your card number.",
      "Data is kept for the legal retention period for invoices, then deleted. You can ask for access or deletion by email.",
      "We use only essential cookies (session login).",
    ],
  },
  fr: {
    terms: [
      "Réservation : le domaine est loué en entier. La réservation est confirmée à réception du paiement.",
      "Paiement : le montant total est prélevé à la réservation par carte via Stripe.",
      "Annulation : remboursement intégral jusqu'à 30 jours avant l'arrivée, 50 % entre 30 et 14 jours, aucun remboursement ensuite.",
      "Arrivée à partir de 16h, départ avant 10h. La taxe de séjour est perçue par adulte et par nuit.",
      "Règlement : calme de 22h à 8h, pas d'événement sans accord, animaux bienvenus.",
    ],
    privacy: [
      "Nous collectons les informations saisies pour gérer votre réservation : nom, e-mail, téléphone et détails du séjour.",
      "Les paiements sont traités par Stripe ; nous ne voyons ni ne conservons votre numéro de carte.",
      "Les données sont conservées pendant la durée légale applicable aux factures, puis supprimées. Vous pouvez demander l'accès ou la suppression par e-mail.",
      "Nous n'utilisons que des cookies essentiels (session de connexion).",
    ],
  },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[doc]">) {
  const { locale, doc } = await params;
  return doc === "terms" || doc === "privacy" ? { title: t(locale as Locale).legal[doc] } : {};
}

export default async function Legal({ params }: PageProps<"/[locale]/legal/[doc]">) {
  const { locale: l, doc } = await params;
  const locale = l as Locale;
  if (doc !== "terms" && doc !== "privacy") notFound();
  const d = t(locale);
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-[36px] sm:text-[44px]">{d.legal[doc]}</h1>
      <p className="mt-3 rounded-lg bg-tint px-3 py-2 text-sm text-brand-deep">{d.legal.draft}</p>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-ink-soft">{body[locale][doc].map((x) => <li key={x}>{x}</li>)}</ul>
    </main>
  );
}
