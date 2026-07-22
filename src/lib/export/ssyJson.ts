import type { SsyInput, SsyProjection } from "../ssy";

export type SsyExportPayload = {
  exported_at: string;
  locale: string;
  inputs: SsyInput;
  projection: SsyProjection;
};

export function ssyResultToJson(payload: SsyExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
