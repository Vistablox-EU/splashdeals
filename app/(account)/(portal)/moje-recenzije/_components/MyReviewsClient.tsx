"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/Icon";
import { deleteOwnReviewAction, updateOwnReviewAction } from "@/app/(server)/actions/reviews";
import { toast } from "sonner";

export type BuyerReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  facility: { id: string; name: string; slug: string };
};

export function MyReviewsClient({
  reviews: initial,
  labels,
}: {
  reviews: BuyerReview[];
  labels: {
    no_reviews: string;
    edit_review: string;
    delete_review: string;
    save: string;
    cancel: string;
    rating: string;
    pending: string;
    view_facility: string;
    deleted: string;
    saved: string;
  };
}) {
  const [reviews, setReviews] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ rating: 5, title: "", content: "" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (reviews.length === 0) {
    return (
      <Card className="border-border flex flex-col items-center gap-4 p-12 text-center">
        <Icon name="star" className="text-muted-foreground size-12" />
        <p className="text-muted-foreground text-sm font-medium">{labels.no_reviews}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id} className="border-border space-y-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={`/${review.facility.slug}`}
              className="hover:text-primary text-sm font-bold transition-colors"
            >
              {review.facility.name}
            </Link>
            <div className="flex shrink-0 gap-0.5" aria-label={`${labels.rating} ${review.rating}`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= review.rating ? "star" : "star_border"}
                  className={
                    star <= review.rating
                      ? "text-primary size-4"
                      : "text-muted-foreground/30 size-4"
                  }
                />
              ))}
            </div>
          </div>

          {editingId === review.id ? (
            <div className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="min-h-11 min-w-11"
                    onClick={() => setDraft((d) => ({ ...d, rating: star }))}
                    aria-label={`${labels.rating} ${star}`}
                  >
                    <Icon
                      name={star <= draft.rating ? "star" : "star_border"}
                      className={
                        star <= draft.rating
                          ? "text-primary size-5"
                          : "text-muted-foreground size-5"
                      }
                    />
                  </button>
                ))}
              </div>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                maxLength={200}
                className="h-11"
              />
              <Textarea
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                maxLength={2000}
                className="min-h-[80px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-11 min-h-11"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await updateOwnReviewAction(
                        review.id,
                        draft.rating,
                        draft.title,
                        draft.content,
                      );
                      if (!result.success) {
                        toast.error(result.error || "Greška");
                        return;
                      }
                      toast.success(labels.saved);
                      setEditingId(null);
                      router.refresh();
                    });
                  }}
                >
                  {labels.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-h-11"
                  onClick={() => setEditingId(null)}
                >
                  {labels.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {review.title && <p className="mb-1 text-[13px] font-bold">{review.title}</p>}
              <p className="text-muted-foreground text-xs leading-relaxed">{review.content}</p>
              {!review.isApproved ? (
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  {labels.pending}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 min-h-11"
                  onClick={() => {
                    setEditingId(review.id);
                    setDraft({
                      rating: review.rating,
                      title: review.title || "",
                      content: review.content || "",
                    });
                  }}
                >
                  {labels.edit_review}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-11 min-h-11"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteOwnReviewAction(review.id);
                      if (!result.success) {
                        toast.error(result.error || "Greška");
                        return;
                      }
                      setReviews((prev) => prev.filter((r) => r.id !== review.id));
                      toast.success(labels.deleted);
                      router.refresh();
                    });
                  }}
                >
                  {labels.delete_review}
                </Button>
                <Button asChild variant="link" size="sm" className="h-11 min-h-11">
                  <Link href={`/${review.facility.slug}`}>{labels.view_facility}</Link>
                </Button>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
