import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { PostEditor } from "../_components/post-editor";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Nova objava | CMS | Splashdeals",
};

export default async function NewPostPage() {
  const user = await requireAdmin();
  await connection();

  const { loadCmsPostEditorData } = await import("@/app/(dashboard)/admin/cms/_data/cms-loaders");
  const { categories, tags } = await loadCmsPostEditorData();
  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/cms/posts" aria-label="Nazad na listu objava">
            <Icon name="arrow_back" className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova blog objava</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kreiraj novu objavu sa bogatim sadržajem i SEO optimizacijom.
          </p>
        </div>
      </div>

      <PostEditor
        categories={categories as unknown as Array<Record<string, unknown>>}
        tags={tags as unknown as Array<Record<string, unknown>>}
        dict={dict}
        currentUserId={user.id}
      />
    </div>
  );
}
