import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeGoldenScenarios } from "../src/test/fixtures/goldens/buildGoldens";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldensDir = path.resolve(__dirname, "../src/test/fixtures/goldens");

async function main() {
  const snapshots = computeGoldenScenarios();

  await mkdir(goldensDir, { recursive: true });
  await Promise.all(
    Object.entries(snapshots).map(async ([name, payload]) => {
      const filePath = path.join(goldensDir, `${name}.json`);
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    }),
  );

  process.stdout.write(`Updated ${Object.keys(snapshots).length} golden fixtures.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Failed to update golden fixtures: ${String(error)}\n`);
  process.exitCode = 1;
});
