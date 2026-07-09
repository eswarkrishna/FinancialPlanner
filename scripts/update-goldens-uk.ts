import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeUkGoldenScenarios } from "../src/test/fixtures/goldens-uk/buildGoldensUk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldensUkDir = path.resolve(__dirname, "../src/test/fixtures/goldens-uk");

async function main() {
  const scenarios = computeUkGoldenScenarios();
  await mkdir(goldensUkDir, { recursive: true });
  for (const [name, payload] of Object.entries(scenarios)) {
    const filePath = path.join(goldensUkDir, `${name}.json`);
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`Updated ${Object.keys(scenarios).length} UK loan golden fixtures.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to update UK golden fixtures: ${String(error)}\n`);
  process.exitCode = 1;
});
