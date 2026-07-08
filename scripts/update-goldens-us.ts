import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeUsGoldenScenarios } from "../src/test/fixtures/goldens-us/buildGoldensUs";
import { computeStrategyGoldensUs } from "../src/test/fixtures/strategy-us/buildStrategyGoldensUs";
import { computeGameGoldensUs } from "../src/test/fixtures/game-us/buildGameGoldensUs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldensUsDir = path.resolve(__dirname, "../src/test/fixtures/goldens-us");
const strategyUsDir = path.resolve(__dirname, "../src/test/fixtures/strategy-us");
const gameUsDir = path.resolve(__dirname, "../src/test/fixtures/game-us");

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
  const loanCount = await writeJsonFiles(goldensUsDir, computeUsGoldenScenarios());
  const strategyCount = await writeJsonFiles(
    strategyUsDir,
    computeStrategyGoldensUs(),
  );
  const gameCount = await writeJsonFiles(gameUsDir, computeGameGoldensUs());
  process.stdout.write(
    `Updated ${loanCount} US loan + ${strategyCount} US strategy + ${gameCount} US game golden fixtures.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to update US golden fixtures: ${String(error)}\n`);
  process.exitCode = 1;
});
