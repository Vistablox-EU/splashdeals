#!/usr/bin/env node
/**
 * 🔄 Circular Dependency Checker
 *
 * Detects circular imports between files in app/, server/, lib/, components/
 * using a DFS-based cycle detection algorithm.
 *
 * Usage: node scripts/check-circular.mjs
 * Exit code: 0 = clean, 2 = cycles found
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, resolve, relative, dirname } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const IGNORE_DIRS = new Set([
  "node_modules", ".next", "out", "build", ".git",
  "playwright-report", "scratch", "public", "__tests__",
]);

const srcDirs = ["app", "server", "lib", "components"];

let cycles = [];

// ─── Collect all .ts/.tsx files ─────────────────────────────────────────

function walk(dir, files = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath, files);
      else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
    }
  } catch { /* skip unreadable */ }
  return files;
}

// ─── Build reverse dependency map ───────────────────────────────────────

const fileImportPatterns = [
  // import { x } from "path"
  /from\s+['"]([^'"]+)['"]/g,
  // import "path"
  /^import\s+['"]([^'"]+)['"]/gm,
  // require("path")
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // dynamic import("path")
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function getImports(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const imports = [];

  // Skip node_modules references and non-relative imports
  for (const pattern of fileImportPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const specifier = match[1];
      // Only track relative imports (./ or ../) for cycle detection
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        imports.push(specifier);
      }
    }
  }
  return imports;
}

function resolveImport(fromFile, specifier) {
  const fromDir = dirname(fromFile);
  const resolved = resolve(fromDir, specifier);

  // Try .ts, .tsx, /index.ts, /index.tsx
  const extensions = ["", ".ts", ".tsx"];
  const indexVariants = ["/index.ts", "/index.tsx"];

  for (const ext of extensions) {
    const p = resolved + ext;
    if (existsSync(p)) return p;
  }

  if (existsSync(resolved) && statSync(resolved).isDirectory()) {
    for (const idx of indexVariants) {
      const p = resolved + idx;
      if (existsSync(p)) return p;
    }
  }

  return null;
}

// ─── DFS cycle detection ────────────────────────────────────────────────

function detectCycles(files, depMap) {
  const visited = new Set();
  const inStack = new Set();
  const pathStack = [];

  function dfs(file) {
    visited.add(file);
    inStack.add(file);
    pathStack.push(file);

    const deps = depMap.get(file) || [];
    for (const dep of deps) {
      if (!dep || dep === file) continue;
      if (!visited.has(dep)) {
        dfs(dep);
      } else if (inStack.has(dep)) {
        // Found a cycle — extract it from the path stack
        const cycleStart = pathStack.indexOf(dep);
        const cycle = pathStack.slice(cycleStart).concat(dep);
        cycles.push(cycle);
      }
    }

    pathStack.pop();
    inStack.delete(file);
  }

  for (const file of files) {
    if (!visited.has(file)) {
      dfs(file);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

console.log("🔄 Circular Dependency Checker\n");

// Collect files from source directories
let allFiles = [];
for (const dir of srcDirs) {
  const fullPath = join(ROOT, dir);
  if (existsSync(fullPath)) {
    walk(fullPath, allFiles);
  }
}

console.log(`📁 Scanned ${allFiles.length} source files\n`);

// Build dependency map
const depMap = new Map();
for (const file of allFiles) {
  const rel = relative(ROOT, file);
  const imports = getImports(file);
  const resolved = imports
    .map(spec => resolveImport(file, spec))
    .filter(p => p !== null && allFiles.includes(p));

  depMap.set(file, resolved);
  if (resolved.length > 0) {
    console.log(`  ${rel} → ${resolved.map(f => relative(ROOT, f)).join(", ")}`);
  }
}

// Detect cycles
detectCycles(allFiles, depMap);

if (cycles.length === 0) {
  console.log("\n✅ No circular dependencies found.");
  process.exit(0);
}

// Deduplicate cycles (same set of files, different entry points)
const seen = new Set();
const uniqueCycles = [];

for (const cycle of cycles) {
  const normalized = cycle.slice(0, -1).sort().join(" → ");
  if (!seen.has(normalized)) {
    seen.add(normalized);
    uniqueCycles.push(cycle);
  }
}

console.log(`\n❌ Found ${uniqueCycles.length} circular dependenc${uniqueCycles.length > 1 ? "ies" : "y"}:\n`);
for (const cycle of uniqueCycles) {
  console.log("  ⭕ Cycle:");
  for (const file of cycle) {
    console.log(`     ${relative(ROOT, file)}`);
  }
  console.log();
}

process.exit(2);
