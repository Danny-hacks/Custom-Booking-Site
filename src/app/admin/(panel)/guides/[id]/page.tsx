import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostForm } from "@/components/admin/PostForm";
import { deletePost } from "../../../actions";

export const metadata = { title: "Edit article" };

export default async function EditPost({ params, searchParams }: PageProps<"/admin/guides/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await db.post.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">Edit article</h1>
        <form action={deletePost.bind(null, p.id)}><button className="btn-ghost !border-danger text-danger">Delete</button></form>
      </div>
      <PostForm p={p} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
