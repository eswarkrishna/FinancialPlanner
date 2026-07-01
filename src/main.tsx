import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { LocaleProvider } from "./features/locale/LocaleContext";
import {
  initAnalytics,
  initClickTracking,
  setAnalyticsLocale,
  trackHomePageView,
} from "./lib/analytics";
import { LOCALE_STORAGE_KEY } from "./lib/locale";
import "./index.css";

function readInitialLocale(): "IN" | "US" {
  if (typeof window === "undefined") return "IN";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "US" ? "US" : "IN";
}

const initialLocale = readInitialLocale();

initAnalytics();
initClickTracking();
setAnalyticsLocale(initialLocale);
trackHomePageView(initialLocale);

const el = document.getElementById("root");
if (!el) {
  throw new Error("Missing #root");
}

createRoot(el).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
