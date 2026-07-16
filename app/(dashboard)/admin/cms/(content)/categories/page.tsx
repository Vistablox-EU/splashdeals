import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { CategoriesManager } from "./_components/categories-manager";
import type { Metadata } from "next";
import { connection } from "next/server";
import { loadCmsCategories } from "@/app/(dashboard)/admin/cms/_data/cms-loaders";

export const metadata: Metadata = {
  title: "Kategorije | CMS | Splashdeals",
};

export default async function CategoriesPage() {
  await requireAdmin();
  await connection();
  const categories = await loadCmsCategories();
  return <CategoriesManager categories={categories as unknown as Array<Record<string, unknown>>} />;
}
