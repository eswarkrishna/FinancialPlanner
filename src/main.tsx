import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { LocaleProvider } from "./features/locale/LocaleContext";
import { initAnalytics, trackHomePageView } from "./lib/analytics";
import "./index.css";

initAnalytics();
trackHomePageView();

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
