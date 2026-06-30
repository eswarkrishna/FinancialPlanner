/**
 * Cursor sessionEnd hook: append session payload to local NDJSON log (gitignored).
 * Drains stdin so the hook exits cleanly. Fail-open on IO errors.
 */
import { appendUsageRecord } from "./cursor-usage-append.mjs";

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
  const raw = await readStdin();
  let payload = null;
  const trimmed = raw.trim();
  if (trimmed.length > 0) {
    try {
      payload = JSON.parse(trimmed);
    } catch {
      payload = { _parseError: true, _rawSnippet: trimmed.slice(0, 2000) };
    }
  }

  appendUsageRecord({
    recordedAt: new Date().toISOString(),
    hook: "sessionEnd",
    workspaceRoot: process.cwd(),
    payload,
  });
}

main();
