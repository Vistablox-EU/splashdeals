import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { buildResetPasswordHtml } from "./email-templates/reset-password";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [
    "https://www.splashdeals.rs",
    "https://splashdeals.rs",
    "http://localhost:3000",
    // Add Vercel preview URLs here for PR deployments
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache
    },
  },

  emailVerification: {
    sendOnSignUp: false, // No public sign-up for admin
  },

  resetPassword: {
    enabled: true,
    expiresIn: 3600, // 1 hour
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { id: string; email: string; name?: string | null };
      url: string;
    }) => {
      await sendEmail(user.email, "Reset your Splashdeals Admin password", buildResetPasswordHtml(url));
    },
  },

  rateLimit: {
    window: 60, // 60 seconds
    max: 15, // 15 requests per window
  },

  // Expert addition: Map role to session for easier RBAC
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
      },
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN || ".splashdeals.rs"
          : undefined,
    },
  },
});
