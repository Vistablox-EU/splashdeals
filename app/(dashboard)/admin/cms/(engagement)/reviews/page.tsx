import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ReviewsListClient } from "./_components/reviews-list-client";
import { loadCmsReviews } from "@/app/(dashboard)/admin/cms/_data/cms-loaders";

export const metadata: Metadata = {
  title: "Recenzije | CMS | Splashdeals",
};

export default async function ReviewsPage() {
  await requireSuperAdmin();
  await connection();
  const reviews = await loadCmsReviews();

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
      <ReviewsListClient reviews={reviews} />
    </div>
  );
}
