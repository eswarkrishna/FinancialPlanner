import { useCallback, useEffect, useState } from "react";
import { loadReleaseConsent } from "./consent";
import { VERSION_POLL_INTERVAL_MS } from "./constants";
import {
  acceptReleaseNotifications,
  acknowledgeVersionUpdate,
  checkLoadedBuildForUpdate,
  consentAllowsPolling,
  currentBuildVersion,
  pollRemoteVersionForUpdate,
  rejectReleaseNotifications,
} from "./releaseNotifications";
import { isNotificationApiSupported } from "./browserNotifications";
import { pingServiceWorkerVersionCheck } from "./serviceWorker";
import { shouldPromptForConsent } from "./versionCheck";

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
  const notificationsSupported = isNotificationApiSupported();

  const runVersionCheck = useCallback(async () => {
    const loaded = checkLoadedBuildForUpdate();
    if (loaded.isUpdate) {
      setShowNewVersion(true);
      setNewVersionShort(loaded.shortCommit);
      return;
    }
    if (!consentAllowsPolling(consent)) return;
    const remote = await pollRemoteVersionForUpdate();
    if (remote.isUpdate) {
      setShowNewVersion(true);
      setNewVersionShort(remote.shortCommit);
    }
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
    const build = currentBuildVersion();
    if (build) {
      acknowledgeVersionUpdate(build.sha);
    }
    setShowNewVersion(false);
  }, []);

  const reloadForUpdate = useCallback(() => {
    const build = currentBuildVersion();
    if (build) {
      acknowledgeVersionUpdate(build.sha);
    }
    window.location.reload();
  }, []);

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
