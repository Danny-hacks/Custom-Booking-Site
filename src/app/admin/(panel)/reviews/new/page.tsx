import { ReviewForm } from "@/components/admin/ReviewForm";

export const metadata = { title: "Add review" };

export default async function NewReview({ searchParams }: PageProps<"/admin/reviews/new">) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-3xl">Add a review</h1>
      <ReviewForm r={null} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
