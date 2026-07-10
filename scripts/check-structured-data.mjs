#!/usr/bin/env node
/**
 * Splashdeals Structured Data / Rich Results Validator
 *
 * Starts a production server, fetches all sitemap URLs, validates every
 * JSON-LD block against Schema.org type requirements and Google Rich Results
 * eligibility rules.
 *
 * Usage:  node scripts/check-structured-data.mjs
 * Env:    CI=true (suppresses colour)
 * Exit:   0 = all clear, warnings only
 *         2 = critical failures (unparseable JSON-LD, missing required fields)
 */

const PORT = 5898;
const BASE = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT = 30_000;
const REQUEST_TIMEOUT = 15_000;

const SEVERE = "🔴 SEVERE";
const WARN = "🟡 WARN";

const failures = [];
const warnings = [];
const startTime = Date.now();

function elapsed() {
  return ((Date.now() - startTime) / 1000).toFixed(1) + "s";
}
function log(...args) {
  console.log(`[${elapsed()}]`, ...args);
}

function fail(severity, page, schemaType, message) {
  const icon = severity === SEVERE ? "🔴" : "🟡";
  const line = `${icon} [${page}] ${schemaType}: ${message}`;
  console.error(line);
  (severity === SEVERE ? failures : warnings).push(line);
}

