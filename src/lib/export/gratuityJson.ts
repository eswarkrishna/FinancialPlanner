import type { GratuityInput, GratuityProjection } from "../gratuity";

export type GratuityExportPayload = {
  exported_at: string;
  locale: string;
  inputs: GratuityInput;
  projection: GratuityProjection;
};

export function gratuityResultToJson(payload: GratuityExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
