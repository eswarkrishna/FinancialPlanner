import { RELEASE_CONSENT_LEAD } from "../lib/notifications/constants";

interface ReleaseNotificationConsentProps {
  onAccept: () => void;
  onReject: () => void;
}

export function ReleaseNotificationConsent({
  onAccept,
  onReject,
}: ReleaseNotificationConsentProps) {
  return (
    <div
      className="release-notification-consent"
      role="region"
      aria-label="Release notifications"
    >
      <p>{RELEASE_CONSENT_LEAD}</p>
      <div className="release-notification-actions">
        <button type="button" className="release-notification-accept" onClick={onAccept}>
          Enable notifications
        </button>
        <button type="button" className="release-notification-reject" onClick={onReject}>
          No thanks
        </button>
      </div>
    </div>
  );
}
