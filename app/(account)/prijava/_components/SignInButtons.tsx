"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

interface SignInButtonsProps {
  dict: Record<string, any>;
}

const providers = [
  { id: "google", labelKey: "sign_in_google" },
  { id: "facebook", labelKey: "sign_in_facebook" },
  { id: "apple", labelKey: "sign_in_apple" },
  { id: "twitter", labelKey: "sign_in_twitter" },
] as const;

/**
 * 🌊 Social sign-in buttons for the custom prijava page.
 */
export function SignInButtons({ dict }: SignInButtonsProps) {
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl") || "/moje-karte"
      : "/moje-karte";

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <a
          key={provider.id}
          href={`/api/auth/oauth2/authorize?provider=${provider.id}&callbackURL=${encodeURIComponent(callbackUrl)}`}
          className="block"
        >
          <Button
            variant="outline"
            className="border-border hover:bg-muted flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Icon name="arrow_forward" className="size-5" />
            {dict[provider.labelKey]}
          </Button>
        </a>
      ))}
    </div>
  );
}
