import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OfferForm } from "@/components/admin/OfferForm";
import { deleteOffer } from "../../../actions";

export const metadata = { title: "Edit offer" };

export default async function EditOffer({ params, searchParams }: PageProps<"/admin/offers/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [o, properties] = await Promise.all([db.offer.findUnique({ where: { id } }), db.property.findMany({ select: { id: true, name: true } })]);
  if (!o) notFound();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">Edit offer</h1>
        <form action={deleteOffer.bind(null, o.id)}><button className="btn-ghost !border-danger text-danger">Delete</button></form>
      </div>
      <OfferForm o={o} properties={properties} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
