#!/usr/bin/env node
/**
 * Post-build verification for SPEC §4.15 release notifications.
 * Ensures deploy artifacts required for version checks are present and valid.
 */
import fs from "node:fs";
import path from "node:path";
import {
  reportFailures,
  validateIndexHtml,
  validateServiceWorkerSource,
  validateVersionManifest,
} from "./verify-release-artifacts.mjs";

const distDir = path.resolve("dist");
const versionPath = path.join(distDir, "version.json");
const swPath = path.join(distDir, "sw.js");
const indexPath = path.join(distDir, "index.html");

const failures = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    failures.push(
      `${filePath}: invalid JSON (${error instanceof Error ? error.message : error})`,
    );
    return null;
  }
}

if (!fs.existsSync(distDir)) {
  failures.push("dist/ directory missing — run npm run build first");
} else {
  if (!fs.existsSync(versionPath)) {
    failures.push("dist/version.json missing");
  } else {
    const manifest = readJson(versionPath);
    if (manifest) {
      failures.push(...validateVersionManifest(manifest, "dist/version.json"));
    }
  }

  if (!fs.existsSync(swPath)) {
    failures.push("dist/sw.js missing");
  } else {
    const swSource = fs.readFileSync(swPath, "utf8");
    failures.push(...validateServiceWorkerSource(swSource, "dist/sw.js"));
  }

  if (!fs.existsSync(indexPath)) {
    failures.push("dist/index.html missing");
  } else {
    const html = fs.readFileSync(indexPath, "utf8");
    failures.push(...validateIndexHtml(html, "dist/index.html"));
  }
}

reportFailures(failures, "Release notification deploy verification failed:");

const manifest = readJson(versionPath);
console.log("Release notification deploy verification passed.");
console.log(`  version.json sha: ${manifest?.short ?? "(unknown)"}`);
console.log(`  service worker: ${path.relative(process.cwd(), swPath)}`);
