/**
 * Cursor sessionStart hook: injects spec-driven context (stdout JSON) and logs session start
 * to .cursor/usage/sessions.ndjson (same stream as sessionEnd — see docs/CURSOR-USAGE.md).
 */
import fs from "node:fs";
import path from "node:path";
import { appendUsageRecord } from "./cursor-usage-append.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

const specRel = path.join("docs", "SPEC.md");

function payloadFromRaw(raw) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return { _parseError: true, _rawSnippet: trimmed.slice(0, 2000) };
  }
}

async function main() {
  const raw = await readStdin();

  appendUsageRecord({
    recordedAt: new Date().toISOString(),
    hook: "sessionStart",
    workspaceRoot: process.cwd(),
    payload: payloadFromRaw(raw),
  });

  const specPath = path.resolve(process.cwd(), specRel);
  let specNote = "";
  try {
    const st = fs.statSync(specPath);
    specNote = `Found ${specRel} (${st.size} bytes).`;
  } catch {
    specNote = `WARNING: ${specRel} missing at project root.`;
  }

  const additional_context = [
    "## FinancialPlanner",
    "This repo is **spec-driven**. Primary requirements: **docs/SPEC.md**; task checklist: **docs/TASKS.md**; orientation: **docs/OVERVIEW.md**.",
    "Agent guide: **AGENTS.md**; umbrella for new work: **sdd-create-feature** (then research → spec → implement → verify → …).",
    specNote,
  ].join("\n");

  process.stdout.write(JSON.stringify({ additional_context }));
}

main().catch(() => {
  process.stdout.write(
    JSON.stringify({
      additional_context:
        "FinancialPlanner: session hook failed to run; still read docs/SPEC.md manually.",
    }),
  );
});
