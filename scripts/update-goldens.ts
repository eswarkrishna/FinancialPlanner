import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeGoldenScenarios } from "../src/test/fixtures/goldens/buildGoldens";
import { computeGameGoldens } from "../src/test/fixtures/goldens/buildGameGoldens";
import { computeStrategyGoldens } from "../src/test/fixtures/goldens/buildStrategyGoldens";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldensDir = path.resolve(__dirname, "../src/test/fixtures/goldens");
const strategyDir = path.resolve(__dirname, "../src/test/fixtures/strategy");
const gameDir = path.resolve(__dirname, "../src/test/fixtures/game");

async function writeJsonFiles(
  dir: string,
  payloadByName: Record<string, unknown>,
): Promise<number> {
  await mkdir(dir, { recursive: true });
  await Promise.all(
    Object.entries(payloadByName).map(async ([name, payload]) => {
      const filePath = path.join(dir, `${name}.json`);
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    }),
  );
  return Object.keys(payloadByName).length;
}

async function main() {
  const loanCount = await writeJsonFiles(goldensDir, computeGoldenScenarios());
  const strategyCount = await writeJsonFiles(strategyDir, computeStrategyGoldens());
  const gameCount = await writeJsonFiles(gameDir, computeGameGoldens());
  process.stdout.write(
    `Updated ${loanCount} loan + ${strategyCount} strategy + ${gameCount} game golden fixtures.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to update golden fixtures: ${String(error)}\n`);
  process.exitCode = 1;
});
