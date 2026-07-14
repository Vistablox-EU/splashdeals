import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../app/(server)/lib/prisma";

/**
 * 🌊 Splashdeals Admin Seeder
 * This script creates the initial SUPER_ADMIN user.
 */
async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@splashdeals.rs";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ERROR: ADMIN_SEED_PASSWORD environment variable is not set.");
    process.exit(1);
  }

  console.log(`🚀 Seeding admin user: ${adminEmail}`);

  // We need a standalone auth instance for the seed script since it's running outside Next.js context usually
  const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
  });

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log(`⚠️ User ${adminEmail} already exists. Upgrading to SUPER_ADMIN...`);
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "SUPER_ADMIN" },
      });
      console.log("✅ Role upgraded.");
      return;
    }

    // 2. Create user via Better-Auth
    console.log("📝 Creating account via Better-Auth...");
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "Super Admin",
      },
    });

    if (!result || !result.user) {
      throw new Error("Failed to create user via Better-Auth API");
    }

    // 3. Set role to SUPER_ADMIN
    await prisma.user.update({
      where: { id: result.user.id },
      data: { role: "SUPER_ADMIN" },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   ID: ${result.user.id}`);
    console.log(`   Email: ${adminEmail}`);
    console.log("   Role: SUPER_ADMIN");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
