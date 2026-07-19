import { pageHeading, type TabId } from "../lib/seo";

/** One keyword `<h1>` per active tab panel (SPEC §8, §10.56). */
export function TabPageHeading({ tabId }: { tabId: TabId }) {
  return (
    <h1 id={`heading-${tabId}`} className="tab-page-heading">
      {pageHeading(tabId)}
    </h1>
  );
}
