---
phase: 03-stable-navigation-and-responsive-surfaces
plan: 04
subsystem: ui
tags: [react-native, react-navigation, asyncstorage, jest, drawing]

# Dependency graph
requires:
  - phase: 02-correct-and-safe-gameplay-interactions
    provides: drawing history fidelity and undo-safe canvas behavior that this plan preserves while changing save timing
provides:
  - debounced drawing persistence with explicit flush-on-exit behavior
  - fake-timer regression coverage for drawing save scheduling and route-exit flushes
affects: [phase-04-regression-guardrails, drawing-screen, performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      screen-local debounced AsyncStorage persistence,
      explicit navigation-exit flush before dispatch,
    ]

key-files:
  created: [src/screens/useDebouncedDrawingSave.ts, src/screens/useDebouncedDrawingSave.test.ts]
  modified: [src/screens/DrawingScreen.tsx, src/screens/DrawingScreen.test.tsx]

key-decisions:
  - 'Kept debounced persistence screen-local instead of introducing a broader storage subsystem.'
  - 'Exit paths queue the latest canvas history and then flush immediately so navigation preserves the newest strokes.'

patterns-established:
  - 'Debounced save helpers can expose schedule-plus-flush semantics while leaving data ownership in the screen.'
  - 'Intercepted navigation exits should guard their redispatch path to avoid re-entering beforeRemove handling.'

requirements-completed: [PERF-02]

# Metrics
duration: 3m
completed: 2026-03-17
---

# Phase 3 Plan 04: Debounce drawing persistence with flush-on-exit safeguards Summary

**DrawingScreen now batches AsyncStorage history writes behind a local debounce hook and flushes the newest canvas history before any exit path continues.**

## Performance

- **Duration:** 3m
- **Started:** 2026-03-18T10:13:58+11:00
- **Completed:** 2026-03-17T23:17:04Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added a screen-local debounced drawing save coordinator with fake-timer coverage for coalesced saves, immediate flushes, and empty-history removal.
- Rewired `DrawingScreen` so active drawing no longer writes on every history change, while back and `beforeRemove` exits still flush the latest history before navigation continues.
- Expanded drawing-screen regression coverage to lock in debounce timing and both exit-flush paths without changing drawing fidelity or undo behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create a local debounced drawing-save coordinator with fake-timer coverage** - `81f76e3` (test), `d4fbad0` (feat)
2. **Task 2: Wire DrawingScreen to debounce history writes and flush before exit** - `0f552da` (test), `4cdeca1` (feat)

## Files Created/Modified

- `src/screens/useDebouncedDrawingSave.ts` - Local AsyncStorage-backed save coordinator with debounce scheduling, flushing, and timer cleanup.
- `src/screens/useDebouncedDrawingSave.test.ts` - Hook-level fake-timer regressions for coalescing, forced flush, and empty-history removal.
- `src/screens/DrawingScreen.tsx` - Drawing screen integration for debounced persistence and guarded exit flushing.
- `src/screens/DrawingScreen.test.tsx` - Screen-level regressions for delayed saves, back flush, and `beforeRemove` flush behavior.

## Decisions Made

- Kept the persistence helper local to the drawing screen flow so this performance fix does not become a new shared storage subsystem.
- Exit handlers explicitly enqueue `canvasRef.current.getHistory()` before flushing so the freshest canvas state wins even if the debounce window has not fired yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guarded `beforeRemove` redispatch against re-entry**

- **Found during:** Task 2 (Wire DrawingScreen to debounce history writes and flush before exit)
- **Issue:** Redispatching the intercepted navigation action could re-enter the same `beforeRemove` listener and loop the interception path.
- **Fix:** Added a one-shot ref guard so the redispatched action can continue after the flush without being intercepted again.
- **Files modified:** `src/screens/DrawingScreen.tsx`
- **Verification:** `npm test -- --runInBand src/screens/useDebouncedDrawingSave.test.ts src/screens/DrawingScreen.test.tsx && npm run typecheck`
- **Committed in:** `4cdeca1`

**2. [Rule 2 - Missing Critical] Preserved save-error handling for timer-driven persistence**

- **Found during:** Task 2 (Wire DrawingScreen to debounce history writes and flush before exit)
- **Issue:** Moving saves behind a timer introduced a path where AsyncStorage failures could become unhandled promise rejections instead of the existing warning-only behavior.
- **Fix:** Added optional `onError` handling in the debounced save helper and reused the screen warning path.
- **Files modified:** `src/screens/useDebouncedDrawingSave.ts`, `src/screens/DrawingScreen.tsx`
- **Verification:** `npm test -- --runInBand src/screens/useDebouncedDrawingSave.test.ts src/screens/DrawingScreen.test.tsx && npm run typecheck`
- **Committed in:** `4cdeca1`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes were necessary to make the new debounced exit flow safe and behaviorally equivalent to the pre-debounce screen.

## Issues Encountered

- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Drawing persistence timing is now covered by targeted regressions and ready for later release-confidence work.
- No known blockers were introduced for subsequent Phase 3 or Phase 4 plans.

## Self-Check: PASSED
