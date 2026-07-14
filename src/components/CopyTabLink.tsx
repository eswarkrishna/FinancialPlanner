import { useState } from "react";
import { trackShareLinkCopy } from "../lib/analytics";
import { buildShareTabUrl } from "../lib/shareUrl";
import type { TabId } from "../lib/seo";

interface CopyTabLinkProps {
  tabId: TabId;
  locale: string;
}

export function CopyTabLink({ tabId, locale }: CopyTabLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const text = buildShareTabUrl(tabId, { source: "share", medium: "copy" });
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
