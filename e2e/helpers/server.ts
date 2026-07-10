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

function waitForPreviewReady(
  child: ChildProcessWithoutNullStreams,
  port: number,
  timeoutMs = 30_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    let output = "";

    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes(`http://localhost:${port}/`) || output.includes(`127.0.0.1:${port}`)) {
        cleanup();
        resolve();
      } else if (Date.now() > deadline) {
        cleanup();
        reject(new Error(`Timed out waiting for preview server on port ${port}\n${output}`));
      }
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(
        new Error(`Preview server exited before ready (code ${code ?? "unknown"})\n${output}`),
      );
    };

    const timer = setInterval(() => {
      if (Date.now() > deadline) {
        cleanup();
        reject(new Error(`Timed out waiting for preview server on port ${port}\n${output}`));
      }
    }, 250);

    const cleanup = () => {
      clearInterval(timer);
      child.stdout.off("data", onData);
      child.stderr.off("data", onData);
      child.off("exit", onExit);
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", onExit);
  });
}

export interface PreviewServer {
  baseUrl: string;
  stop: () => Promise<void>;
}

export async function startPreviewServer(): Promise<PreviewServer> {
  const port = await getFreePort();
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  await waitForPreviewReady(child, port);

  return {
    baseUrl: `http://127.0.0.1:${port}`,
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
