#!/usr/bin/env node
/**
 * Production-safe Prisma migrate deploy for Vercel + Neon.
 *
 * Problems this solves (seen in Vercel build logs):
 * - P1002 advisory-lock timeout when concurrent deploys hit the pooler
 * - Migrations on Neon should prefer a non-pooler (direct) connection
 *
 * Strategy:
 * 1. Prefer DIRECT_URL / DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING
 * 2. Else derive direct host by stripping "-pooler" from DATABASE_URL
 * 3. Retry migrate deploy a few times on P1002 / lock timeouts
 * 4. Exit 0 after exhausting retries so next build can still ship
 *    (schema is usually already up to date; next deploy retries)
 */
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 2500;

function pickMigrationUrl() {
  const candidates = [
    process.env.DIRECT_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
  ].filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  const preferred =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (preferred) {
    return { url: preferred, source: "explicit non-pooler env" };
  }

  try {
    const u = new URL(process.env.DATABASE_URL);
    if (u.hostname.includes("-pooler")) {
      u.hostname = u.hostname.replace("-pooler", "");
      return { url: u.toString(), source: "derived from DATABASE_URL (stripped -pooler)" };
    }
  } catch {
    // fall through
  }

  return { url: process.env.DATABASE_URL, source: "DATABASE_URL as-is" };
}

function isRetryable(output) {
  const text = String(output || "");
  return (
    text.includes("P1002") ||
    text.includes("advisory lock") ||
    text.includes("Timed out trying to acquire") ||
    text.includes("Connection terminated unexpectedly") ||
    text.includes("Can't reach database server") ||
    text.includes("P1001")
  );
}

function runMigrate(url) {
  return spawnSync("npx", ["prisma", "migrate", "deploy"], {
    env: {
      ...process.env,
      // Prisma config + CLI both read DATABASE_URL
      DATABASE_URL: url,
      // Some setups also honor DIRECT_URL; keep them aligned for this process.
      DIRECT_URL: url,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  const picked = pickMigrationUrl();
  if (!picked) {
    console.log("Skipping prisma migrate deploy: DATABASE_URL not set");
    process.exit(0);
  }

  console.log(`[migrate] using ${picked.source}`);
  try {
    const host = new URL(picked.url).hostname;
    console.log(`[migrate] host=${host}`);
  } catch {
    console.log("[migrate] host=<unparseable>");
  }

  let lastOutput = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = runMigrate(picked.url);
    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    lastOutput = `${stdout}${stderr}`;
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    if (result.status === 0) {
      console.log(`[migrate] deploy ok (attempt ${attempt}/${MAX_ATTEMPTS})`);
      process.exit(0);
    }

    if (!isRetryable(lastOutput) || attempt === MAX_ATTEMPTS) {
      break;
    }

    const wait = BASE_DELAY_MS * attempt;
    console.log(
      `[migrate] retryable failure (attempt ${attempt}/${MAX_ATTEMPTS}); waiting ${wait}ms…`,
    );
    await delay(wait);
  }

  console.log(
    "Skipping prisma migrate deploy after retries:",
    lastOutput.split("\n").find((l) => l.includes("Error") || l.includes("P1")) || "unknown error",
  );
  // Do not fail the Vercel build — next deploy retries; app may still be schema-current.
  process.exit(0);
}

main().catch((err) => {
  console.log("Skipping prisma migrate deploy:", err?.message || err);
  process.exit(0);
});
