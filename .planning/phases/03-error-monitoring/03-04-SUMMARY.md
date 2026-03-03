---
phase: 03-error-monitoring
plan: 04
subsystem: monitoring
tags: [sentry, source-maps, metro, expo, error-monitoring]

# Dependency graph
requires:
  - phase: 03-02
    provides: Sentry SDK installed and initialized
provides:
  - Metro configuration with source map generation enabled
  - Expo app.config.js with Sentry plugin for automatic uploads
  - Manual source map upload script for CI/custom pipelines
  - Build scripts for all platforms with source map workflow
affects:
  - error-reporting
  - build-pipeline
  - debugging

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Metro config extending expo/metro-config with source maps
    - Expo config as JavaScript (app.config.js) for environment variable support
    - Sentry Expo plugin for automatic source map upload
    - Platform-specific build scripts (web, android, ios)

key-files:
  created:
    - metro.config.js
    - app.config.js
    - scripts/upload-sourcemaps.js
  modified:
    - package.json

key-decisions:
  - "Used standard Expo Metro config with source maps instead of Sentry's Metro helper - keeps configuration transparent and maintainable"
  - "Migrated from app.json to app.config.js to support environment variables for Sentry configuration"
  - "Created manual upload script as fallback for CI/CD pipelines that need explicit control"
  - "Build scripts output to platform-specific directories (dist/web, dist/android, dist/ios) for cleaner organization"

patterns-established:
  - "Metro config: Extend expo/metro-config, enable sourceMap in transformer"
  - "Build workflow: npm run sentry:release builds all platforms then uploads source maps"
  - "Environment-based configuration: Sentry settings via env vars, defaults to placeholders"

requirements-completed:
  - SENTRY-04

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 03 Plan 04: Source Map Configuration Summary

**Source map generation and upload configured for Sentry with Metro bundler, Expo plugin, and platform-specific build scripts**

## Performance

- **Duration:** 2 min 17 sec
- **Started:** 2026-03-03T05:21:05Z
- **Completed:** 2026-03-03T05:23:22Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Created Metro configuration enabling source map generation for all builds
- Migrated Expo config from app.json to app.config.js with Sentry plugin integration
- Built manual source map upload script supporting web, iOS, and Android platforms
- Updated package.json with comprehensive build scripts including automated Sentry release workflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Metro configuration** - `8152d25` (feat)
2. **Task 2: Create Expo app.config.js** - `34a6aee` (feat)
3. **Task 3: Create source map upload script** - `d583de9` (feat)
4. **Task 4: Update package.json scripts** - `48b3850` (feat)

**Plan metadata:** `[pending]` (docs: complete plan)

## Files Created/Modified

- `metro.config.js` - Metro bundler configuration with source map generation enabled in transformer
- `app.config.js` - Expo configuration with @sentry/react-native/expo plugin for automatic source map upload
- `scripts/upload-sourcemaps.js` - Manual source map upload script using sentry-cli with platform detection
- `package.json` - Updated build scripts: build:web, build:android, build:ios, build:all, upload:sourcemaps, sentry:release
- `app.json` - Removed (migrated to app.config.js)

## Decisions Made

1. **Standard Expo Metro config with source maps** - Rather than using Sentry's Metro helper, we extend expo/metro-config directly. This keeps the configuration transparent and maintainable while still enabling source maps that Sentry can consume.

2. **JavaScript-based Expo config** - Migrated from app.json to app.config.js to support environment variables for Sentry configuration (SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN).

3. **Manual upload script as fallback** - While the Expo plugin handles automatic uploads, we created scripts/upload-sourcemaps.js for CI/CD pipelines that need explicit control over the upload process.

4. **Platform-specific dist directories** - Changed build output to dist/web, dist/android, dist/ios for cleaner organization and easier platform-specific source map handling.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [03-USER-SETUP.md](./03-USER-SETUP.md) for:

- Create Sentry project for gentle-games at Sentry Dashboard -> Projects -> Create Project
- Generate auth token for source map uploads at Sentry Dashboard -> Settings -> Account -> API -> Auth Tokens
- Set environment variables:
  - `SENTRY_AUTH_TOKEN` - From Sentry dashboard
  - `SENTRY_ORG` - Your Sentry organization slug
  - `SENTRY_PROJECT` - Your Sentry project name (e.g., gentle-games)
  - `SENTRY_DSN` - From Sentry project settings

## Next Phase Readiness

- Source map infrastructure complete
- Sentry error monitoring fully configured
- Ready for production builds with readable stack traces
- No blockers

---
*Phase: 03-error-monitoring*
*Completed: 2026-03-03*
