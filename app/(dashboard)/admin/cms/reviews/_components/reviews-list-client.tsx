"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveReviewAction, deleteReviewAction } from "@/app/(server)/actions/reviews";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
  facility: { name: string };
}

export function ReviewsListClient({ reviews }: { reviews: Review[] }) {
  const router = useRouter();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveReviewAction(id);
      if (result.success) {
        toast.success("Recenzija odobrena");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteReviewAction(id);
      if (result.success) {
        toast.success("Recenzija obrisana");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {reviews.length === 0 && <p className="text-muted-foreground">Nema recenzija.</p>}
      {reviews.map((r) => (
        <div
          key={r.id}
          className="border-border flex items-center justify-between rounded-lg border p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.user.name || r.user.email}</span>
              <Badge variant={r.isApproved ? "default" : "secondary"}>
                {r.isApproved ? "Odobrena" : "Čeka odobrenje"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{r.facility.name}</p>
            <p className="mt-1 text-sm">{r.content}</p>
          </div>
          <div className="flex gap-2">
            {!r.isApproved && (
              <Button size="sm" onClick={() => handleApprove(r.id)}>
                Odobri
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
              Obriši
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
