import { useState } from "react";
import { trackShareLinkCopy } from "../lib/analytics";
import { tabPageUrl, type TabId } from "../lib/seo";

interface CopyTabLinkProps {
  tabId: TabId;
  locale: string;
}

export function CopyTabLink({ tabId, locale }: CopyTabLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const base = tabPageUrl(tabId);
    const url = new URL(base);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "copy");
    const text = url.toString();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackShareLinkCopy(tabId, locale);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="footer-copy-link">
      <button type="button" className="btn-link" onClick={() => void copyLink()}>
        Copy link to this tab
      </button>
      {copied ? <span className="footer-copy-confirm">Link copied</span> : null}
    </span>
  );
}
