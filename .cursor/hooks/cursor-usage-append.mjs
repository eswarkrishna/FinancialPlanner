/**
 * Shared NDJSON append for Cursor usage hooks (.cursor/usage/sessions.ndjson).
 * Fail-open on errors.
 */
import fs from "node:fs";
import path from "node:path";

/** @param {Record<string, unknown>} record */
export function appendUsageRecord(record) {
  const dir = path.join(process.cwd(), ".cursor", "usage");
  const file = path.join(dir, "sessions.ndjson");
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    // intentionally ignore
  }
}
