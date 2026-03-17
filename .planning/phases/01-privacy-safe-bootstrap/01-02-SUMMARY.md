---
phase: 01-privacy-safe-bootstrap
plan: 02
subsystem: ui
tags: [react-native, linking, privacy, homescreen, jest]

# Dependency graph
requires:
  - phase: 01-privacy-safe-bootstrap
    provides: Shared website fallback locale strings from Plan 01-01
provides:
  - Guarded external-link helper with safe opened/unsupported/failed result states
  - HomeScreen website flow that shows a calm in-app modal when link opening fails
  - Regression coverage for audited website launch success and fallback behavior
affects: [privacy, homescreen, observability, support-links]

# Tech tracking
tech-stack:
  added: []
  patterns: [guarded external link helper, localized in-app fallback modal, HomeScreen async website handler]

key-files:
  created:
    - src/utils/externalLinks.ts
    - src/utils/externalLinks.test.ts
  modified:
    - src/screens/HomeScreen.tsx
    - src/screens/HomeScreen.test.tsx

key-decisions:
  - "External link handling stays narrow: one generic helper returns simple states instead of introducing a broader link-management subsystem."
  - "HomeScreen reuses existing AppModal and shared locale keys so website failures stay calm, localized, and free of raw technical errors."

patterns-established:
  - "Audited external URLs should be opened through openExternalUrl rather than direct Linking.openURL calls from screen components."
  - "When external navigation fails, surface a localized in-app AppModal fallback instead of exposing platform error details."

requirements-completed: [PRIV-04]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 1 Plan 02: Website Link Fallback Summary

**Guarded website launching through a shared external-link helper with calm localized HomeScreen fallback modal for unsupported or failed opens.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T21:06:59+11:00
- **Completed:** 2026-03-17T10:09:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added a narrow `openExternalUrl` helper that collapses platform link behavior into safe `opened`, `unsupported`, and `failed` outcomes.
- Replaced the audited HomeScreen website launch path with an awaited helper call and localized `AppModal` fallback.
- Added regression coverage proving the website path opens when available and fails gently in-app when it is not.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the guarded audited external-link helper** - `b1e7c4b` (test), `cb6937e` (feat)
2. **Task 2: Route HomeScreen website launches through the helper and calm fallback modal** - `226a47e` (test), `0b39fd6` (feat)

**Plan metadata:** Pending

_Note: TDD tasks used separate RED and GREEN commits._

## Files Created/Modified
- `src/utils/externalLinks.ts` - Opens external URLs through `Linking.canOpenURL` and `Linking.openURL` while returning only safe result states.
- `src/utils/externalLinks.test.ts` - Covers opened, unsupported, and failed helper outcomes without thrown exceptions.
- `src/screens/HomeScreen.tsx` - Routes the website link through the helper and shows localized fallback copy in `AppModal`.
- `src/screens/HomeScreen.test.tsx` - Verifies helper usage, calm fallback behavior, and avoidance of direct `Linking.openURL` calls from the screen.

## Decisions Made
- Kept the link helper intentionally small and generic so the audited website path is guarded without adding a larger subsystem.
- Reused the existing `AppModal` pattern and shared locale keys from Plan 01-01 to preserve the app’s calm, parent-safe UX.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected stale generated planning progress after state tools left outdated summary text**
- **Found during:** Post-summary state updates
- **Issue:** The required `state update-progress` and `roadmap update-plan-progress` commands reported success but left stale human-readable progress text in `STATE.md` and `ROADMAP.md`.
- **Fix:** Manually updated the stale progress, last-activity, and phase-plan summary lines to match the tool-reported completed state.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Re-read both files after patching to confirm Phase 1 shows `2/3` plans complete and STATE progress shows `67%`.
- **Committed in:** Pending final docs commit

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix kept project-tracking artifacts aligned with the completed work. No product scope creep.

## Issues Encountered
- Initial test mocking with a full `react-native` module replacement triggered TurboModule lookup failures, so the tests were adjusted to use the real `Linking` object with spies instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 01-03 can keep using the same privacy-safe UI baseline while moving observability into consent-aware bootstrap flow.
- The audited website path is now guarded, localized, and covered by regression tests.

## Self-Check: PASSED
