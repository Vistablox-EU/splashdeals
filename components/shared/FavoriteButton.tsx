"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { addFavoriteAction, removeFavoriteAction } from "@/app/(server)/actions/favorites";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  facilityId: string;
  isFavorited: boolean;
  className?: string;
}

/**
 * ⭐ Toggle button for adding/removing a facility from the user's favorites.
 */
export function FavoriteButton({ facilityId, isFavorited, className = "" }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      if (isFavorited) {
        const result = await removeFavoriteAction(facilityId);
        if (!result.success) {
          toast.error(result.error || "Greška pri uklanjanju");
        }
      } else {
        const result = await addFavoriteAction(facilityId);
        if (!result.success) {
          toast.error(result.error || "Greška pri dodavanju");
        }
      }
      router.refresh();
    });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant="ghost"
      size="icon"
      className={`hover:bg-background/20 absolute top-2 left-2 z-30 size-8 rounded-full backdrop-blur-sm transition-all ${
        isFavorited ? "text-red-500" : "text-white/70 hover:text-white"
      } ${className}`}
      aria-label={isFavorited ? "Ukloni iz omiljenih" : "Dodaj u omiljene"}
    >
      <Icon
        name={isFavorited ? "favorite" : "favorite_border"}
        className={isPending ? "size-5 animate-pulse" : "size-5"}
      />
    </Button>
  );
}
