#!/usr/bin/env node
/**
 * Splashdeals Sitemap Validator
 *
 * Starts a production server, fetches /sitemap.xml, validates XML structure,
 * checks for common issues, and crawls every URL to verify it returns 200.
 *
 * Usage:  node scripts/check-sitemap.mjs
 * Env:    CI=true (suppresses colour), SITEMAP_SKIP_CRAWL=true (only validate XML)
 * Exit:   0 = pass, 2 = critical failures
 */

import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");

// ── Configuration ──────────────────────────────────────────────────────────
const PORT = 5899;
const BASE = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT = 30_000;
const REQUEST_TIMEOUT = 10_000;
const CRAWL_TIMEOUT_MS = 5000;

const WARN = "🟡";
const FAIL = "🔴";
const PASS = "✅";

let failures = [];
let warnings = [];
let stats = { urlsTotal: 0, urlsCrawled: 0, ok: 0, redirect: 0, notFound: 0, error: 0, skipped: 0 };

// ── Helpers ────────────────────────────────────────────────────────────────

function log(level, category, path, msg) {
  const ci = process.env.CI === "true";
  const prefix = ci ? `[${level}]` : `${level}`;
  console.log(`  ${prefix} ${category} ${path ? `${path}: ` : ""}${msg}`);
}

function fail(level, category, path, msg) {
  log(level, category, path, msg);
  if (level === "FAIL" || level === FAIL) failures.push({ category, path, msg });
  else warnings.push({ category, path, msg });
}

