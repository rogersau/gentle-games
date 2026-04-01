---
phase: 01-privacy-safe-bootstrap
plan: 01
subsystem: ui
tags: [react-native, settings, privacy, i18n, async-storage, jest]

# Dependency graph
requires: []
provides:
  - Persisted telemetryEnabled consent in the shared settings model
  - Parent-facing telemetry toggle in Settings with calm localized privacy copy
  - Shared website fallback locale strings for downstream guarded-link work
affects: [privacy, observability, settings, homescreen]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared settings persistence, default-off telemetry consent, locale-backed privacy copy]

key-files:
  created: []
  modified:
    - src/types/index.ts
    - src/context/SettingsContext.tsx
    - src/context/SettingsContext.test.tsx
    - src/screens/SettingsScreen.tsx
    - src/screens/SettingsScreen.test.tsx
    - src/i18n/locales/en-AU.json
    - src/i18n/locales/en-US.json
    - jest.setup.ts
    - src/utils/sounds.test.ts

key-decisions:
  - 'Telemetry consent lives in the existing Settings contract and AsyncStorage payload instead of a separate consent store.'
  - 'Fresh installs keep telemetry disabled until a parent explicitly enables it from the in-app Settings screen.'
  - 'Website fallback copy was added in shared locale files during this plan so Plan 01-02 can reuse the same parent-safe strings.'

patterns-established:
  - 'Shared settings fields must be defaulted, sanitized, persisted, and covered by context tests together.'
  - 'Parent-facing privacy controls use existing SettingToggle UI with localized explanatory copy.'

requirements-completed: [PRIV-01]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 1 Plan 01: Telemetry Consent Settings Summary

**Default-off telemetry consent persisted through shared settings, exposed as a localized parent toggle, and prepared with shared website fallback copy for later privacy-safe link handling.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T20:56:30+11:00
- **Completed:** 2026-03-17T10:00:31Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added `telemetryEnabled` to the shared `Settings` contract and the existing sanitize/load/persist flow.
- Added a parent-facing telemetry toggle to `SettingsScreen` using the established toggle UI and calm localized copy.
- Added shared website fallback strings and Jest translation coverage so downstream link-guard work can reuse them.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add telemetryEnabled to the persisted settings contract** - `2a5c64f` (test), `aace508` (feat)
2. **Task 2: Surface the parent-facing telemetry toggle with localized privacy copy** - `33e7572` (test), `1000ea9` (feat)
3. **Verification auto-fix:** `3733283` (fix)

**Plan metadata:** Pending

_Note: TDD tasks used separate RED and GREEN commits._

## Files Created/Modified

- `src/types/index.ts` - Extends the shared `Settings` interface with `telemetryEnabled`.
- `src/context/SettingsContext.tsx` - Defaults, sanitizes, loads, and persists telemetry consent through `gentleMatchSettings`.
- `src/context/SettingsContext.test.tsx` - Verifies fresh-install defaults, sanitization, and persistence for telemetry consent.
- `src/screens/SettingsScreen.tsx` - Renders the telemetry toggle in the existing settings UI.
- `src/screens/SettingsScreen.test.tsx` - Verifies localized telemetry copy, consent updates, and downstream fallback strings.
- `src/i18n/locales/en-AU.json` - Adds telemetry consent copy and website fallback strings.
- `src/i18n/locales/en-US.json` - Adds telemetry consent copy and website fallback strings.
- `jest.setup.ts` - Extends the translation mock and settings mock for new privacy strings and fields.
- `src/utils/sounds.test.ts` - Updates typed `Settings` fixtures to include the new required telemetry field.

## Decisions Made

- Telemetry consent is part of the existing shared settings model so the app has one persisted source of truth for parent consent.
- The telemetry default remains `false` to preserve the privacy-safe child experience on fresh install.
- Shared locale keys for website fallback copy were added early so the next plan can wire guarded external links without introducing inline English.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repaired typecheck fallout from the new required telemetry field**

- **Found during:** Final verification after Task 2
- **Issue:** Adding `telemetryEnabled` to `Settings` broke typed test fixtures and a new translation probe type in verification.
- **Fix:** Added `telemetryEnabled: false` to typed `Settings` test fixtures and typed the translation probe against `TranslationKey`.
- **Files modified:** `src/utils/sounds.test.ts`, `src/screens/SettingsScreen.test.tsx`
- **Verification:** `npm run typecheck` and `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx`
- **Committed in:** `3733283`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was directly required to keep the new settings contract type-safe. No scope creep.

## Issues Encountered

- `python` was unavailable in the shell, so file edits were switched to Node-based scripts without affecting plan scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-02 can reuse the shared `home.websiteLinkFallback.*` locale keys for calm in-app failure handling.
- Plan 01-03 can read one persisted `telemetryEnabled` source of truth before initializing observability.

## Self-Check: PASSED
