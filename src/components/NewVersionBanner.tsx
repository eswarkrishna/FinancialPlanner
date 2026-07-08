import { newVersionBannerText } from "../lib/notifications/constants";

interface NewVersionBannerProps {
  shortCommit: string;
  onReload: () => void;
  onDismiss: () => void;
}

export function NewVersionBanner({
  shortCommit,
  onReload,
  onDismiss,
}: NewVersionBannerProps) {
  return (
    <div className="new-version-banner" role="status" aria-live="polite">
      <p>{newVersionBannerText(shortCommit)}</p>
      <div className="new-version-actions">
        <button type="button" className="new-version-reload" onClick={onReload}>
          Reload
        </button>
        <button
          type="button"
          className="new-version-dismiss"
          aria-label="Dismiss update message"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
