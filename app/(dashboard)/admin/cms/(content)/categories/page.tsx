import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { CategoriesManager } from "./_components/categories-manager";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Kategorije | CMS | Splashdeals",
};

export default async function CategoriesPage() {
  await requireAdmin();
  await connection();

  const categories = await prisma.blogCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return <CategoriesManager categories={categories as unknown as Array<Record<string, unknown>>} />;
}
