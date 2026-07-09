import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeUkGoldenScenarios } from "../src/test/fixtures/goldens-uk/buildGoldensUk";
import { computeStrategyGoldensUk } from "../src/test/fixtures/strategy-uk/buildStrategyGoldensUk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldensUkDir = path.resolve(__dirname, "../src/test/fixtures/goldens-uk");
const strategyUkDir = path.resolve(__dirname, "../src/test/fixtures/strategy-uk");

async function writeJsonFiles(
  dir: string,
  map: Record<string, unknown>,
): Promise<number> {
  await mkdir(dir, { recursive: true });
  for (const [name, payload] of Object.entries(map)) {
    const filePath = path.join(dir, `${name}.json`);
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
  return Object.keys(map).length;
}

async function main() {
  const loanCount = await writeJsonFiles(goldensUkDir, computeUkGoldenScenarios());
  const strategyCount = await writeJsonFiles(strategyUkDir, computeStrategyGoldensUk());
  process.stdout.write(
    `Updated ${loanCount} UK loan + ${strategyCount} UK strategy golden fixtures.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to update UK golden fixtures: ${String(error)}\n`);
  process.exitCode = 1;
});
