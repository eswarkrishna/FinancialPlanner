/**
 * Post-build SEO sign-off checks (SPEC §10.52–55, TASKS-SEO Phase 12).
 * Run: npm run verify:seo (after build)
 */
import fs from "node:fs";
import path from "node:path";
import {
  pageTitle,
  PLANNER_TABS,
  TAB_PATH_SLUG,
  type TabId,
} from "../src/lib/seo.ts";

const distDir = path.resolve("dist");
const failures: string[] = [];

function shellPath(tabId: TabId): string {
  const slug = TAB_PATH_SLUG[tabId];
  return slug ? path.join(distDir, slug, "index.html") : path.join(distDir, "index.html");
}

function readTitle(html: string): string | null {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (!match?.[1]) return null;
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function hasJsonLdWebApplication(html: string): boolean {
  return (
    html.includes('id="seo-structured-data"') &&
    (html.includes('"@type":"WebApplication"') || html.includes('"@type": "WebApplication"'))
  );
}

for (const tab of PLANNER_TABS) {
  const filePath = shellPath(tab.id);
  const label = path.relative(process.cwd(), filePath);

  if (!fs.existsSync(filePath)) {
    failures.push(`${label}: missing HTML shell`);
    continue;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const title = readTitle(html);
  const expectedTitle = pageTitle(tab.id);

  if (title !== expectedTitle) {
    failures.push(`${label}: title "${title ?? ""}" !== "${expectedTitle}"`);
  }

  if (!html.includes("<noscript>")) {
    failures.push(`${label}: missing <noscript> fallback`);
  }

  if (!hasJsonLdWebApplication(html)) {
    failures.push(`${label}: missing WebApplication JSON-LD in shell`);
  }

  if (tab.id !== "loan" && !html.includes("BreadcrumbList")) {
    failures.push(`${label}: missing BreadcrumbList JSON-LD for sub-tab shell`);
  }

  if (tab.id === "loan" && html.includes("BreadcrumbList")) {
    failures.push(`${label}: loan shell should not include BreadcrumbList JSON-LD`);
  }
}

if (failures.length > 0) {
  console.error("SEO sign-off verification failed:\n");
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log(`SEO sign-off verification passed (${PLANNER_TABS.length} HTML shells).`);
