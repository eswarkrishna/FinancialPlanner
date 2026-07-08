import { useCallback, useEffect, useState } from "react";
import { loadReleaseConsent } from "./consent";
import { VERSION_POLL_INTERVAL_MS } from "./constants";
import {
  acceptReleaseNotifications,
  acknowledgeVersionUpdate,
  checkLoadedBuildForUpdate,
  consentAllowsPolling,
  pollRemoteVersionForUpdate,
  rejectReleaseNotifications,
} from "./releaseNotifications";
import { isNotificationApiSupported } from "./browserNotifications";
import { pingServiceWorkerVersionCheck } from "./serviceWorker";
import { shouldPromptForConsent } from "./versionCheck";

function applyUpdateResult(
  result: { isUpdate: boolean; shortCommit: string; commitSha: string },
  setShowNewVersion: (show: boolean) => void,
  setNewVersionShort: (short: string) => void,
  setPendingUpdateSha: (sha: string) => void,
): boolean {
  if (!result.isUpdate) return false;
  setShowNewVersion(true);
  setNewVersionShort(result.shortCommit);
  setPendingUpdateSha(result.commitSha);
  return true;
}

export function useReleaseNotifications(): {
  showConsent: boolean;
  showNewVersion: boolean;
  newVersionShort: string;
  notificationsSupported: boolean;
  acceptNotifications: () => Promise<void>;
  rejectNotifications: () => void;
  dismissNewVersion: () => void;
  reloadForUpdate: () => void;
} {
  const [consent, setConsent] = useState(() =>
    typeof window === "undefined" ? null : loadReleaseConsent(window.localStorage),
  );
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [newVersionShort, setNewVersionShort] = useState("");
  const [pendingUpdateSha, setPendingUpdateSha] = useState("");
  const notificationsSupported = isNotificationApiSupported();

  const runVersionCheck = useCallback(async () => {
    const loaded = checkLoadedBuildForUpdate();
    if (applyUpdateResult(loaded, setShowNewVersion, setNewVersionShort, setPendingUpdateSha)) {
      return;
    }
    if (!consentAllowsPolling(consent)) return;
    const remote = await pollRemoteVersionForUpdate();
    applyUpdateResult(remote, setShowNewVersion, setNewVersionShort, setPendingUpdateSha);
  }, [consent]);

  useEffect(() => {
    if (!consentAllowsPolling(consent)) return undefined;
    void runVersionCheck();
    pingServiceWorkerVersionCheck();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void runVersionCheck();
        pingServiceWorkerVersionCheck();
      }
    };

    const interval = window.setInterval(() => {
      void runVersionCheck();
      pingServiceWorkerVersionCheck();
    }, VERSION_POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [consent, runVersionCheck]);

  const acceptNotifications = useCallback(async () => {
    await acceptReleaseNotifications();
    setConsent("accept");
    await runVersionCheck();
  }, [runVersionCheck]);

  const rejectNotifications = useCallback(() => {
    rejectReleaseNotifications();
    setConsent("reject");
  }, []);

  const dismissNewVersion = useCallback(() => {
    if (pendingUpdateSha) {
      acknowledgeVersionUpdate(pendingUpdateSha);
    }
    setPendingUpdateSha("");
    setShowNewVersion(false);
  }, [pendingUpdateSha]);

  const reloadForUpdate = useCallback(() => {
    if (pendingUpdateSha) {
      acknowledgeVersionUpdate(pendingUpdateSha);
    }
    window.location.reload();
  }, [pendingUpdateSha]);

  return {
    showConsent:
      notificationsSupported && shouldPromptForConsent(consent),
    showNewVersion,
    newVersionShort,
    notificationsSupported,
    acceptNotifications,
    rejectNotifications,
    dismissNewVersion,
    reloadForUpdate,
  };
}
