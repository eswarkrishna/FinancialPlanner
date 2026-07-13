import { tabPageUrl, type TabId } from "./seo";

/** Canonical tab URL with share UTM params. Never includes form/scenario amounts (§5.1). */
export function buildShareTabUrl(
  tabId: TabId,
  utm: { source: string; medium: string },
): string {
  const url = new URL(tabPageUrl(tabId));
  url.searchParams.set("utm_source", utm.source);
  url.searchParams.set("utm_medium", utm.medium);
  return url.toString();
}

/** Facebook sharer dialog URL for a tab (§5.1.1 `share_link_facebook`). */
export function buildFacebookShareUrl(tabId: TabId): string {
  const pageUrl = buildShareTabUrl(tabId, {
    source: "facebook",
    medium: "social",
  });
  const sharer = new URL("https://www.facebook.com/sharer/sharer.php");
  sharer.searchParams.set("u", pageUrl);
  return sharer.toString();
}
