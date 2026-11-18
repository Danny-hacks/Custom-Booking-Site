import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { deleteReview } from "../../../actions";

export const metadata = { title: "Edit review" };

export default async function EditReview({ params, searchParams }: PageProps<"/admin/reviews/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const r = await db.review.findUnique({ where: { id } });
  if (!r) notFound();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">Edit review</h1>
        <form action={deleteReview.bind(null, r.id)}><button className="btn-ghost !border-danger text-danger">Delete</button></form>
      </div>
      <ReviewForm r={r} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
