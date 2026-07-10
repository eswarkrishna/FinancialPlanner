import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer } from "node:net";

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close(() => reject(new Error("Could not resolve preview port")));
        return;
      }
      const { port } = address;
      probe.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

async function waitForHttpReady(baseUrl: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "follow" });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Timed out waiting for preview server at ${baseUrl}${
      lastError instanceof Error ? `: ${lastError.message}` : ""
    }`,
  );
}

function attachProcessFailureLogging(child: ChildProcessWithoutNullStreams): void {
  let output = "";
  const onData = (chunk: Buffer) => {
    output += chunk.toString();
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("exit", (code, signal) => {
    const terminatedByUs = signal === "SIGTERM" || code === 143 || code === 0;
    if (!terminatedByUs && code !== null) {
      console.error(`Preview server exited with code ${code}\n${output}`);
    }
  });
}

export interface PreviewServer {
  baseUrl: string;
  stop: () => Promise<void>;
}

export async function startPreviewServer(): Promise<PreviewServer> {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const viteBin =
    process.platform === "win32"
      ? "node_modules\\.bin\\vite.cmd"
      : "node_modules/.bin/vite";

  const child = spawn(
    viteBin,
    ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  attachProcessFailureLogging(child);

  await Promise.race([
    waitForHttpReady(baseUrl),
    new Promise<never>((_, reject) => {
      child.once("exit", (code) => {
        reject(new Error(`Preview server exited before ready (code ${code ?? "unknown"})`));
      });
    }),
  ]);

  return {
    baseUrl,
    stop: async () => {
      if (child.killed) return;
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
          resolve();
        }, 5_000);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };
}
