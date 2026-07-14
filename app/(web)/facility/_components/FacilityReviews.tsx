"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitReviewAction } from "@/app/(server)/actions/reviews";
import { authClient } from "@/lib/auth-client";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  createdAt: Date;
  user: { name: string | null };
}

interface FacilityReviewsProps {
  facilityId: string;
  initialReviews: Review[];
  dict?: Record<string, unknown>;
}

const STARS = [1, 2, 3, 4, 5];

export function FacilityReviews({ facilityId, initialReviews, dict }: FacilityReviewsProps) {
  const router = useRouter();
  const [reviews] = React.useState<Review[]>(initialReviews);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const t = (dict?.reviews || {}) as Record<string, string>;

  const { data: session } = authClient.useSession();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error(t.select_rating || "Izaberite ocenu.");
      return;
    }
    if (!session) {
      toast.error(t.login_required || "Morate biti prijavljeni.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitReviewAction(facilityId, rating, title, content);
      if (result.success) {
        toast.success(t.submitted || "Recenzija poslata na pregled.");
        setRating(0);
        setTitle("");
        setContent("");
        router.refresh();
      } else {
        toast.error(result.error || t.error || "Greška pri slanju recenzije.");
      }
    } catch {
      toast.error(t.error || "Greška pri slanju recenzije.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = STARS.map(
    (star) => reviews.filter((r) => r.rating === star).length,
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="star" className="text-yellow-500 size-5" />
        <h2 className="text-foreground text-xl font-black tracking-tight uppercase italic">
          {t.title || "Recenzije"}
        </h2>
        {reviews.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {reviews.length}
          </Badge>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <Card className="border-border/50 bg-muted/20 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-foreground text-3xl font-black">{avgRating.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {STARS.map((star) => (
                <Icon
                  key={star}
                  name="star"
                  className={star <= Math.round(avgRating) ? "text-yellow-500 size-3.5" : "text-muted-foreground/20 size-3.5"}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-[10px] font-medium">
              {reviews.length} {t.reviews_count || "recenzija"}
            </span>
          </div>
          <div className="flex-1 space-y-1">
            {STARS.toReversed().map((star) => {
              const count = ratingCounts[star - 1];
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4 text-right text-[10px] font-bold">
                    {star}
                  </span>
                  <Icon name="star" className="text-yellow-500 size-2.5" />
                  <div className="bg-muted-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-yellow-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-6 text-right text-[9px] font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Review form */}
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-foreground/70 mb-2 text-[10px] font-bold tracking-wider uppercase">
              {t.your_rating || "Vaša ocena"}
            </p>
            <div className="flex gap-1">
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Icon
                    name="star"
                    className={
                      star <= (hoverRating || rating)
                        ? "text-yellow-500 size-9 md:size-6"
                        : "text-muted-foreground/20 size-9 md:size-6"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Input
              placeholder={t.title_placeholder || "Naslov recenzije (opcionalno)"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              maxLength={200}
            />
          </div>
          <div>
            <Textarea
              placeholder={t.content_placeholder || "Vaš utisak..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              maxLength={2000}
            />
            <p className="text-muted-foreground mt-1 text-right text-[9px]">
              {content.length}/2000
            </p>
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <Icon name="progress_activity" className="animate-spin size-3.5" />
            ) : (
              <Icon name="send" className="size-3.5" />
            )}
            {t.submit || "Pošalji recenziju"}
          </Button>
        </form>
      ) : (
        <Card className="border-border/50 bg-muted/20 p-4 text-center">
          <p className="text-muted-foreground text-xs font-medium">
            {t.login_prompt || "Prijavite se da biste ostavili recenziju."}
          </p>
          <Button asChild variant="link" size="sm" className="mt-1 h-auto text-xs font-bold">
            <Link href="/prijava">
              {t.login_link || "Prijavi se"}
            </Link>
          </Button>
        </Card>
      )}

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="border-border/50 bg-muted/10 space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="bg-muted-foreground/10 flex h-6 w-6 items-center justify-center">
                    <span className="text-muted-foreground text-[9px] font-bold">
                      {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </Avatar>
                  <span className="text-foreground text-[11px] font-bold">
                    {review.user?.name || "Anonimno"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {STARS.map((star) => (
                    <Icon
                      key={star}
                      name="star"
                      className={star <= review.rating ? "text-yellow-500 size-3" : "text-muted-foreground/20 size-3"}
                    />
                  ))}
                </div>
              </div>
              {review.title && (
                <p className="text-foreground text-sm font-semibold">{review.title}</p>
              )}
              {review.content && (
                <p className="text-muted-foreground text-xs leading-relaxed">{review.content}</p>
              )}
              <p className="text-muted-foreground text-[9px]">
                {new Date(review.createdAt).toLocaleDateString("sr-RS")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
