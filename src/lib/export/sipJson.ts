import type { SipInput, SipProjection } from "../sip";

/** JSON export payload for SIP calculator (SPEC §4.18). */
export interface SipExportPayload {
  exported_at: string;
  locale?: "IN" | "US" | "UK";
  inputs: SipInput;
  projection: SipProjection;
}

export function sipResultToJson(payload: SipExportPayload): string {
  return JSON.stringify(payload, null, 2);
}
