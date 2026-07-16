import { prisma } from "@/app/(server)/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import { requireAccountSession } from "@/lib/auth/require-account-session";
import type { Metadata } from "next";
import { MyReviewsClient } from "./_components/MyReviewsClient";

export const metadata: Metadata = {
  title: "Moje recenzije",
  robots: { index: false, follow: false },
};

async function getUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    include: {
      facility: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function MojeRecenzijePage() {
  const session = await requireAccountSession("/moje-recenzije");
  const dict = await getDictionary();
  const t = dict.account as Record<string, string>;

  const reviews = await getUserReviews(session.user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t.moje_recenzije}</h1>

      <MyReviewsClient
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          isApproved: r.isApproved,
          facility: r.facility,
        }))}
        labels={{
          no_reviews: t.no_reviews || "Još uvek niste napisali nijednu recenziju.",
          edit_review: t.edit_review || "Izmeni recenziju",
          delete_review: t.delete_review || "Obriši recenziju",
          save: t.save_profile || "Sačuvaj",
          cancel: t.cancel || "Otkaži",
          rating: t.rating || "Ocena",
          pending: t.review_pending || "Čeka odobrenje",
          view_facility: t.view_facility || "Pogledaj objekat",
          deleted: t.review_deleted || "Recenzija obrisana",
          saved: t.review_saved || "Recenzija sačuvana",
        }}
      />
    </div>
  );
}
