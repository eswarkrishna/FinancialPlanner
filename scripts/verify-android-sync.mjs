#!/usr/bin/env node
/** docs/SPEC.md §5.2 / §10.40 — verify Capacitor sync copied the web bundle into Android assets. */

import fs from "node:fs";
import path from "node:path";

const indexHtml = path.resolve(
  "android/app/src/main/assets/public/index.html",
);

if (!fs.existsSync(indexHtml)) {
  console.error("Missing synced web bundle:", indexHtml);
  console.error("Run: npm run cap:sync");
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, "utf8");
if (!html.includes('id="root"')) {
  console.error("Synced index.html does not look like the SPA shell.");
  process.exit(1);
}

const assetsDir = path.dirname(indexHtml);
const entries = fs.readdirSync(assetsDir, { recursive: true });
const hasJsBundle = entries.some(
  (name) => typeof name === "string" && name.includes("assets/") && name.endsWith(".js"),
);

if (!hasJsBundle) {
  console.error("No bundled JS found under", assetsDir);
  process.exit(1);
}

console.log("Android Capacitor sync artifacts OK:", indexHtml);
