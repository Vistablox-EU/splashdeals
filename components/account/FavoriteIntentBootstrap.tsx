"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { consumeFavoriteIntent } from "@/lib/auth/favorites-intent";
import { addFavoriteAction } from "@/app/(server)/actions/favorites";
import { toast } from "sonner";

/**
 * Mount once in PlatformShell. After login, applies one-shot favorite intent
 * saved when an unauthenticated user tapped the heart.
 */
export function FavoriteIntentBootstrap() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending || !session?.user) return;
    const intent = consumeFavoriteIntent();
    if (!intent?.facilityId) return;

    void (async () => {
      const result = await addFavoriteAction(intent.facilityId);
      if (result.success) {
        toast.success("Dodato u omiljene");
        router.refresh();
      }
    })();
  }, [isPending, session?.user, router]);

  return null;
}
