import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startPreviewServer } from "./helpers/server";

const specsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "specs");
const specFiles = readdirSync(specsDir)
  .filter((name) => name.endsWith(".spec.ts"))
  .sort()
  .map((name) => path.join(specsDir, name));

async function runSpecs(baseUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx/esm", "--test", "--test-concurrency=1", ...specFiles],
      {
        cwd: process.cwd(),
        env: { ...process.env, E2E_BASE_URL: baseUrl },
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`E2E runner terminated by signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function main(): Promise<void> {
  const server = await startPreviewServer();
  let exitCode = 1;

  try {
    exitCode = await runSpecs(server.baseUrl);
  } finally {
    await server.stop();
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
