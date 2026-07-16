import { ANALYTICS_CONSENT_LEAD } from "../lib/analytics/consent";

interface AnalyticsConsentProps {
  onAccept: () => void;
  onReject: () => void;
}

export function AnalyticsConsent({ onAccept, onReject }: AnalyticsConsentProps) {
  return (
    <div
      className="analytics-consent"
      role="region"
      aria-label="Analytics consent"
    >
      <p>{ANALYTICS_CONSENT_LEAD}</p>
      <div className="analytics-consent-actions">
        <button type="button" className="analytics-consent-accept" onClick={onAccept}>
          Accept analytics
        </button>
        <button type="button" className="analytics-consent-reject" onClick={onReject}>
          Decline
        </button>
      </div>
    </div>
  );
}
