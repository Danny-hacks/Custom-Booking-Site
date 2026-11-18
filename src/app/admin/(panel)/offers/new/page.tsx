import { db } from "@/lib/db";
import { OfferForm } from "@/components/admin/OfferForm";

export const metadata = { title: "New offer" };

export default async function NewOffer({ searchParams }: PageProps<"/admin/offers/new">) {
  const sp = await searchParams;
  const properties = await db.property.findMany({ select: { id: true, name: true } });
  return (
    <div>
      <h1 className="mb-6 text-3xl">New offer</h1>
      <OfferForm o={null} properties={properties} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
