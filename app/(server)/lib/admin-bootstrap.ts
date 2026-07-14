/**
 * 🌊 Splashdeals Super Admin Bootstrap
 *
 * If ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are set,
 * this script ensures a SUPER_ADMIN user exists in the database
 * on every server start. It's idempotent.
 *
 * Falls back to ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD if bootstrap
 * vars are not explicitly set.
 */

import "server-only";
import { prisma } from "@/app/(server)/lib/prisma";

function getBootstrapConfig(): { email: string; password: string } | null {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_SEED_EMAIL || "";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_SEED_PASSWORD || "";

  if (!email || !password) return null;
  return { email, password };
}

export async function bootstrapSuperAdmin(): Promise<void> {
  const config = getBootstrapConfig();
  if (!config) return;

  console.log(`🔧 Admin bootstrap: ensuring ${config.email} is SUPER_ADMIN...`);

  if (!config.password || config.password.length < 8) {
    console.warn("⚠️  Admin bootstrap: password is too short (< 8 chars). Skipping bootstrap.");
    return;
  }

  try {
    // 1. Check if tables exist — skip gracefully if DB isn't ready
    const tablesExist = await prisma.user
      .findFirst({ select: { id: true } })
      .then(() => true)
      .catch(() => false);

    if (!tablesExist) {
      console.log("⚠️  Admin bootstrap: User table not found, skipping.");
      return;
    }

    // 2. Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: config.email },
      select: { id: true, role: true },
    });

    if (existing) {
      if (existing.role !== "SUPER_ADMIN") {
        await prisma.user.update({
          where: { email: config.email },
          data: { role: "SUPER_ADMIN" },
        });
        console.log(`✅ ${config.email} upgraded to SUPER_ADMIN`);
      } else {
        console.log(`✓ ${config.email} is already SUPER_ADMIN`);
      }
      return;
    }

    // 3. User doesn't exist — create via Better Auth
    const { betterAuth } = await import("better-auth");
    const { prismaAdapter } = await import("better-auth/adapters/prisma");

    const auth = betterAuth({
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      emailAndPassword: { enabled: true },
    });

    const result = await auth.api.signUpEmail({
      body: {
        email: config.email,
        password: config.password,
        name: "Super Admin",
      },
    });

    if (!result?.user) {
      throw new Error("Better Auth signup returned no user");
    }

    await prisma.user.update({
      where: { id: result.user.id },
      data: { role: "SUPER_ADMIN" },
    });

    console.log(`✅ SUPER_ADMIN created: ${config.email}`);
  } catch (error) {
    console.error(`⚠️ Admin bootstrap failed (non-fatal): ${error}`);
    console.error(
      "⚠️ The server will start without a SUPER_ADMIN user. You may need to run seed manually.",
    );
  }
}
