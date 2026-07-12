import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/dictionaries";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

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
  const session = await auth.api.getSession({ headers: await headers() });
  const dict = await getDictionary();
  const t = dict.account;

  if (!session) return null;

  const reviews = await getUserReviews(session.user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t.moje_recenzije}</h1>

      {reviews.length === 0 ? (
        <Card className="border-border flex flex-col items-center gap-4 p-12 text-center">
          <Icon name="star" className="text-muted-foreground size-12" />
          <p className="text-muted-foreground text-sm font-medium">{t.no_reviews}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="border-border p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <Link
                  href={`/${review.facility.slug}`}
                  className="hover:text-primary text-sm font-bold transition-colors"
                >
                  {review.facility.name}
                </Link>
                <div className="flex shrink-0 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      name={star <= review.rating ? "star" : "star_border"}
                      className={
                        star <= review.rating
                          ? "size-4 text-amber-500"
                          : "text-muted-foreground/30 size-4"
                      }
                    />
                  ))}
                </div>
              </div>
              {review.title && <p className="mb-1 text-[13px] font-bold">{review.title}</p>}
              <p className="text-muted-foreground text-xs leading-relaxed">{review.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
