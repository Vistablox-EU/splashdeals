"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { addFavoriteAction, removeFavoriteAction } from "@/app/(server)/actions/favorites";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getClientDictionary } from "@/lib/client-dictionaries";
import { buildPrijavaUrl } from "@/lib/auth/callback-url";
import { saveFavoriteIntent } from "@/lib/auth/favorites-intent";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/types";

interface FavoriteButtonProps {
  facilityId: string;
  facilitySlug?: string;
  isFavorited: boolean;
  className?: string;
  /** Visual variant for light/dark surfaces */
  variant?: "onMedia" | "default";
}

/**
 * ⭐ Toggle facility favorite with optimistic UI.
 * Unauthenticated users are redirected to /prijava with callback + favorite intent.
 */
export function FavoriteButton({
  facilityId,
  facilitySlug,
  isFavorited: isFavoritedProp,
  className = "",
  variant = "onMedia",
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [dict, setDict] = useState<Dict | null>(null);
  const [optimistic, setOptimistic] = useState(isFavoritedProp);
  const [prevProp, setPrevProp] = useState(isFavoritedProp);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  // Sync optimistic state when server prop changes (React-approved render-time adjust)
  if (isFavoritedProp !== prevProp) {
    setPrevProp(isFavoritedProp);
    setOptimistic(isFavoritedProp);
  }

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthPending) return;

    if (!session?.user) {
      saveFavoriteIntent({ facilityId, facilitySlug });
      const returnPath = pathname || (facilitySlug ? `/${facilitySlug}` : "/");
      router.push(buildPrijavaUrl(returnPath));
      return;
    }

    const next = !optimistic;
    setOptimistic(next);

    startTransition(async () => {
      const result = next
        ? await addFavoriteAction(facilityId)
        : await removeFavoriteAction(facilityId);

      if (!result.success) {
        setOptimistic(!next);
        if (result.error?.toLowerCase().includes("prijavljen")) {
          saveFavoriteIntent({ facilityId, facilitySlug });
          router.push(buildPrijavaUrl(pathname || "/"));
          return;
        }
        toast.error(
          result.error ||
            (next
              ? dict?.favorites?.add_error || "Greška pri dodavanju"
              : dict?.favorites?.remove_error || "Greška pri uklanjanju"),
        );
        return;
      }
      router.refresh();
    });
  };

  const onMedia = variant === "onMedia";

  return (
    <Button
      type="button"
      onClick={handleToggle}
      disabled={isPending || isAuthPending}
      variant="ghost"
      size="icon"
      className={cn(
        "z-30 size-11 min-h-11 min-w-11 rounded-full transition-all",
        onMedia
          ? "hover:bg-background/20 absolute top-2 left-2 backdrop-blur-sm"
          : "border-border bg-background/80 hover:bg-muted border shadow-sm",
        optimistic
          ? "text-red-500"
          : onMedia
            ? "text-white/70 hover:text-white"
            : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label={
        optimistic
          ? dict?.favorites?.remove_aria || "Ukloni iz omiljenih"
          : dict?.favorites?.add_aria || "Dodaj u omiljene"
      }
      aria-pressed={optimistic}
    >
      <Icon
        name={optimistic ? "favorite" : "favorite_border"}
        className={isPending ? "size-5 animate-pulse" : "size-5"}
      />
    </Button>
  );
}
