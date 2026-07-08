import {
  RELEASE_NOTIFICATION_TITLE,
  releaseNotificationBody,
} from "./constants";
import {
  currentNotificationPermission,
  requestNotificationPermission,
  showReleaseNotification,
} from "./browserNotifications";
import { saveReleaseConsent, type ReleaseConsent } from "./consent";
import {
  clearAwaitingReloadSha,
  evaluateVersionChange,
  loadAwaitingReloadSha,
  loadLastSeenCommitSha,
  saveAwaitingReloadSha,
  saveLastSeenCommitSha,
} from "./versionCheck";
import type { StorageLike } from "./consent";
import {
  fetchRemoteVersion,
  pingServiceWorkerVersionCheck,
  registerReleaseServiceWorker,
} from "./serviceWorker";
import { getBuildInfo } from "../buildInfo";

export interface ReleaseCheckResult {
  isUpdate: boolean;
  shortCommit: string;
  /** Commit that triggered the update alert (remote sha when polling ahead of the loaded bundle). */
  commitSha: string;
}

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function currentBuildVersion(): { sha: string; short: string } | null {
  const info = getBuildInfo();
  if (!info) return null;
  return { sha: info.commitSha, short: info.commitShort };
}

export async function acceptReleaseNotifications(
  storage: StorageLike | null = defaultStorage(),
): Promise<NotificationPermission | "unsupported"> {
  if (!storage) return "unsupported";
  saveReleaseConsent(storage, "accept");
  const permission = await requestNotificationPermission();
  if (permission === "granted") {
    await registerReleaseServiceWorker();
    pingServiceWorkerVersionCheck();
    const build = currentBuildVersion();
    if (build && !loadLastSeenCommitSha(storage)) {
      saveLastSeenCommitSha(storage, build.sha);
    }
  }
  return permission;
}

export function rejectReleaseNotifications(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  saveReleaseConsent(storage, "reject");
}

export function checkLoadedBuildForUpdate(
  storage: StorageLike | null = defaultStorage(),
): ReleaseCheckResult {
  const build = currentBuildVersion();
  if (!build || !storage) {
    return { isUpdate: false, shortCommit: "", commitSha: "" };
  }

  const awaitingReload = loadAwaitingReloadSha(storage);
  if (awaitingReload) {
    if (build.sha === awaitingReload) {
      clearAwaitingReloadSha(storage);
      saveLastSeenCommitSha(storage, build.sha);
    }
    return { isUpdate: false, shortCommit: build.short, commitSha: build.sha };
  }

  const lastSeen = loadLastSeenCommitSha(storage);
  const { isUpdate, nextLastSeenSha } = evaluateVersionChange(lastSeen, build.sha);
  if (isUpdate) {
    return { isUpdate: true, shortCommit: build.short, commitSha: build.sha };
  }
  if (!lastSeen) {
    saveLastSeenCommitSha(storage, nextLastSeenSha);
  }
  return { isUpdate: false, shortCommit: build.short, commitSha: build.sha };
}

export async function pollRemoteVersionForUpdate(
  storage: StorageLike | null = defaultStorage(),
): Promise<ReleaseCheckResult> {
  if (!storage) return { isUpdate: false, shortCommit: "", commitSha: "" };

  const remote = await fetchRemoteVersion();
  const build = currentBuildVersion();
  const currentSha = remote?.sha ?? build?.sha ?? "";
  const shortCommit = remote?.short ?? build?.short ?? "";

  if (!currentSha) return { isUpdate: false, shortCommit: "", commitSha: "" };

  const lastSeen = loadLastSeenCommitSha(storage);
  const { isUpdate } = evaluateVersionChange(lastSeen, currentSha);

  if (isUpdate) {
    if (currentNotificationPermission() === "granted") {
      showReleaseNotification(
        RELEASE_NOTIFICATION_TITLE,
        releaseNotificationBody(shortCommit),
      );
    }
    return { isUpdate: true, shortCommit, commitSha: currentSha };
  }

  if (!lastSeen) {
    saveLastSeenCommitSha(storage, currentSha);
  }

  return { isUpdate: false, shortCommit, commitSha: currentSha };
}

export function acknowledgeVersionUpdate(
  sha: string,
  storage: StorageLike | null = defaultStorage(),
  loadedBundleSha?: string | null,
): void {
  if (!storage || !sha) return;
  saveLastSeenCommitSha(storage, sha);
  const bundleSha = loadedBundleSha ?? currentBuildVersion()?.sha ?? null;
  if (bundleSha && bundleSha !== sha) {
    saveAwaitingReloadSha(storage, sha);
  } else {
    clearAwaitingReloadSha(storage);
  }
}

export function consentAllowsPolling(consent: ReleaseConsent | null): boolean {
  return consent === "accept";
}
