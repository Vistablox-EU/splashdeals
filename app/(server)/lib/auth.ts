import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins/bearer";

type SocialProviderConfig = {
  clientId: string;
  clientSecret: string;
};

/**
 * Only register providers that have real credentials.
 * Empty clientId/clientSecret makes Better Auth emit build-time WARNs and
 * registers dead OAuth routes.
 *
 * Apple Sign In is intentionally not wired yet (no Apple Developer account).
 */
function buildSocialProviders(): Record<string, SocialProviderConfig> {
  const providers: Record<string, SocialProviderConfig> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    };
  }

  // Apple: enable only when Developer account + env vars exist.
  // Not included for now (no Apple Developer account).

  const twitterId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID;
  const twitterSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET;
  if (twitterId && twitterSecret) {
    providers.twitter = {
      clientId: twitterId,
      clientSecret: twitterSecret,
    };
  }

  return providers;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: ["https://www.splashdeals.rs", "https://splashdeals.rs", "http://localhost:3000"],

  // Email/password enabled for admin logins
  // Buyer users use social-only auth
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  socialProviders: buildSocialProviders(),

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days for buyers
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache
    },
  },

  emailVerification: {
    sendOnSignUp: false,
  },

  rateLimit: {
    window: 60,
    max: 15,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (_user) => {
          // Social provider email is handled by Better Auth automatically
        },
      },
    },
  },

  plugins: [bearer()],

  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN || ".splashdeals.rs"
          : undefined,
    },
    defaultCookieNames: {
      sessionToken: "splashdeals.session",
    },
  },
});
