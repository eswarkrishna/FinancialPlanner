/**
 * Cursor sessionStart hook: injects spec-driven context (Cursor docs — sessionStart stdout JSON).
 * Project root is cwd for project hooks.
 */
import fs from "node:fs";
import path from "node:path";

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

async function main() {
  await readStdin();
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
    "This repo is **spec-driven**. Primary requirements: **docs/SPEC.md**.",
    "Agent guide: **AGENTS.md**.",
    "SDD skills under **.cursor/skills/**: `spec-driven-financial-planner` (domain/UI), `sdd-spec-change-first` (edit SPEC before code), `sdd-verify-with-tests` (Vitest §10 goldens), `sdd-commit-and-review` (commits/PRs).",
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
