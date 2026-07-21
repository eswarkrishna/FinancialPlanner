# Google Analytics (optional)

FinancialPlanner can send anonymous usage events to **Google Analytics 4** when a measurement ID is configured at build time.

## Setup

1. Create a [GA4 property](https://analytics.google.com/) and copy the **Measurement ID** (`G-XXXXXXXXXX`).
2. **Production:** update [`.env.production`](../.env.production), or set GitHub Actions secret `VITE_GA_MEASUREMENT_ID` to override on deploy. Redeploy by pushing to `main` or re-running the workflow.
3. **Local:** `npm run dev` picks up [`.env.development`](../.env.development). To override or disable, use `.env.local` (see [`.env.example`](../.env.example)).

## Behaviour (SPEC §5.1)

- Virtual page views fire for the home page and each tab (`/FinancialPlanner/`, `/FinancialPlanner/debt`, etc.).
- Named interaction events cover tab changes, exports, locale switches, and similar actions — **loan inputs and personal data are not transmitted**.
- When the measurement ID is set, the **web app** shows an accept/decline consent strip before loading GA4; the choice is stored in `localStorage` key `financial-planner-analytics-consent`.
- The **native Android shell** (Capacitor) initializes analytics on load with no consent banner (§5.1.2).
- Footer terms disclose GA, `localStorage` sensitivity, and link to [Google’s opt-out add-on](https://tools.google.com/dlpage/gaoptout).

## Privacy rules

See SPEC §5.1 and §11: no ad pixels, no fingerprinting, no financial amounts in share/UTM URLs.
