import "server-only";
import { prisma } from "./prisma";
import { createHash, randomBytes } from "crypto";

/**
 * Hashes an API key using SHA-256.
 * The plain key should be discarded immediately after hashing.
 */
export function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

/**
 * Generates a new random API key with 'sd_' prefix.
 * Returns the plainKey (to show once), the prefix (for identification),
 * and the hashedKey (to store in the database).
 */
export function generateApiKey(): { plainKey: string; prefix: string; hashedKey: string } {
  const plainKey = `sd_${randomBytes(24).toString("hex")}`; // 48 chars total
  const prefix = plainKey.slice(0, 11); // 'sd_' + 8 chars
  const hashedKey = hashApiKey(plainKey);

  return {
    plainKey,
    prefix,
    hashedKey,
  };
}

/**
 * Authenticates a request using the x-api-key header.
 * Looks up the hashed key in the database, checks expiry, and returns the user.
 * Throws an Error with a descriptive message on failure.
 */
export async function authenticateRequest(
  request: Request,
): Promise<{ id: string; name: string | null; email: string; role: string | null | undefined }> {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    throw new Error("API key missing");
  }

  const hashedKey = hashApiKey(apiKey);

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!keyRecord) {
    throw new Error("Invalid API key");
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new Error("API key expired");
  }

  // Update last used timestamp asynchronously
  prisma.apiKey
    .update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error("Failed to update lastUsedAt for API key:", err));

  return keyRecord.user;
}
