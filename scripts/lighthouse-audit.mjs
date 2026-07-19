#!/usr/bin/env node
/**
 * Mobile Lighthouse performance audit (SEO Phase 10 / SPEC §8).
 *
 * Default target: production GitHub Pages. Override with LIGHTHOUSE_BASE_URL
 * (e.g. http://127.0.0.1:4173/FinancialPlanner/ after `npm run preview`).
 *
 * Samples home, debt, and budget routes. Retries once on Chrome/Lighthouse flake.
 *
 * Exit 1 when LCP ≥ 2500 ms or CLS ≥ 0.1 on any sampled route.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LCP_MAX_MS = 2500;
const CLS_MAX = 0.1;

/** Representative routes: home (loan), debt charts, budget forms. */
const ROUTE_SLUGS = ["", "debt", "budget"];
const MAX_ATTEMPTS = 2;

function normalizeBase(url) {
  return url.replace(/\/?$/, "/");
}

const baseUrl = normalizeBase(
  process.env.LIGHTHOUSE_BASE_URL ??
    process.env.VERIFY_SITE_URL ??
    "https://eswarkrishna.github.io/FinancialPlanner/",
);

function routeUrl(slug) {
  return slug ? `${baseUrl}${slug}/` : baseUrl;
}

function runLighthouse(url, attempt = 1) {
  const outDir = mkdtempSync(join(tmpdir(), "fp-lighthouse-"));
  const outFile = join(outDir, "report.json");
  const args = [
    "lighthouse",
    url,
    "--only-categories=performance",
    "--form-factor=mobile",
    "--screenEmulation.mobile=true",
    "--throttling-method=simulate",
    `--output-path=${outFile}`,
    "--output=json",
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
  ];

  const result = spawnSync("npx", ["--yes", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let report;
  try {
    report = JSON.parse(readFileSync(outFile, "utf8"));
  } catch (error) {
    rmSync(outDir, { recursive: true, force: true });
    if (attempt < MAX_ATTEMPTS) {
      return runLighthouse(url, attempt + 1);
    }
    console.error(`Lighthouse failed for ${url}`);
    if (result.stderr) console.error(result.stderr);
    if (result.stdout) console.error(result.stdout);
    process.exit(2);
  }

  rmSync(outDir, { recursive: true, force: true });

  if (result.status !== 0) {
    if (attempt < MAX_ATTEMPTS) {
      return runLighthouse(url, attempt + 1);
    }
    console.error(`Lighthouse exited ${result.status} for ${url}`);
    if (result.stderr) console.error(result.stderr);
    process.exit(2);
  }

  return report;
}

function readMetric(audits, ids) {
  for (const id of ids) {
    const audit = audits[id];
    if (audit?.numericValue != null) {
      return { id, value: audit.numericValue, display: audit.displayValue ?? String(audit.numericValue) };
    }
  }
  return null;
}

const failures = [];
const rows = [];

console.log(`Lighthouse mobile audit — base ${baseUrl}\n`);

for (const slug of ROUTE_SLUGS) {
  const url = routeUrl(slug);
  const label = slug || "loan (home)";
  const report = runLighthouse(url);
  const audits = report.audits ?? {};
  const lcp = readMetric(audits, ["largest-contentful-paint"]);
  const cls = readMetric(audits, ["cumulative-layout-shift"]);
  const inp = readMetric(audits, ["interaction-to-next-paint", "experimental-interaction-to-next-paint"]);
  const score = Math.round((report.categories?.performance?.score ?? 0) * 100);

  rows.push({ label, score, lcp, cls, inp });

  if (!lcp) {
    failures.push(`${label}: missing LCP metric`);
  } else if (lcp.value >= LCP_MAX_MS) {
    failures.push(`${label}: LCP ${lcp.display} (max ${LCP_MAX_MS} ms)`);
  }

  if (!cls) {
    failures.push(`${label}: missing CLS metric`);
  } else if (cls.value >= CLS_MAX) {
    failures.push(`${label}: CLS ${cls.display} (max ${CLS_MAX})`);
  }
}

for (const row of rows) {
  const inpText = row.inp ? row.inp.display : "n/a";
  console.log(
    `${row.label}: score ${row.score} | LCP ${row.lcp?.display ?? "?"} | CLS ${row.cls?.display ?? "?"} | INP ${inpText}`,
  );
}

if (failures.length > 0) {
  console.error("\nThreshold failures:");
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log(`\nAll ${rows.length} routes within LCP < ${LCP_MAX_MS} ms and CLS < ${CLS_MAX}.`);
