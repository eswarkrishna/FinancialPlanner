import { useState } from "react";
import { trackFeedbackHelpful } from "../lib/analytics";
import type { TabId } from "../lib/seo";

const VOTED_KEY = "financial-planner-feedback-voted";

function sessionVotedTabs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(VOTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markVoted(tabId: TabId): void {
  try {
    const set = sessionVotedTabs();
    set.add(tabId);
    sessionStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

interface FeedbackHelpfulProps {
  tabId: TabId;
  locale: string;
}

/** Optional thumbs up/down per tab per session (§5.1.2). */
export function FeedbackHelpful({ tabId, locale }: FeedbackHelpfulProps) {
  const [voted, setVoted] = useState(() => sessionVotedTabs().has(tabId));

  function vote(helpful: boolean) {
    if (voted) return;
    markVoted(tabId);
    setVoted(true);
    trackFeedbackHelpful(helpful, tabId, locale);
  }

  return (
    <div className="feedback-helpful" aria-label="Was this tab helpful?">
      <span className="feedback-helpful-label">Helpful?</span>
      <button
        type="button"
        className="btn-link"
        disabled={voted}
        aria-label="Yes, helpful"
        onClick={() => vote(true)}
      >
        👍
      </button>
      <button
        type="button"
        className="btn-link"
        disabled={voted}
        aria-label="No, not helpful"
        onClick={() => vote(false)}
      >
        👎
      </button>
    </div>
  );
}
