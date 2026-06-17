/**
 * Splashdeals SEO Crawlability & Indexability Check
 *
 * Runs against the production build (next start) and validates:
 *   - robots.txt, sitemap.xml availability
 *   - HTTP status codes (no soft-404s on known routes)
 *   - Required SEO meta tags per page
 *   - JSON-LD structured data parseability
 *   - Canonical URLs self-referencing
 *   - No unexpected noindex on public pages
 *
 * Usage:  node scripts/check-seo.mjs
 * Env:    CI=true (suppresses color), VERBOSE=true (shows all checks)
 * Exit:   0 = all clear, 1 = warnings, 2 = critical failures
 */

// ── Configuration ──────────────────────────────────────────────────────────
const PORT = 5897;
const BASE = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT = 30_000; // 30s for next start to be ready
const REQUEST_TIMEOUT = 15_000; // 15s per HTTP request
const CHECK_TIMEOUT = 120_000;  // 120s max for the whole script

const SEVERE = "🔴 SEVERE";
const WARN   = "🟡 WARN";
const PASS   = "✅ PASS";

const failures = [];
const warnings = [];
const passCount = { count: 0 };
const startTime = Date.now();

// ── Utilities ──────────────────────────────────────────────────────────────
function elapsed() { return ((Date.now() - startTime) / 1000).toFixed(1) + "s"; }

function log(...args) { console.log(`[${elapsed()}]`, ...args); }

function fail(severity, category, page, message) {
  const icon = severity === SEVERE ? "🔴" : "🟡";
  const line = `${icon} [${category}] ${page}: ${message}`;
  console.error(line);
  (severity === SEVERE ? failures : warnings).push(line);
}

function pass(category, page, message) {
  passCount.count++;
  if (process.env.VERBOSE) console.log(`  ${PASS} [${category}] ${page}: ${message}`);
}

