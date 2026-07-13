import { trackShareLinkFacebook } from "../lib/analytics";
import { buildFacebookShareUrl } from "../lib/shareUrl";
import type { TabId } from "../lib/seo";

interface ShareFacebookProps {
  tabId: TabId;
  locale: string;
}

/** Opens Facebook’s sharer for the active tab URL (§5.1.1 / §8). No Meta Pixel. */
export function ShareFacebook({ tabId, locale }: ShareFacebookProps) {
  function share() {
    const href = buildFacebookShareUrl(tabId);
    trackShareLinkFacebook(tabId, locale);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" className="btn-link" onClick={share}>
      Share on Facebook
    </button>
  );
}