async function httpFetch(url, timeout = REQUEST_TIMEOUT) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await globalThis.fetch(url, { signal: ac.signal, redirect: "manual" });
    return { status: res.status, text: await res.text(), headers: res.headers };
  } catch (e) {
    return { status: 0, text: "", headers: new Headers(), error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Server lifecycle ───────────────────────────────────────────────────────

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
    });

    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start within ${STARTUP_TIMEOUT}ms\n${output}`));
    }, STARTUP_TIMEOUT);

    proc.stdout.on("data", (d) => { output += d.toString(); });
    proc.stderr.on("data", (d) => {
      const text = d.toString();
      output += text;
      if (text.includes("started") || text.includes("ready")) {
        clearTimeout(timeout);
        resolve(proc);
      }
    });
    proc.on("error", (e) => { clearTimeout(timeout); reject(e); });
    proc.on("exit", (code) => {
      clearTimeout(timeout);
      if (code !== 0) reject(new Error(`Server exited with code ${code}\n${output}`));
    });
  });
}

function stopServer(proc) {
  if (!proc) return;
  proc.kill("SIGTERM");
  setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 3000);
}

// ── Sitemap XML Parsing ────────────────────────────────────────────────────

function extractSitemapUrls(xml) {
  const urls = [];
  // Parse <loc> from sitemap XML (handles <sitemapindex> and <urlset>)
  const locRegex = /<loc[^>]*>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) urls.push(url);
  }
  return urls;
}

function extractLastmods(xml) {
  const mods = {};
  const entries = xml.split(/<\/url>|<\/sitemap>/gi);
  for (const entry of entries) {
    const locMatch = entry.match(/<loc[^>]*>([\s\S]*?)<\/loc>/i);
    const modMatch = entry.match(/<lastmod[^>]*>([\s\S]*?)<\/lastmod>/i);
    if (locMatch && modMatch) {
      mods[locMatch[1].trim()] = modMatch[1].trim();
    }
  }
  return mods;
}

// ── Checks ─────────────────────────────────────────────────────────────────

async function checkSitemap() {
  console.log("\n📋 Sitemap Validator\n");

  // 1. Fetch sitemap
  console.log("  ── Fetching sitemap.xml ──");
  const res = await httpFetch(`${BASE}/sitemap.xml`, 15000);
  if (res.status !== 200) {
    fail(FAIL, "HTTP", "/sitemap.xml", `Expected 200, got ${res.status}`);
    return null;
  }
  if (!res.text || res.text.length < 50) {
    fail(FAIL, "CONTENT", "/sitemap.xml", "Sitemap is too short or empty");
    return null;
  }
  log(PASS, "HTTP", "/sitemap.xml", `200 OK (${(res.text.length / 1024).toFixed(1)} KB)`);

  // 2. Validate XML structure
  console.log("\n  ── XML Validation ──");
  if (!res.text.includes('<?xml')) {
    fail(WARN, "XML", "/sitemap.xml", "Missing <?xml declaration");
  } else {
    log(PASS, "XML", "/sitemap.xml", "Has XML declaration");
  }

  if (!res.text.includes("<loc>")) {
    fail(FAIL, "XML", "/sitemap.xml", "No <loc> tags found — invalid sitemap");
    return null;
  }
  log(PASS, "XML", "/sitemap.xml", "Contains <loc> tags");

  // Detect sitemap index vs urlset
  const isIndex = res.text.includes("<sitemapindex");
  const type = isIndex ? "sitemap index" : "urlset";
  log(PASS, "TYPE", "/sitemap.xml", `Sitemap type: ${type}`);

  // Check encoding
  if (res.text.includes('encoding="UTF-8"') || res.text.includes('encoding="utf-8"')) {
    log(PASS, "ENCODING", "/sitemap.xml", "UTF-8 encoding declared");
  } else {
    fail(WARN, "ENCODING", "/sitemap.xml", "Missing or non-UTF-8 encoding declaration");
  }

  // 3. Parse URLs
  console.log("\n  ── URL Extraction ──");
  const urls = extractSitemapUrls(res.text);
  const lastmods = extractLastmods(res.text);
  stats.urlsTotal = urls.length;

  if (urls.length === 0) {
    fail(FAIL, "URLS", "/sitemap.xml", "No URLs found in sitemap");
    return null;
  }

  log(PASS, "COUNT", "", `${urls.length} URL${urls.length > 1 ? "s" : ""} found`);

  // 4. Validate individual URLs
  console.log("\n  ── URL Validation ──");

  // Check for duplicates
  const seen = new Set();
  const dups = [];
  for (const url of urls) {
    if (seen.has(url)) dups.push(url);
    seen.add(url);
  }
  if (dups.length > 0) {
    fail(WARN, "DUPLICATES", "", `${dups.length} duplicate URL${dups.length > 1 ? "s" : ""} in sitemap`);
    for (const dup of dups.slice(0, 5)) {
      log(WARN, "DUPLICATE", "", dup);
    }
  } else {
    log(PASS, "DUPLICATES", "", "No duplicate URLs");
  }

  // Check lastmod coverage
  const withLastmod = Object.keys(lastmods).length;
  const pct = urls.length > 0 ? Math.round((withLastmod / urls.length) * 100) : 0;
  if (pct < 50) {
    fail(WARN, "LASTMOD", "", `Only ${pct}% of URLs have <lastmod> tags (${withLastmod}/${urls.length})`);
  } else if (pct < 90) {
    fail(WARN, "LASTMOD", "", `${pct}% of URLs have <lastmod> (${withLastmod}/${urls.length}) — consider adding to all`);
  } else {
    log(PASS, "LASTMOD", "", `${pct}% of URLs have <lastmod> tags`);
  }

  // Check URL format validity
  let invalidUrls = 0;
  for (const url of urls) {
    try { new URL(url); } catch { invalidUrls++; }
  }
  if (invalidUrls > 0) {
    fail(FAIL, "FORMAT", "", `${invalidUrls} malformed URL${invalidUrls > 1 ? "s" : ""} in sitemap`);
  } else {
    log(PASS, "FORMAT", "", "All URLs are valid");
  }

  // Check protocol consistency
  const protos = new Set(urls.map(u => u.startsWith("https") ? "https" : "http"));
  if (protos.size > 1) {
    fail(WARN, "PROTOCOL", "", `Mixed protocols: ${[...protos].join(", ")}`);
  } else {
    log(PASS, "PROTOCOL", "", `All URLs use ${[...protos][0]}`);
  }

  // Check for NEXT_PUBLIC_SITE_URL consistency
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.splashdeals.rs";
  const siteHost = new URL(siteUrl).host;
  const wrongHost = urls.filter(u => {
    try { return new URL(u).host !== siteHost; } catch { return false; }
  });
  if (wrongHost.length > 0) {
    fail(WARN, "HOST", "", `${wrongHost.length} URL${wrongHost.length > 1 ? "s" : ""} don't match site host "${siteHost}"`);
    for (const w of wrongHost.slice(0, 3)) log(WARN, "HOST", "", w);
  } else {
    log(PASS, "HOST", "", `All URLs match site host "${siteHost}"`);
  }

  // 5. Crawl all URLs
  console.log("\n  ── Crawl Check ──");

  if (process.env.SITEMAP_SKIP_CRAWL === "true") {
    log(WARN, "CRAWL", "", "Skipped (SITEMAP_SKIP_CRAWL=true)");
    stats.skipped = urls.length;
    return urls;
  }

  // Limit crawl to keep CI fast — warn if too many pages
  const MAX_CRAWL = 200;
  const toCrawl = urls.slice(0, MAX_CRAWL);
  if (urls.length > MAX_CRAWL) {
    fail(WARN, "CRAWL", "", `Only crawling ${MAX_CRAWL}/${urls.length} URLs (too many for CI)`);
  }

  for (let i = 0; i < toCrawl.length; i++) {
    const url = toCrawl[i];
    const path = new URL(url).pathname;
    const crawlRes = await httpFetch(url, CRAWL_TIMEOUT_MS);
    stats.urlsCrawled++;

    if (crawlRes.status === 200) {
      stats.ok++;
      // Check for soft-404 (200 with noindex)
      if (crawlRes.text && crawlRes.text.includes('content="noindex')) {
        fail(WARN, "SOFT-404", path, `200 OK but has <meta noindex> — soft-404`);
      }
    } else if (crawlRes.status >= 300 && crawlRes.status < 400) {
      stats.redirect++;
      fail(WARN, "REDIRECT", path, `HTTP ${crawlRes.status} (redirect)`);
    } else if (crawlRes.status === 404) {
      stats.notFound++;
      fail(FAIL, "404", path, `Not found — page in sitemap returns 404`);
    } else if (crawlRes.status === 0) {
      stats.error++;
      fail(WARN, "TIMEOUT", path, `Request failed or timed out: ${crawlRes.error || "unknown"}`);
    } else {
      stats.error++;
      fail(WARN, "STATUS", path, `Unexpected status ${crawlRes.status}`);
    }

    // Progress every 20
    if ((i + 1) % 20 === 0) {
      console.log(`    ... ${i + 1}/${toCrawl.length} crawled`);
    }
  }

  console.log(`    ... ${toCrawl.length}/${toCrawl.length} crawled (done)`);
  return urls;
}

