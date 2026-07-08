import { RELEASE_NOTIFICATION_CONSENT_KEY } from "./constants";

export type ReleaseConsent = "accept" | "reject";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadReleaseConsent(storage: StorageLike): ReleaseConsent | null {
  const raw = storage.getItem(RELEASE_NOTIFICATION_CONSENT_KEY);
  if (raw === "accept" || raw === "reject") return raw;
  return null;
}

export function saveReleaseConsent(
  storage: StorageLike,
  consent: ReleaseConsent,
): void {
  storage.setItem(RELEASE_NOTIFICATION_CONSENT_KEY, consent);
}
