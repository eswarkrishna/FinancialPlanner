#!/usr/bin/env node
/**
 * Post-build verification for SPEC §4.15 release notifications.
 * Ensures deploy artifacts required for version checks are present and valid.
 */
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const versionPath = path.join(distDir, "version.json");
const swPath = path.join(distDir, "sw.js");
const indexPath = path.join(distDir, "index.html");

const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath}: invalid JSON (${error instanceof Error ? error.message : error})`);
    return null;
  }
}

if (!fs.existsSync(distDir)) {
  fail("dist/ directory missing — run npm run build first");
} else {
  if (!fs.existsSync(versionPath)) {
    fail("dist/version.json missing");
  } else {
    const manifest = readJson(versionPath);
    if (manifest) {
      if (typeof manifest.sha !== "string" || manifest.sha.length < 7) {
        fail("dist/version.json: sha must be a non-empty git commit id");
      }
      if (typeof manifest.short !== "string" || manifest.short.length < 7) {
        fail("dist/version.json: short must be a non-empty short commit id");
      }
      if (typeof manifest.date !== "string" || Number.isNaN(Date.parse(manifest.date))) {
        fail("dist/version.json: date must be a parseable ISO timestamp");
      }
    }
  }

  if (!fs.existsSync(swPath)) {
    fail("dist/sw.js missing");
  } else {
    const swSource = fs.readFileSync(swPath, "utf8");
    if (/:\s*(string|number|boolean|void|Promise<)/.test(swSource)) {
      fail("dist/sw.js contains TypeScript syntax — must be plain JavaScript");
    }
    if (!swSource.includes("CHECK_VERSION")) {
      fail("dist/sw.js must handle CHECK_VERSION messages");
    }
    if (!swSource.includes("notificationclick")) {
      fail("dist/sw.js must handle notificationclick events");
    }
  }

  if (!fs.existsSync(indexPath)) {
    fail("dist/index.html missing");
  }
}

if (failures.length > 0) {
  console.error("Release notification deploy verification failed:\n");
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log("Release notification deploy verification passed.");
console.log(`  version.json sha: ${readJson(versionPath)?.short ?? "(unknown)"}`);
console.log(`  service worker: ${path.relative(process.cwd(), swPath)}`);
