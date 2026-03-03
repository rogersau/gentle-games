# Project State

**Last Updated:** 2026-03-03 (after 03-04 complete)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-03)

**Core Value:** A safe, predictable, and stress-free digital space where children can play, create, and explore at their own pace.
**Current Version:** v1.1 Error Logging (defining requirements)
**Focus:** Add Sentry error monitoring and officially remove deleted games

## Current Position

Phase: 3 — Error Monitoring
Plan: 05 (or complete if 04 was last)
Status: In Progress - Plan 04 complete
Last activity: 2026-03-03 — Completed 03-04 (Source map configuration for Sentry)

## Session

**Last Session:** 2026-03-03 (Source map generation and upload configured)

## Performance Metrics

| Plan  | Duration | Tasks | Files |
|-------|----------|-------|-------|
| 03-03 | 15 min   | 3     | 3     |
| 03-04 | 2 min    | 4     | 4     |

## Accumulated Context

### From v1.0 MVP

- **Shipped:** 9 educational and sensory games
- **Accessibility:** Full stack (light/dark, reduced motion, sound/animation controls, 48dp touch targets)
- **Parent Features:** Timer, settings with secret gesture
- **Technical:** ~12,778 LOC TypeScript, 165 tests passing
- **Platforms:** iOS, Android, Web (PWA)

### Known Issues Carried Forward

- ✅ LetterLantern and StarPath officially removed (03-01 complete)
- ✅ Sentry SDK installed and configured (03-02 complete)
- ✅ Error boundaries implemented with gentle UI (03-03 complete)
- ✅ Source map generation configured (03-04 complete)

### Tech Stack

- Expo (React Native) with TypeScript
- React Navigation
- AsyncStorage for offline persistence
- i18next for internationalization
- Jest + react-testing-library for testing
- **@sentry/react-native** for error monitoring (new)

### Key Decisions

1. **Production-only Sentry**: Only initializes when `__DEV__` is false to respect free tier and keep dev clean
2. **100% sampling**: Rely on low error volume rather than sampling (per project decision)
3. **Early initialization**: Sentry initialized at module level before React mounts
4. **Privacy-safe user ID**: Random install ID via Math.random() + timestamp, no device info collected
5. **Per-screen error boundaries**: Each screen wrapped individually so one crash doesn't take down the app
6. **Child-friendly error UI**: Gentle language ("something went soft"), cloud icon, simple "Go Home" recovery
7. **Standard Expo Metro config with source maps**: Transparent configuration using expo/metro-config with sourceMap enabled in transformer
8. **JavaScript-based Expo config**: Migrated to app.config.js for environment variable support (SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN)
9. **Platform-specific dist directories**: Changed build output to dist/web, dist/android, dist/ios for cleaner organization

---
*State updated: 2026-03-03 after 03-04 complete*