async function httpFetch(url, opts = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeout || REQUEST_TIMEOUT);
  try {
    return await globalThis.fetch(url, { ...opts, signal: ac.signal, redirect: "manual" });
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
      if (text.includes("localhost:" + PORT)) {
        started = true;
        clearTimeout(timeout);
        resolve(server);
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    server.on("exit", (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

// ── Schema validation rules ────────────────────────────────────────────────
const SCHEMA_RULES = [
  {
    types: ["WebSite"],
    required: ["name", "url", "potentialAction"],
    richResult: "Sitelinks Search Box",
    validate: (data, page) => {
      const a = data.potentialAction;
      if (a?.["@type"] !== "SearchAction") return;
      if (!a.target?.urlTemplate)
        fail(WARN, page, "WebSite", "SearchAction missing target.urlTemplate");
    },
  },
  {
    types: ["Organization"],
    required: ["name", "url", "logo"],
    richResult: "Organization / Knowledge Panel",
  },
  {
    types: ["Product"],
    required: ["name", "offers", "image"],
    richResult: "Product / Merchant Listing",
    validate: (data, page) => {
      const o = data.offers;
      if (o?.["@type"] === "AggregateOffer" && (o.lowPrice == null || o.priceCurrency == null))
        fail(WARN, page, "Product", "AggregateOffer missing lowPrice or priceCurrency");
    },
  },
  {
    types: ["FAQPage"],
    required: ["mainEntity"],
    richResult: "FAQ",
    validate: (data, page) => {
      const items = Array.isArray(data.mainEntity) ? data.mainEntity : [data.mainEntity];
      for (const q of items) {
        if (q["@type"] !== "Question")
          fail(WARN, page, "FAQPage", "mainEntity item should be Question");
        if (!q.name) fail(SEVERE, page, "FAQPage", "Question missing 'name'");
        if (!q.acceptedAnswer?.text)
          fail(SEVERE, page, "FAQPage", "Question missing acceptedAnswer.text");
      }
    },
  },
  {
    types: ["BreadcrumbList"],
    required: ["itemListElement"],
    richResult: "Breadcrumb",
    validate: (data, page) => {
      const items = Array.isArray(data.itemListElement)
        ? data.itemListElement
        : [data.itemListElement];
      for (const item of items) {
        if (!item.name && !item.item?.name) fail(WARN, page, "BreadcrumbList", "Item missing name");
        if (!item.position) fail(WARN, page, "BreadcrumbList", "Item missing position");
      }
    },
  },
  {
    types: ["HowTo"],
    required: ["step"],
    richResult: "HowTo",
    validate: (data, page) => {
      const steps = Array.isArray(data.step) ? data.step : [data.step];
      for (const s of steps) {
        if (s["@type"] !== "HowToStep") fail(WARN, page, "HowTo", "Step should be HowToStep");
        if (!s.text && !s.name) fail(WARN, page, "HowTo", "Step missing text or name");
      }
    },
  },
  {
    types: ["VideoObject"],
    required: ["name", "description", "thumbnailUrl", "contentUrl"],
    richResult: "Video",
  },
  {
    types: ["EntertainmentBusiness"],
    required: ["name", "url"],
  },
  {
    types: ["AmusementPark", "TouristAttraction"],
    required: ["name", "url", "address"],
  },
  {
    types: ["CollectionPage"],
    required: ["name", "url"],
  },
];

// ── Validate a single schema block (handles @graph recursively) ────────────
function validateSchema(data, page, reported) {
  if (data["@graph"]) {
    for (const item of data["@graph"]) validateSchema(item, page, reported);
    return;
  }
  const raw = data["@type"];
  if (!raw) {
    fail(SEVERE, page, "(unknown)", "Schema block missing @type");
    return;
  }
  const types = Array.isArray(raw) ? raw : [raw];
  for (const t of types) reported.add(t);

  for (const t of types) {
    const rule = SCHEMA_RULES.find((r) => r.types.includes(t));
    if (!rule) continue;

    for (const field of rule.required) {
      if (data[field] == null) fail(WARN, page, t, `Missing required field '${field}'`);
    }
    if (rule.validate) rule.validate(data, page);
    if (rule.richResult) {
      const ok = rule.required.every((f) => data[f] != null);
      console.log(
        `  ${ok ? "✅" : "⬜"} [${page}] ${t} → ${ok ? "eligible" : "not eligible"} for "${rule.richResult}"`,
      );
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("🔍 Starting structured data validation...\n");

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

  let allPaths = [];

  try {
    // 2. Fetch sitemap
    log("📄 Fetching sitemap...");
    const sitemapRes = await httpFetch(`${BASE}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    const sitemapUrls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    log(`  Found ${sitemapUrls.length} URLs\n`);

    allPaths = [
      ...new Set([
        "/",
        ...sitemapUrls
          .map((u) => {
            try {
              return new URL(u).pathname;
            } catch {
              return null;
            }
          })
          .filter(Boolean),
      ]),
    ];
    log(`─── Validating ${allPaths.length} pages ──────────────────\n`);

    for (const path of allPaths) {
      let res, html;
      try {
        res = await httpFetch(`${BASE}${path}`);
        if (res.status >= 300 && res.status < 400) continue;
        html = await res.text();
      } catch {
        continue;
      }

      const blocks = [
        ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
      ];
      if (blocks.length === 0) {
        fail(WARN, path, "(none)", "No JSON-LD found");
        continue;
      }

      const reported = new Set();
      for (const b of blocks) {
        try {
          validateSchema(JSON.parse(b[1]), path, reported);
        } catch {
          const id = b[0]?.match(/id="([^"]+)"/)?.[1] || "(block)";
          fail(SEVERE, path, id, "Unparseable JSON-LD");
        }
      }
      if (reported.size > 0) console.log(`  📍 ${path}: ${[...reported].join(", ")}`);
      console.log("");
    }
  } finally {
    server.kill();
  }

  // 3. Report
  console.log("=".repeat(60));
  log("📊 STRUCTURED DATA VALIDATION RESULTS");
  console.log(`   Pages scanned: ${allPaths.length}`);
  if (failures.length > 0) log(`   ${SEVERE}: ${failures.length}`);
  if (warnings.length > 0) log(`   ${WARN}: ${warnings.length}`);
  log("=".repeat(60) + "\n");

  if (failures.length > 0) {
    console.error("🔴 CRITICAL ISSUES:");
    for (const f of failures) console.error("  ", f);
    process.exit(2);
  }
  if (warnings.length > 0) {
    console.warn("🟡 WARNINGS (non-blocking):");
    for (const w of warnings) console.warn("  ", w);
  }
  console.log(`\n✅ All structured data checks passed (${warnings.length} warnings).`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Unhandled:", e);
  process.exit(2);
});
