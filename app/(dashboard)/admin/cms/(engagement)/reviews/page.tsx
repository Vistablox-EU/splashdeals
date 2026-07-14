import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ReviewsListClient } from "./_components/reviews-list-client";

export const metadata: Metadata = {
  title: "Recenzije | CMS | Splashdeals",
};

export default async function ReviewsPage() {
  await requireSuperAdmin();
  await connection();

  const reviews = await prisma.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      facility: { select: { id: true, name: true, slug: true } },
    },
  });

  const serialized = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recenzije</h1>
          <p className="text-muted-foreground text-sm">
            Pregledajte i moderirajte recenzije korisnika.
          </p>
        </div>
      </div>

      <ReviewsListClient reviews={serialized} />
    </div>
  );
}
