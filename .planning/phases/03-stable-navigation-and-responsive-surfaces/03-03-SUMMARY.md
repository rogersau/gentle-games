---
phase: 03-stable-navigation-and-responsive-surfaces
plan: 03
subsystem: ui
tags: [react, react-native, performance, animation, jest]
requires:
  - phase: 02-correct-and-safe-gameplay-interactions
    provides: cancellable timing cleanup patterns on audited motion surfaces
provides:
  - Bubble Field publishes one render snapshot per RAF tick from ref-backed motion state
  - Glitter Globe publishes particles and wake ripples together from ref-backed motion state
  - Motion-surface regressions cover cleanup, pop, wake, shake-adjacent, and screen-control contracts
affects: [phase-04-release-confidence-and-regression-guardrails, PERF-01, BubbleScreen, GlitterScreen]
tech-stack:
  added: []
  patterns:
    - ref-backed animation data with one published render snapshot per visible update
    - focused Jest motion regressions using deterministic RAF and PanResponder mocks
key-files:
  created:
    - src/components/BubbleField.test.tsx
  modified:
    - src/components/BubbleField.tsx
    - src/components/GlitterGlobe.tsx
    - src/components/GlitterGlobe.test.tsx
key-decisions:
  - "BubbleField now mutates bubble and pop-indicator refs inside its RAF loop and publishes one snapshot object per frame."
  - "GlitterGlobe now routes RAF, shake, wake, and imperative mutations through shared snapshot publishing so particles and ripples render together."
patterns-established:
  - "High-motion components can keep calm visuals while reducing churn by storing mutable simulation state in refs and publishing a single view snapshot."
  - "Direct regression tests for animation surfaces should control RAF, touch responders, and randomness so cleanup and interaction paths stay deterministic."
requirements-completed: [PERF-01]
duration: 7m
completed: 2026-03-17
---

# Phase 3 Plan 03: Reduce per-frame React churn on Bubble Field and Glitter Globe Summary

**Ref-backed Bubble Field and Glitter Globe motion loops now publish one visible snapshot per update while preserving pop, wake, shake-triggered, and screen-level control behavior.**

## Performance

- **Duration:** 7m
- **Started:** 2026-03-17T23:12:25Z
- **Completed:** 2026-03-17T23:19:48Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Reworked Bubble Field to update bubble and pop-indicator simulation data through refs and publish one frame snapshot per RAF tick.
- Reworked Glitter Globe to publish particle and wake-ripple updates together across RAF, shake, touch, and imperative control paths.
- Added deterministic component regressions that lock in cleanup, spawn/pop behavior, wake behavior, and screen-level callback wiring.

## Task Commits

Each task was committed atomically:

1. **Task 1: Collapse Bubble Field motion updates into one published frame snapshot**
   - `54ba1c8` test(03-03): add failing BubbleField regression coverage
   - `54aad47` feat(03-03): publish BubbleField motion as one frame snapshot
2. **Task 2: Collapse Glitter Globe particle and wake updates into one published frame snapshot**
   - `ba851d4` test(03-03): add failing GlitterGlobe regression coverage
   - `296bd58` feat(03-03): publish GlitterGlobe motion as one frame snapshot

## Files Created/Modified
- `src/components/BubbleField.tsx` - Consolidates bubble and pop-indicator publication into one frame snapshot and fixes RAF cleanup when the scheduled id is `0`.
- `src/components/BubbleField.test.tsx` - Covers minimum/spawn behavior, immediate RAF cleanup, and pop interaction regressions directly at the component seam.
- `src/components/GlitterGlobe.tsx` - Consolidates particle and wake-ripple publication across RAF, shake, touch, and imperative actions into one frame snapshot.
- `src/components/GlitterGlobe.test.tsx` - Covers accelerometer/RAF cleanup plus imperative add/clear and wake-ripple behavior with deterministic motion mocks.

## Decisions Made
- Used snapshot objects instead of separate React state atoms so each motion surface can keep mutable refs internally while rendering one consistent visible frame.
- Kept the existing screen contracts intact rather than widening the refactor into new animation abstractions or library changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run typecheck` is still blocked by the unrelated pre-existing error in `src/screens/BreathingGardenScreen.test.tsx` (`TS2345` on the mocked `Animated.timing` signature). Logged in `.planning/phases/03-stable-navigation-and-responsive-surfaces/deferred-items.md` and left out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Bubble Pop and Glitter Fall now have churn-sensitive regression coverage that Phase 4 can extend without reopening the motion-loop refactors.
- A separate cleanup pass is still needed for the unrelated `BreathingGardenScreen.test.tsx` typing issue before repo-wide typecheck can pass cleanly.

## Self-Check

PASSED

- Verified summary and key implementation files exist on disk.
- Verified task commits `54ba1c8`, `54aad47`, `ba851d4`, and `296bd58` exist in git history.

---
*Phase: 03-stable-navigation-and-responsive-surfaces*
*Completed: 2026-03-17*
