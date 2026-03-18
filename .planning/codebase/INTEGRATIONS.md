# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**Observability & Product Analytics:**

- Sentry - Error tracking, crash reporting, breadcrumbs, and source-map-based stack traces.
  - SDK/Client: `@sentry/react-native` in `src/utils/sentry.ts` and `src/components/GentleErrorBoundary.tsx`
  - Auth: `SENTRY_DSN` for app runtime; `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for build/upload in `app.config.js` and `scripts/upload-sourcemaps.js`
- PostHog - Anonymous usage analytics, screen tracking, and gameplay/settings events.
  - SDK/Client: `posthog-react-native` in `src/utils/analytics.ts` and `App.tsx`
  - Auth: `POSTHOG_API_KEY`; optional `POSTHOG_HOST` and `POSTHOG_DEBUG` in `app.config.js`

**Hosting & Delivery:**

- Azure Static Web Apps - Hosts the exported web app from `dist/` and the docs site from `docs/`.
  - SDK/Client: GitHub Action `Azure/static-web-apps-deploy@v1` in `.github/workflows/azure-prod-deploy.yml`, `.github/workflows/azure-dev-deploy.yml`, and `.github/workflows/deploy-docs.yml`
  - Auth: GitHub repository secrets for Azure deployment tokens referenced by workflow files
- GitHub Actions - CI pipeline, platform export validation, smoke testing, and deployment orchestration.
  - SDK/Client: GitHub-hosted workflows in `.github/workflows/*.yml`
  - Auth: Built-in `GITHUB_TOKEN` plus repo secrets referenced in workflow files

## Data Storage

**Databases:**

- Not detected
  - Connection: Not applicable
  - Client: Not applicable

**File Storage:**

- Local filesystem during build/export only - Node `fs` operations in `scripts/prepare-pwa.js` and `scripts/upload-sourcemaps.js`
- Client-side persistence is not file-based; app state is stored in AsyncStorage in `src/context/SettingsContext.tsx`, `src/screens/DrawingScreen.tsx`, and `src/utils/sentry.ts`

**Caching:**

- Browser service worker cache for the PWA in `scripts/prepare-pwa.js`, which generates `dist/sw.js`
- Azure Static Web Apps edge/browser caching rules in `staticwebapp.config.json`

## Authentication & Identity

**Auth Provider:**

- Custom anonymous identity only
  - Implementation: `src/utils/sentry.ts` creates a random install ID, stores it in AsyncStorage under `@gentle_games_install_id`, uses it as the Sentry user id, and shares it with PostHog through `setAnalyticsUser`

## Monitoring & Observability

**Error Tracking:**

- Sentry in `src/utils/sentry.ts`
  - App startup initializes monitoring in `App.tsx`
  - Screen-level capture boundary wraps routes in `src/components/GentleErrorBoundary.tsx`
  - Release/source map support is configured in `app.config.js`, `metro.config.js`, and `scripts/upload-sourcemaps.js`

**Logs:**

- `console.warn` / `console.log` for local diagnostics in `App.tsx`, `src/utils/sentry.ts`, `src/utils/analytics.ts`, and `src/context/SettingsContext.tsx`
- No dedicated log aggregation backend beyond Sentry breadcrumbs/events was detected

## CI/CD & Deployment

**Hosting:**

- Azure Static Web Apps for production and dev web deployments in `.github/workflows/azure-prod-deploy.yml` and `.github/workflows/azure-dev-deploy.yml`
- Azure Static Web Apps for the docs site in `.github/workflows/deploy-docs.yml`

**CI Pipeline:**

- GitHub Actions in `.github/workflows/ci.yml`
  - Shared checks: `npm run ci:shared`
  - Web/Android/iOS export validation: `npm run build:web`, `npm run validate:android`, `npm run validate:ios`
  - Android emulator smoke test: `npm run smoke:android:ci`
- On-demand mobile bundle export validation in `.github/workflows/mobile-validation.yml`

## Environment Configuration

**Required env vars:**

- Web base path: `EXPO_BASE_URL` in `app.config.js` and Azure deploy workflows
- Sentry runtime/build: `SENTRY_DSN`, `SENTRY_DEBUG`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in `app.config.js`, `.github/workflows/azure-*.yml`, and `scripts/upload-sourcemaps.js`
- PostHog runtime: `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_DEBUG` in `app.config.js` and `.github/workflows/azure-prod-deploy.yml`
- Build stamping: `GITHUB_SHA` in `scripts/prepare-pwa.js`

**Secrets location:**

- GitHub Actions repository secrets referenced by `.github/workflows/azure-prod-deploy.yml`, `.github/workflows/azure-dev-deploy.yml`, and `.github/workflows/deploy-docs.yml`
- No checked-in secret files were read; `.env` files were not detected from repository root listing

## Webhooks & Callbacks

**Incoming:**

- None detected in application code under `src/`
- CI/deployment is event-driven by GitHub Actions triggers in `.github/workflows/*.yml`, not by application webhook handlers

**Outgoing:**

- Sentry event submission from `src/utils/sentry.ts`
- PostHog analytics submission from `src/utils/analytics.ts`
- External website launch to `https://gentlegames.org` from `src/screens/HomeScreen.tsx`

---

_Integration audit: 2026-03-17_
