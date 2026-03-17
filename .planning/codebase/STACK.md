# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**
- TypeScript ~5.9.2 - Application code and tests in `App.tsx`, `index.ts`, and `src/**/*.ts(x)`; configured in `tsconfig.json`.
- JavaScript (Node.js scripts) - Build and deployment helpers in `app.config.js`, `metro.config.js`, and `scripts/*.js`.

**Secondary:**
- YAML - CI/CD and deployment automation in `.github/workflows/*.yml` and Maestro flows in `.maestro/*.yml`.
- JSON - Static web app config in `staticwebapp.config.json`, Azure Expo config in `app.azure.json`, and package metadata in `package.json`.

## Runtime

**Environment:**
- Node.js 20 in CI via `.github/workflows/ci.yml`, `.github/workflows/azure-prod-deploy.yml`, `.github/workflows/azure-dev-deploy.yml`, and `.github/workflows/mobile-validation.yml`.
- Expo SDK 54 app runtime on React Native 0.81 / React 19 from `package.json`.

**Package Manager:**
- npm - Scripts and dependency management are defined in `package.json`.
- Lockfile: present in `package-lock.json`

## Frameworks

**Core:**
- Expo `~54.0.33` - Cross-platform app runtime, export/build flow, and config-driven platform settings in `package.json`, `app.config.js`, and `index.ts`.
- React Native `0.81.5` - Native/web UI runtime used throughout `App.tsx` and `src/**/*.tsx`.
- React `19.1.0` - Component model used throughout `App.tsx` and `src/**/*.tsx`.
- React Navigation `@react-navigation/native` / `@react-navigation/stack` - Screen navigation in `App.tsx` and screen files under `src/screens/`.

**Testing:**
- Jest `^29.7.0` with `jest-expo` `~54.0.12` - Test runner configured in `jest.config.js`.
- `@testing-library/react-native` `^13.3.3` - Component and hook testing used in files such as `App.test.tsx` and `src/**/*.test.ts(x)`.
- Maestro - Android smoke flow automation in `.maestro/*.yml` and `.github/workflows/ci.yml`.

**Build/Dev:**
- Metro via Expo - Bundler configured in `metro.config.js`; also used for web output in `app.config.js`.
- TypeScript compiler - Type-checking via `npm run typecheck` in `package.json`.
- Expo export - Web, Android, and iOS bundle validation via scripts in `package.json`.

## Key Dependencies

**Critical:**
- `expo` `~54.0.33` - App platform, CLI workflow, config resolution, and export pipeline; see `package.json` and `app.config.js`.
- `react-native` `0.81.5` - Core runtime for all screens/components in `src/`.
- `@react-navigation/native` `^7.1.28` and `@react-navigation/stack` `^7.7.2` - Main navigation stack in `App.tsx`.
- `@react-native-async-storage/async-storage` `2.2.0` - Local persistence for settings and saved drawing state in `src/context/SettingsContext.tsx`, `src/screens/DrawingScreen.tsx`, and `src/utils/sentry.ts`.
- `i18next` `^25.8.13` and `react-i18next` `^16.5.4` - Localization bootstrapping in `src/i18n/index.ts`.

**Infrastructure:**
- `@sentry/react-native` `^8.2.0` - Error monitoring and source map integration in `src/utils/sentry.ts`, `src/components/GentleErrorBoundary.tsx`, `app.config.js`, and `scripts/upload-sourcemaps.js`.
- `posthog-react-native` `^4.37.1` - Anonymous analytics client initialized in `src/utils/analytics.ts` and wired in `App.tsx`.
- `expo-audio` `~1.1.1` - Audio playback used in `src/utils/music.ts` and `src/utils/sounds.ts`.
- `expo-sensors` `~15.0.8` - Accelerometer input used in `src/components/GlitterGlobe.tsx`.
- `react-native-svg` `15.12.1` - SVG rendering used across visual components such as `src/components/BreathingBall.tsx` and `src/components/DrawingCanvas.tsx`.
- `react-native-safe-area-context` `^5.6.2` - Safe-area handling in `App.tsx` and `src/ui/components/AppScreen.tsx`.
- `@expo-google-fonts/nunito` `^0.4.2` and `expo-font` `~14.0.11` - Font loading through `src/ui/fonts.ts`.

## Configuration

**Environment:**
- Expo configuration is centralized in `app.config.js`.
- Required runtime/build env vars detected in `app.config.js` and `scripts/upload-sourcemaps.js`: `EXPO_BASE_URL`, `SENTRY_DSN`, `SENTRY_DEBUG`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_DEBUG`, and `GITHUB_SHA`.
- `.env` files were not detected from repository root listing; environment is injected in CI workflows under `.github/workflows/*.yml`.

**Build:**
- Expo app/platform config: `app.config.js`
- Alternate Azure-oriented Expo config snapshot: `app.azure.json`
- Metro bundler/source maps: `metro.config.js`
- TypeScript compiler options: `tsconfig.json`
- Jest config: `jest.config.js`
- Static Web Apps routing/headers: `staticwebapp.config.json`
- PWA post-processing: `scripts/prepare-pwa.js`
- Sentry source map upload fallback: `scripts/upload-sourcemaps.js`

## Platform Requirements

**Development:**
- Use Node.js with npm to run scripts from `package.json`; CI standard is Node 20 in `.github/workflows/ci.yml`.
- Expo CLI workflow is assumed by commands in `package.json` and startup instructions in `README.md`.
- Android validation requires Java 17 and Android tooling in `.github/workflows/ci.yml`.
- Maestro CLI is required for Android smoke flows in `.github/workflows/ci.yml` and `.maestro/*.yml`.

**Production:**
- Mobile targets: Expo export outputs for Android and iOS via `npm run build:android`, `npm run build:ios`, `npm run validate:android`, and `npm run validate:ios` in `package.json`.
- Web target: Expo web export with Metro bundler and PWA patching via `npm run build:web` / `npm run build:pwa` in `package.json` and `scripts/prepare-pwa.js`.
- Deployment target: Azure Static Web Apps for the web app and docs via `.github/workflows/azure-prod-deploy.yml`, `.github/workflows/azure-dev-deploy.yml`, and `.github/workflows/deploy-docs.yml`.

---

*Stack analysis: 2026-03-17*
