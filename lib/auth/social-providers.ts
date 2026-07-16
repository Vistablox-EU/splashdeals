/**
 * Which social OAuth providers are configured for buyer sign-in.
 * Only providers with both client id + secret should be shown on /prijava.
 */

export type BuyerSocialProviderId = "google" | "facebook" | "apple" | "twitter";

export type BuyerSocialProvider = {
  id: BuyerSocialProviderId;
  labelKey: string;
  icon: string;
};

const PROVIDER_META: BuyerSocialProvider[] = [
  { id: "google", labelKey: "sign_in_google", icon: "login" },
  { id: "facebook", labelKey: "sign_in_facebook", icon: "public" },
  { id: "apple", labelKey: "sign_in_apple", icon: "phone_iphone" },
  { id: "twitter", labelKey: "sign_in_twitter", icon: "alternate_email" },
];

function isConfigured(id: BuyerSocialProviderId): boolean {
  switch (id) {
    case "google":
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "facebook":
      return Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
    case "apple":
      return Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET);
    case "twitter":
      return Boolean(
        (process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID) &&
        (process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET),
      );
    default:
      return false;
  }
}

/** Server-safe list of enabled buyer social providers (order preserved). */
export function getEnabledBuyerSocialProviders(): BuyerSocialProvider[] {
  const enabled = PROVIDER_META.filter((p) => isConfigured(p.id));
  // Dev fallback: if nothing configured, still show Google so local UI is testable
  if (enabled.length === 0 && process.env.NODE_ENV !== "production") {
    return PROVIDER_META.filter((p) => p.id === "google");
  }
  return enabled;
}
