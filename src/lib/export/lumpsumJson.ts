import type { LumpsumInput, LumpsumProjection } from "../lumpsum";

export type LumpsumExportPayload = {
  exported_at: string;
  locale: string;
  inputs: LumpsumInput;
  projection: LumpsumProjection;
};

export function lumpsumResultToJson(payload: LumpsumExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