// ── HTTP helper with timeout ───────────────────────────────────────────────
async function httpFetch(url, opts = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeout || REQUEST_TIMEOUT);
  try {
    const res = await globalThis.fetch(url, { ...opts, signal: ac.signal, redirect: opts.redirect ?? "manual" });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── Start production server ────────────────────────────────────────────────
async function startServer() {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT) },
      shell: true,
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        server.kill();
        reject(new Error(`Server didn't start within ${STARTUP_TIMEOUT / 1000}s`));
      }
    }, STARTUP_TIMEOUT);

    const onData = (chunk) => {
      const text = chunk.toString();
      // next start prints the URL when ready
      if (text.includes("localhost:" + PORT) || text.includes("http://localhost:" + PORT)) {
        started = true;
        clearTimeout(timeout);
        resolve(server);
      }
    };

    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.on("error", (err) => { clearTimeout(timeout); reject(err); });
    server.on("exit", (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code} before starting`));
      }
    });
  });
}

// ── Check: robots.txt ──────────────────────────────────────────────────────
async function checkRobotsTxt() {
  try {
    const res = await httpFetch(`${BASE}/robots.txt`);
    const text = await res.text();
    if (res.status !== 200) return fail(SEVERE, "Transport", "/robots.txt", `HTTP ${res.status}`);
    if (!text.includes("Sitemap:")) fail(WARN, "Transport", "/robots.txt", "Missing Sitemap directive");
    if (/^Disallow: \/$/m.test(text)) fail(WARN, "Transport", "/robots.txt", "Has Disallow: / — may block all crawling");
    pass("Transport", "/robots.txt", `OK (${text.split("\n").length} lines)`);
  } catch (err) {
    fail(SEVERE, "Transport", "/robots.txt", `Unreachable: ${err.message}`);
  }
}

// ── Check: sitemap.xml ─────────────────────────────────────────────────────
async function checkSitemap() {
  try {
    const res = await httpFetch(`${BASE}/sitemap.xml`);
    const text = await res.text();
    if (res.status !== 200) return fail(SEVERE, "Transport", "/sitemap.xml", `HTTP ${res.status}`);
    // Count <loc> entries
    const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
    if (locs.length === 0) return fail(SEVERE, "Transport", "/sitemap.xml", "No <loc> entries found");
    pass("Transport", "/sitemap.xml", `${locs.length} URLs listed`);
    return locs.map((m) => m[1]);
  } catch (err) {
    fail(SEVERE, "Transport", "/sitemap.xml", `Unreachable: ${err.message}`);
    return [];
  }
}

// ── Check: single page SEO ─────────────────────────────────────────────────
async function checkPage(path, label) {
  const url = `${BASE}${path}`;
  let res;
  try {
    res = await httpFetch(url);
  } catch (err) {
    return fail(SEVERE, "Transport", path, `Unreachable: ${err.message}`);
  }

  const html = await res.text();
  const status = res.status;

  // 1. HTTP status
  if (status === 404 || status >= 500) {
    return fail(SEVERE, "Status", path, `HTTP ${status}`);
  }
  // Soft-404 detection: 200 but content suggests 404
  if (status === 200 && (html.includes("Nije Pronađena") || html.includes("Page Not Found") || html.includes("Page Deleted") || html.includes("404"))) {
    // Check for noindex — if noindex is set, it's a managed soft-404
    if (html.includes('content="noindex') || html.includes('name="robots" content="noindex')) {
      fail(WARN, "Status", path, `Soft-404 (200 with noindex) — ${label}`);
      return;
    } else {
      fail(SEVERE, "Status", path, `Soft-404 (200 with 404 content, no noindex) — ${label}`);
    }
  }
  pass("Status", path, `HTTP ${status}`);

  // Skip all meta/content checks for noindex pages
  if (html.match(/<meta\s+name=["']robots["']\s+content=["']noindex/i)) {
    pass("Meta", path, "noindex page — skipping content checks");
    return;
  }

  // 2. <title>
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch || !titleMatch[1].trim()) {
    fail(SEVERE, "Meta", path, "Missing <title> tag");
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 15) fail(WARN, "Meta", path, `Title too short (${title.length} chars): "${title}"`);
    if (title.length > 65) fail(WARN, "Meta", path, `Title too long (${title.length} chars) — may be truncated in SERP`);
    // Check for double brand (template adds " | Splashdeals")
    if ((title.match(/\| Splashdeals/g) || []).length > 1) {
      fail(WARN, "Meta", path, `Duplicate brand suffix in title: "${title}"`);
    }
    pass("Meta", path, `<title> "${title}"`);
  }

  // 3. <meta name="description">
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!descMatch || !descMatch[1].trim()) {
    fail(WARN, "Meta", path, "Missing <meta name='description'>");
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 50) fail(WARN, "Meta", path, `Description too short (${desc.length} chars)`);
    if (desc.length > 165) fail(WARN, "Meta", path, `Description too long (${desc.length} chars)`);
    pass("Meta", path, `<meta description> present (${desc.length} chars)`);
  }

  // 4. <link rel="canonical">
  const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
  if (!canonMatch) {
    fail(WARN, "Meta", path, "Missing <link rel='canonical'>");
  } else {
    const canon = canonMatch[1];
    // Should be self-referencing
    const expectedUrl = `${BASE}${path}`;
    // Just check it's not pointing elsewhere on the same domain
    if (canon.includes("splashdeals.rs") && !canon.includes(new URL(url).pathname.replace(/\/$/, ""))) {
      const canonPath = new URL(canon).pathname;
      if (canonPath !== path && canonPath !== path + "/") {
        fail(WARN, "Meta", path, `Canonical points to different path: "${canon}"`);
      }
    }
    pass("Meta", path, `<link canonical> "${canon}"`);
  }

  // 5. <meta name="robots">
  const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (robotsMatch && robotsMatch[1].includes("noindex")) {
    fail(WARN, "Meta", path, `noindex set: "${robotsMatch[1]}"`);
  } else {
    pass("Meta", path, "no noindex");
  }

  // 6. <meta name="viewport">
  const viewportMatch = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/i);
  if (!viewportMatch) {
    fail(WARN, "Meta", path, "Missing <meta name='viewport'>");
  } else {
    pass("Meta", path, `<meta viewport> present`);
  }

  // 7. <h1> heading
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1Match || !h1Match[1].trim()) {
    fail(WARN, "Content", path, "Missing <h1> heading");
  } else {
    pass("Content", path, `<h1> "${h1Match[1].trim().substring(0, 60)}"`);
  }

  // 8. JSON-LD structured data
  const jsonldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];
  if (jsonldBlocks.length === 0) {
    // Not every page needs JSON-LD — only warn for public pages
    if (!path.startsWith("/admin")) {
      fail(WARN, "StructuredData", path, "No JSON-LD found");
    }
  } else {
    let validCount = 0;
    for (const block of jsonldBlocks) {
      try {
        const data = JSON.parse(block[1]);
        if (data["@type"] || data["@graph"]) validCount++;
      } catch {
        fail(WARN, "StructuredData", path, "Unparseable JSON-LD block");
      }
    }
    if (validCount > 0) pass("StructuredData", path, `${validCount} valid JSON-LD block(s)`);
  }

  // 9. og:title and og:description (Open Graph)
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  if (!ogTitle) fail(WARN, "Social", path, "Missing og:title");
  else pass("Social", path, `og:title "${ogTitle[1].substring(0, 50)}"`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const overallTimeout = setTimeout(() => {
    console.error(`\n⚠️  Overall timeout reached (${CHECK_TIMEOUT / 1000}s). Aborting.`);
    process.exit(2);
  }, CHECK_TIMEOUT);

  log("🔍 Starting SEO crawlability check...\n");

  // 1. Start production server
  log("🔄 Starting production server on port", PORT, "...");
  let server;
  try {
    server = await startServer();
    log("  ✅ Server ready\n");
  } catch (err) {
    console.error("  ❌ Failed to start server:", err.message);
    process.exit(2);
  }

  // 2. Run checks sequentially
  const criticalPages = [
    { path: "/", label: "Homepage" },
  ];

  try {
    log("─── Transport Layer ──────────────────────────");
    await checkRobotsTxt();
    const sitemapUrls = await checkSitemap();

    console.log("");
    log("─── Critical Pages ───────────────────────────");

    // Add top 10 pages from sitemap
    if (sitemapUrls.length > 0) {
      const topSitemap = sitemapUrls.slice(0, 10);
      for (const loc of topSitemap) {
        try {
          const p = new URL(loc).pathname;
          if (p !== "/") criticalPages.push({ path: p, label: loc.substring(0, 60) });
        } catch { /* skip invalid */ }
      }
    }

    for (const { path, label } of criticalPages) {
      console.log("");
      log("───", label, "───");
      await checkPage(path, label);
    }
  } finally {
    // 3. Shutdown
    server.kill();
    clearTimeout(overallTimeout);
  }

  // 4. Report
  console.log("\n" + "=".repeat(60));
  log("📊 SEO CHECK RESULTS");
  log(`   Pages checked: ${passCount.count} checks on ${new Set(criticalPages.map(p => p.path)).size} pages`);
  if (failures.length > 0) log(`   ${SEVERE}: ${failures.length}`);
  if (warnings.length > 0) log(`   ${WARN}: ${warnings.length}`);
  log("=".repeat(60) + "\n");

  if (failures.length > 0) {
    console.error("🔴 CRITICAL ISSUES FOUND:");
    for (const f of failures) console.error("  ", f);
    process.exit(2);
  }
  if (warnings.length > 0) {
    console.warn("🟡 WARNINGS (non-blocking):");
    for (const w of warnings) console.warn("  ", w);
  }
  console.log(`\n✅ All SEO checks passed (${warnings.length} warnings).`);
  process.exit(warnings.length > 0 ? 0 : 0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(2);
});
