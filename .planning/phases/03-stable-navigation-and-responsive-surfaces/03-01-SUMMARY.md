---
phase: 03-stable-navigation-and-responsive-surfaces
plan: 01
subsystem: ui
tags: [react-navigation, typescript, jest, react-native, navigation]
requires:
  - phase: 02-03
    provides: Replay-safe timer cleanup that Phase 3 hardening builds on without changing routed user flow
provides:
  - Shared typed app-stack route constants and param list for audited navigation seams
  - Typed Home screen launch map for audited game cards and settings access
  - Regression coverage that surfaces route-contract drift before runtime
affects:
  [phase-03-02, phase-04-release-confidence-and-regression-guardrails, home-screen, app-shell]
tech-stack:
  added: []
  patterns: [shared navigation contract, typed route-name guards, route-contract regression tests]
key-files:
  created: [src/types/navigation.ts, src/types/navigation.test.ts]
  modified:
    [
      App.tsx,
      App.test.tsx,
      src/screens/HomeScreen.tsx,
      src/screens/HomeScreen.test.tsx,
      src/components/GentleErrorBoundary.tsx,
      src/components/GentleErrorBoundary.test.tsx,
    ]
key-decisions:
  - 'Kept the existing stack structure and user flow, but moved audited route names into src/types/navigation.ts as the single source of truth.'
  - 'Guarded analytics route tracking with isAppRouteName so only known app routes can be reported from navigation state changes.'
patterns-established:
  - 'Audited navigation seams should import APP_ROUTES and AppStackParamList instead of hard-coded route strings or as never casts.'
  - 'Route hardening tests can combine behavioral navigation assertions with focused contract checks in src/types/navigation.test.ts.'
requirements-completed: [STAB-01]
duration: 4min
completed: 2026-03-17
---

# Phase 3 Plan 1: Type the shared navigation contract and audited route call sites Summary

**Shared typed route constants now drive the app stack, audited Home launches, and error-boundary recovery so route drift shows up in tests instead of hidden runtime casts.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T23:14:48Z
- **Completed:** 2026-03-17T23:18:44Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a shared `AppStackParamList`, `APP_ROUTES`, and `HOME_GAME_ROUTES` contract in `src/types/navigation.ts`.
- Typed the audited navigator, Home launches, settings entry, and error-boundary recovery path against shared route names.
- Added Jest coverage that catches route-contract drift in the navigation contract, app shell, Home screen, and error-boundary fallback.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Define the shared app route contract and anchor it in the navigator** - `822b21c` (test)
2. **Task 1 GREEN: Define the shared app route contract and anchor it in the navigator** - `1422ffd` (feat)
3. **Task 2 RED: Replace HomeScreen cast-driven launches with typed shared routes** - `f3dfce0` (test)
4. **Task 2 GREEN: Replace HomeScreen cast-driven launches with typed shared routes** - `e5acef9` (feat)

**Plan metadata:** Pending final docs commit at summary creation time.

## Files Created/Modified

- `src/types/navigation.ts` - Shared app stack param list, route constants, home game route map, and route-name guard.
- `src/types/navigation.test.ts` - Regression coverage for stack route constants and the shared home launch map.
- `App.tsx` - Typed stack registration and analytics route tracking limited to known app route names.
- `App.test.tsx` - App-shell checks for shared route coverage and route-tracking behavior.
- `src/screens/HomeScreen.tsx` - Typed settings and game launches using the shared route contract without unsafe casts.
- `src/screens/HomeScreen.test.tsx` - Regressions for shared route constants and removal of local cast-driven route wiring.
- `src/components/GentleErrorBoundary.tsx` - Typed `screenName` prop and shared Home recovery navigation.
- `src/components/GentleErrorBoundary.test.tsx` - Fallback recovery regression coverage using shared route constants.

## Decisions Made

- Centralized the audited app route contract in `src/types/navigation.ts` instead of spreading route strings across the app shell, Home screen, and error boundary.
- Used `isAppRouteName` in `App.tsx` so analytics only tracks routes that satisfy the shared app contract, preserving current flow while making drift explicit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run typecheck` is still blocked by unrelated pre-existing test typing errors in `src/components/GlitterGlobe.test.tsx` and `src/screens/BreathingGardenScreen.test.tsx`. Per scope rules, these were logged to `deferred-items.md` instead of being fixed during plan 03-01.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 now has a shared typed navigation contract that later stability and regression work can reuse without adding another route helper layer.
- Audited route drift in the app shell, Home screen, and error boundary is now visible in Jest before runtime, reducing risk for later routed-surface changes.

## Self-Check

PASSED

---

_Phase: 03-stable-navigation-and-responsive-surfaces_
_Completed: 2026-03-17_
