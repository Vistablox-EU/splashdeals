import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { notFound } from "next/navigation";
import { PostEditor } from "../_components/post-editor";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Izmeni objavu | CMS | Splashdeals",
};

export default async function EditPostPage({ params }: { params: Promise<{ "post-id": string }> }) {
  const user = await requireAdmin();
  await connection();
  const { "post-id": postId } = await params;

  const { loadCmsPostEditorData } = await import("@/app/(dashboard)/admin/cms/_data/cms-loaders");
  const { post, categories, tags, postTagIds } = await loadCmsPostEditorData(postId);

  if (!post) {
    notFound();
  }

  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cms/posts"
          aria-label="Nazad na listu objava"
          className="hover:bg-accent inline-flex items-center justify-center rounded-md border p-2 transition-colors"
        >
          <Icon name="arrow_back" className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni objavu</h1>
          <p className="text-muted-foreground mt-1 text-sm">Uredi {post.title as string}</p>
        </div>
      </div>

      <PostEditor
        post={post as unknown as Record<string, unknown>}
        initialTagIds={postTagIds}
        categories={categories as unknown as Array<Record<string, unknown>>}
        tags={tags as unknown as Array<Record<string, unknown>>}
        dict={dict}
        currentUserId={user.id}
      />
    </div>
  );
}