// ── Summary ────────────────────────────────────────────────────────────────

function printSummary() {
  console.log("\n  ── Summary ──");
  console.log(`    URLs in sitemap:    ${stats.urlsTotal}`);
  console.log(`    URLs crawled:       ${stats.urlsCrawled}`);
  console.log(`    ✅  200 OK:         ${stats.ok}`);
  console.log(`    🔀  Redirect:       ${stats.redirect}`);
  console.log(`    ❌  404 Not found:  ${stats.notFound}`);
  console.log(`    ⚠️   Error/timeout: ${stats.error}`);
  if (stats.skipped > 0) console.log(`    ⏭️  Skipped:         ${stats.skipped}`);

  console.log(`\n  Result:`);
  if (failures.length > 0) {
    console.log(`    ${FAIL} ${failures.length} failure${failures.length > 1 ? "s" : ""} found`);
    for (const f of failures) console.log(`      ${f.category}: ${f.path ? `${f.path} — ` : ""}${f.msg}`);
  }
  if (warnings.length > 0) {
    console.log(`    ${WARN} ${warnings.length} warning${warnings.length > 1 ? "s" : ""}`);
  }
  if (failures.length === 0 && warnings.length === 0) {
    console.log(`    ${PASS} All checks passed`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  let server;
  try {
    console.log("🚀 Starting Next.js production server...");
    server = await startServer();
    console.log("   Server ready\n");

    const urls = await checkSitemap();

    printSummary();

    const exitCode = failures.length > 0 ? 2 : 0;
    process.exit(exitCode);
  } catch (e) {
    console.error(`\n${FAIL} Fatal:`, e.message);
    process.exit(2);
  } finally {
    stopServer(server);
  }
}

main();
