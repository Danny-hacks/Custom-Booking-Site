import { PostForm } from "@/components/admin/PostForm";

export const metadata = { title: "New article" };

export default async function NewPost({ searchParams }: PageProps<"/admin/guides/new">) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-3xl">New article</h1>
      <PostForm p={null} err={typeof sp.err === "string" ? sp.err : undefined} />
    </div>
  );
}
