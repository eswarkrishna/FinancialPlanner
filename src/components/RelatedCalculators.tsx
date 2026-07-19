import {
  getRelatedCalculatorLinks,
  relatedCalculatorHref,
  relatedCalculatorLabel,
} from "../lib/tabPageContent";
import type { TabId } from "../lib/seo";

type RelatedCalculatorsProps = {
  tabId: TabId;
  onSelectTab: (tabId: TabId) => void;
};

/** Contextual internal links to other calculator paths (SPEC §8, §10.57). */
export function RelatedCalculators({ tabId, onSelectTab }: RelatedCalculatorsProps) {
  const links = getRelatedCalculatorLinks(tabId);
  if (links.length === 0) {
    return null;
  }

  return (
    <aside className="related-calculators" aria-label="Related calculators">
      <h2 className="related-calculators-title">Related calculators</h2>
      <ul className="related-calculators-list">
        {links.map((link) => (
          <li key={link.tabId}>
            <a
              href={relatedCalculatorHref(link.tabId)}
              onClick={(event) => {
                event.preventDefault();
                onSelectTab(link.tabId);
              }}
            >
              {relatedCalculatorLabel(link.tabId)}
            </a>
            <span className="related-calculators-blurb"> — {link.blurb}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
