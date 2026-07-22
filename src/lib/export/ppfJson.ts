import type { PpfInput, PpfProjection } from "../ppf";

/** JSON export payload for PPF calculator (SPEC §4.17). */
export interface PpfExportPayload {
  exported_at: string;
  locale?: "IN" | "US" | "UK";
  inputs: PpfInput;
  projection: PpfProjection;
}

export function ppfResultToJson(payload: PpfExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
