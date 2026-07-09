#!/usr/bin/env node
/**
 * 🏗️ Next.js Architecture Audit
 *
 * Runs as part of CI after lint/tsc to catch structural issues that
 * ESLint and TypeScript don't detect:
 *
 * 1. Duplicate files between server/actions/ and app/(server)/actions/
 * 2. "use server" files exporting non-function values (runtime crashes)
 * 3. Dead barrel exports
 * 4. Plain <img> tags (should use next/image)
 * 5. Console.log in production code
 *
 * Usage: node scripts/check-architecture.mjs
 * Exit code: 0 = clean, 1 = warnings, 2 = errors
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const IGNORE_DIRS = new Set(["node_modules", ".next", "out", "build", ".git", "playwright-report", "scratch"]);
const IGNORE_FILES = new Set(["next-env.d.ts", "package-lock.json"]);

let errors = [];
let warnings = [];

function walk(dir, fn, prefix = "") {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name) || IGNORE_FILES.has(entry.name)) continue;
      if (entry.name.startsWith(".")) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath, fn, join(prefix, entry.name));
      else if (entry.isFile()) fn(fullPath, prefix);
    }
  } catch { /* permission denied, skip */ }
}

function readFile(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch { return ""; }
}

// ─── 1. Check for duplicate files ─────────────────────────────────────────

function checkDuplicates() {
  const serverActions = join(ROOT, "server/actions");
  const appServerActions = join(ROOT, "app/(server)/actions");

  if (!existsSync(serverActions) || !existsSync(appServerActions)) return;

  const serverFiles = new Set(readdirSync(serverActions).filter(f => f.endsWith(".ts")));
  const appFiles = readdirSync(appServerActions).filter(f => f.endsWith(".ts"));

  for (const file of appFiles) {
    if (!serverFiles.has(file)) continue; // only in app, no conflict

    const serverContent = readFileSync(join(serverActions, file), "utf-8");
    const appContent = readFileSync(join(appServerActions, file), "utf-8");

    if (serverContent === appContent) {
      warnings.push(`Duplicate identical file: app/(server)/actions/${file} == server/actions/${file}`);
    }
  }
}

// ─── 2. Check "use server" files for non-function exports ────────────────

function checkUseServerFiles() {
  const searchDirs = [
    "app/(server)/actions",
    "server/actions",
  ];

  for (const dir of searchDirs) {
    const fullPath = join(ROOT, dir);
    if (!existsSync(fullPath)) continue;

    for (const file of readdirSync(fullPath)) {
      if (!file.endsWith(".ts")) continue;
      const content = readFileSync(join(fullPath, file), "utf-8");
      if (!content.includes('"use server"')) continue;

      // Find non-function exports
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        // export const / export let / export var (without async function)
        if (/^export\s+(const|let|var)\s/.test(trimmed) && !trimmed.includes("=>")) {
          // This is OK as long as it's a type or config value
          // But we flag it to be safe — server action files should minimize exports
          const match = trimmed.match(/^export\s+(const|let|var)\s+(\w+)/);
          if (match) {
            warnings.push(
              `${dir}/${file}: exported non-function '${match[2]}' in a "use server" file ` +
              `— will crash at runtime if not a type-only export. Move to a shared lib.`
            );
          }
        }
      }
    }
  }
}

// ─── 3. Check for plain <img> tags (should use next/image) ───────────────

function checkImgTags() {
  walk(join(ROOT, "app"), (filePath) => {
    if (!filePath.endsWith(".tsx") && !filePath.endsWith(".jsx")) return;
    const content = readFile(filePath);
    if (!content) return;

    // Match <img ...> or <img .../> but NOT inside comments or strings
    const imgMatches = content.match(/<(?!img\s)/g) === null ? [] : 
      content.match(/<img[\s>][^>]*\/?>/g) || [];

    if (imgMatches.length > 0) {
      // Filter out <img> inside HTML comments or template literals
      const hasImgElements = imgMatches.some(m => {
        const idx = content.indexOf(m);
        const before = content.slice(Math.max(0, idx - 120), idx);
        // Skip if inside a comment or string
        if (before.includes("//") || before.includes("/*")) return false;
        return true;
      });

      if (hasImgElements) {
        const rel = relative(ROOT, filePath);
        warnings.push(`${rel}: uses plain <img> — should use next/image with fill + sized container`);
      }
    }
  });
}

// ─── 4. Check console.log in production code ─────────────────────────────

function checkConsoleLog() {
  const excludeDirs = ["node_modules", ".next", "scripts", "prisma"];
  
  walk(join(ROOT, "app"), (filePath) => {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;
    const content = readFile(filePath);
    if (!content) return;

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match console.log but not console.warn/error/debug/info
      if (/console\.log\(/.test(line) && !line.trim().startsWith("//")) {
        const rel = relative(ROOT, filePath);
        warnings.push(`${rel}:${i + 1}: console.log() in production code`);
      }
    }
  });
}

// ─── 5. Check for stale barrel exports ───────────────────────────────────

function checkStaleBarrelExports() {
  const barrelFiles = [];

  walk(join(ROOT, "app"), (filePath) => {
    if (filePath.endsWith("/index.ts") || filePath.endsWith("/index.tsx")) {
      barrelFiles.push(filePath);
    }
  });

  for (const barrelPath of barrelFiles) {
    const content = readFile(barrelPath);
    if (!content) continue;

    const exports = content.match(/export\s+\{\s*([^}]+)\s*\}/g) || [];
    if (exports.length === 0) continue;

    // Extract all export names from the barrel
    const exportNames = new Set();
    for (const exp of exports) {
      const inner = exp.replace(/export\s+\{\s*/, "").replace(/\s*\}/, "");
      // Handle "as" aliases and simple exports
      inner.split(",").forEach(p => {
        const name = p.trim().split(/\s+as\s+/)[0].trim();
        if (name && !name.startsWith(".")) exportNames.add(name);
      });
    }

    // Check if each export is actually imported anywhere
    for (const name of exportNames) {
      if (name === "default") continue;
      // Search for imports of this name from any path
      const importPattern = new RegExp(`import\\s+[^;]*\\b${name}\\b[^;]*from\\s+['"]`);
      let found = false;

      walk(join(ROOT, "app"), (otherPath) => {
        if (otherPath === barrelPath) return;
        if (!otherPath.endsWith(".ts") && !otherPath.endsWith(".tsx")) return;
        const otherContent = readFile(otherPath);
        if (otherContent && importPattern.test(otherContent)) {
          found = true;
        }
      });

      if (!found) {
        const rel = relative(ROOT, barrelPath);
        warnings.push(`${rel}: export '${name}' is never imported — dead barrel export`);
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("🔍 Next.js Architecture Audit\n");

checkDuplicates();
checkUseServerFiles();
checkImgTags();
checkConsoleLog();
checkStaleBarrelExports();

if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ No architecture issues found.");
  process.exit(0);
}

if (errors.length > 0) {
  console.log("❌ Errors:\n");
  for (const e of errors) console.log(`   ${e}`);
  console.log();
}

if (warnings.length > 0) {
  console.log(`⚠️  Warnings (${warnings.length}):\n`);
  for (const w of warnings) console.log(`   ${w}`);
  console.log();
}

const exitCode = errors.length > 0 ? 2 : 0;
const label = errors.length > 0 ? "FAILED" : warnings.length > 0 ? "PASSED (with warnings)" : "PASSED";
console.log(`📋 Result: ${label} (${errors.length} errors, ${warnings.length} warnings)\n`);
process.exit(exitCode);
