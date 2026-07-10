/** docs/SPEC.md §5.2 — Capacitor native vs web platform helpers. */

import { Capacitor } from "@capacitor/core";

/** True when running inside a Capacitor native shell (Android/iOS). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Capacitor platform id: `web`, `android`, `ios`, etc. */
export function nativePlatform(): string {
  return Capacitor.getPlatform();
}
