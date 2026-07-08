#!/usr/bin/env node
/**
 * Production smoke checks for SPEC §4.15 release notifications.
 * Fetches live version.json and sw.js from the deployed site.
 */
const baseUrl = (
  process.env.VERIFY_SITE_URL ?? "https://eswarkrishna.github.io/FinancialPlanner/"
).replace(/\/?$/, "/");

const checks = [
  { name: "index.html", url: `${baseUrl}`, expectJson: false },
  { name: "version.json", url: `${baseUrl}version.json`, expectJson: true },
  { name: "sw.js", url: `${baseUrl}sw.js`, expectJson: false },
];

const failures = [];

async function verifyEndpoint({ name, url, expectJson }) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      failures.push(`${name}: HTTP ${response.status} from ${url}`);
      return;
    }

    const body = await response.text();

    if (name === "version.json") {
      const manifest = JSON.parse(body);
      if (!manifest.sha || !manifest.short || !manifest.date) {
        failures.push("version.json: missing sha, short, or date fields");
      }
      return;
    }

    if (name === "sw.js") {
      if (body.includes(": string") || body.includes("Promise<")) {
        failures.push("sw.js: contains TypeScript syntax on production");
      }
      if (!body.includes("financial-planner-release")) {
        failures.push("sw.js: missing release notification tag");
      }
    }

    if (name === "index.html" && !body.includes('id="root"')) {
      failures.push("index.html: missing React root mount point");
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

if (failures.length > 0) {
  console.error(`Production verification failed for ${baseUrl}\n`);
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log(`Production verification passed for ${baseUrl}`);
