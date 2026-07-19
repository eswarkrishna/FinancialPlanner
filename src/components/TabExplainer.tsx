import { getTabExplainer } from "../lib/tabPageContent";
import type { TabId } from "../lib/seo";

/** Indexable explainer copy per calculator tab (SPEC §8, §10.58). */
export function TabExplainer({ tabId }: { tabId: TabId }) {
  return (
    <div className="tab-explainer">
      <p>{getTabExplainer(tabId)}</p>
    </div>
  );
}
