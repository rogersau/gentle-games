# External Integrations

**Analysis Date:** 2026-03-03

## Overview

This application is designed as **offline-first** with **no external API integrations**. All functionality operates locally on the device without requiring internet connectivity.

## APIs & External Services

**Status:** No external APIs used

The application does not connect to any external services. All game logic, audio playback, and data storage happen locally on the device.

## Data Storage

**Local Storage:**
- AsyncStorage (@react-native-async-storage/async-storage 2.2.0)
  - Location: Device local storage
  - Used for: User settings persistence
  - Key: `gentleMatchSettings`
  - Contents: Theme, sound preferences, difficulty, language, parent timer, hidden games

**No External Databases:**
- No cloud database
- No remote data sync

**No File Storage:**
- All assets (audio, images) bundled with the application
- No cloud storage integration

**No Caching:**
- No external caching services
- Settings cached locally only

## Authentication & Identity

**Auth Provider:** None

No authentication system implemented. The app is designed for children with no login requirements.

## Monitoring & Observability

**Error Tracking:** None

No external error tracking service (e.g., Sentry, Crashlytics) integrated.

**Logs:**
- Console logs only for development debugging
- No external log aggregation

## CI/CD & Deployment

**Hosting:**
- Azure Static Web Apps - Web/PWA deployment
  - Dev environment: Auto-deploys from `dev` branch
  - Production: Configured via GitHub Actions

**CI Pipeline:**
- GitHub Actions - Primary CI/CD
  - `ci.yml` - Runs typecheck and tests on PR/push to main
  - `azure-dev-deploy.yml` - Deploys dev branch to Azure Static Web Apps
  - `pwa-deploy.yml` - PWA deployment workflow
  - `mobile-validation.yml` - Mobile build validation

**Build Platforms:**
- Expo - Cross-platform builds (iOS, Android, Web)

## Environment Configuration

**Environment Variables:** None required

The application does not require any environment variables or secrets. No `.env` files present.

**Secrets Location:** N/A

No secrets or API keys required.

## Webhooks & Callbacks

**Incoming:** None

No webhook endpoints configured.

**Outgoing:** None

No outbound webhook calls.

## Game Content

**Audio Files:** Bundled locally
- Location: `src/assets/sounds/`
- Format: MP3
- Contents: Background music tracks (4), sound effects (pop, match)

**Translations:** Bundled locally
- Location: `src/i18n/locales/`
- Languages: en-AU (default), en-US

**No External Content:**
- No remote configuration
- No dynamic content fetching
- No CDN dependencies

---

*Integration audit: 2026-03-03*
