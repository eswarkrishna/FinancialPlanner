/**
 * sessionStart: inject spec-driven context for US Equity Research agents.
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

async function main() {
  await readStdin();

  const specRel = path.join("docs", "SPEC.md");
  const specPath = path.resolve(process.cwd(), specRel);
  let specNote = "";
  try {
    const st = fs.statSync(specPath);
    specNote = `Found ${specRel} (${st.size} bytes).`;
  } catch {
    specNote = `WARNING: ${specRel} missing at project root.`;
  }

  const additional_context = [
    "## US Equity Research",
    "Spec-driven Python repo for US stock data, alerts, backtesting, and Streamlit dashboard.",
    "Primary requirements: **docs/SPEC.md**; tasks: **docs/TASKS.md**; orientation: **docs/OVERVIEW.md**.",
    "Agent guide: **AGENTS.md**; new features: **equity-create-feature** skill.",
    "Run Python with `PYTHONPATH=.` from repo root.",
    specNote,
  ].join("\n");

  process.stdout.write(JSON.stringify({ additional_context }));
}

main().catch(() => {
  process.stdout.write(
    JSON.stringify({
      additional_context:
        "US Equity Research: session hook failed; read docs/SPEC.md manually.",
    }),
  );
});
