import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { TagsManager } from "./_components/tags-manager";
import type { Metadata } from "next";
import { connection } from "next/server";
import { loadCmsTags } from "@/app/(dashboard)/admin/cms/_data/cms-loaders";

export const metadata: Metadata = {
  title: "Tagovi | CMS | Splashdeals",
};

export default async function TagsPage() {
  await requireAdmin();
  await connection();
  const tags = await loadCmsTags();
  return <TagsManager tags={tags as unknown as Array<Record<string, unknown>>} />;
}
