import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Polyfill WebSocket in Node.js for Neon serverless adapter
// eslint-disable-next-line @typescript-eslint/no-require-imports
globalThis.WebSocket = require("ws");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required but was not set.");
}
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });

export const prisma: PrismaClient = globalForPrisma.prisma || new PrismaClient({ adapter });

// In development, recreate client on every reload to pick up schema changes
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = new PrismaClient({ adapter });
}
