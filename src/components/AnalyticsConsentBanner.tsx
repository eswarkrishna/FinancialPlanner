/** Analytics consent strip (SPEC §5.1.2). */

interface AnalyticsConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export function AnalyticsConsentBanner({
  onAccept,
  onReject,
}: AnalyticsConsentBannerProps) {
  return (
    <div className="analytics-consent" role="region" aria-label="Analytics consent">
      <p>
        This site may use Google Analytics to understand anonymous usage (tabs opened,
        exports). No loan amounts or personal data are sent.{" "}
        <button type="button" className="btn-link" onClick={onAccept}>
          Accept analytics
        </button>{" "}
        /{" "}
        <button type="button" className="btn-link" onClick={onReject}>
          No thanks
        </button>
      </p>
    </div>
  );
}
