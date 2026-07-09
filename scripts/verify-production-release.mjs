#!/usr/bin/env node
/**
 * Production smoke checks for SPEC §4.15 release notifications.
 * Fetches live version.json and sw.js from the deployed site.
 */
import {
  reportFailures,
  validateIndexHtml,
  validateServiceWorkerSource,
  validateVersionManifest,
} from "./verify-release-artifacts.mjs";

const baseUrl = (
  process.env.VERIFY_SITE_URL ?? "https://eswarkrishna.github.io/FinancialPlanner/"
).replace(/\/?$/, "/");

const checks = [
  { name: "index.html", url: `${baseUrl}` },
  { name: "version.json", url: `${baseUrl}version.json` },
  { name: "sw.js", url: `${baseUrl}sw.js` },
];

const failures = [];

async function verifyEndpoint({ name, url }) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      failures.push(`${name}: HTTP ${response.status} from ${url}`);
      return;
    }

    const body = await response.text();

    if (name === "version.json") {
      failures.push(...validateVersionManifest(JSON.parse(body), name));
      return;
    }

    if (name === "sw.js") {
      failures.push(...validateServiceWorkerSource(body, name));
      return;
    }

    if (name === "index.html") {
      failures.push(...validateIndexHtml(body, name));
    }
  } catch (error) {
    failures.push(
      `${name}: ${error instanceof Error ? error.message : String(error)} (${url})`,
    );
  }
}

for (const check of checks) {
  await verifyEndpoint(check);
}

reportFailures(failures, `Production verification failed for ${baseUrl}`);
console.log(`Production verification passed for ${baseUrl}`);
