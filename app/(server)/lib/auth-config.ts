import "server-only";

// This is the future authentication gateway configuring the "better-auth" library
// for Staff terminal logins and Magic Link wallet retrieval.

export const authOptions = {
  // Strategy: Better Auth Custom Provider
  // Role: 6-Digit Gatekeeper PIN for Facility Staff
  // Email: Magic Links for "Email Wallet" customers

  secret: process.env.BETTER_AUTH_SECRET,
  database: "postgresql", // Points to Prisma Neon schema
};

export async function getSession() {
  // Skeleton for retrieving the secure active session
  return null;
}
