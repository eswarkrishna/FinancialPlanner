import { AWAITING_RELOAD_SHA_KEY, LAST_SEEN_COMMIT_SHA_KEY } from "./constants";
import type { ReleaseConsent, StorageLike } from "./consent";

export function isNewVersionAvailable(
  lastSeenSha: string | null,
  currentSha: string,
): boolean {
  if (!lastSeenSha || !currentSha) return false;
  return lastSeenSha !== currentSha;
}

export function shouldPromptForConsent(consent: ReleaseConsent | null): boolean {
  return consent === null;
}

export function loadLastSeenCommitSha(storage: StorageLike): string | null {
  return storage.getItem(LAST_SEEN_COMMIT_SHA_KEY);
}

export function saveLastSeenCommitSha(storage: StorageLike, sha: string): void {
  storage.setItem(LAST_SEEN_COMMIT_SHA_KEY, sha);
}

export function loadAwaitingReloadSha(storage: StorageLike): string | null {
  return storage.getItem(AWAITING_RELOAD_SHA_KEY);
}

export function saveAwaitingReloadSha(storage: StorageLike, sha: string): void {
  storage.setItem(AWAITING_RELOAD_SHA_KEY, sha);
}

export function clearAwaitingReloadSha(storage: StorageLike): void {
  storage.removeItem(AWAITING_RELOAD_SHA_KEY);
}

/** Record baseline on first accept; returns whether user should be alerted. */
export function evaluateVersionChange(
  lastSeenSha: string | null,
  currentSha: string,
): { isUpdate: boolean; nextLastSeenSha: string } {
  if (!currentSha) {
    return { isUpdate: false, nextLastSeenSha: lastSeenSha ?? "" };
  }
  if (!lastSeenSha) {
    return { isUpdate: false, nextLastSeenSha: currentSha };
  }
  if (lastSeenSha === currentSha) {
    return { isUpdate: false, nextLastSeenSha: currentSha };
  }
  return { isUpdate: true, nextLastSeenSha: currentSha };
}
