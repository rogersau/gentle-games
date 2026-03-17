---
phase: 02-correct-and-safe-gameplay-interactions
plan: 03
subsystem: ui
tags: [react-native, jest, timers, gameplay, hooks]
requires:
  - phase: 02-02
    provides: Visible basket-overlap semantics for Number Picnic replay-safe follow-up work
provides:
  - Shared tracked timeout cleanup for timer-driven gameplay flows
  - Replay-safe Number Picnic processing resets
  - Memory Snap preview and resolution timers that clear on replay and unmount
affects: [phase-03-stable-navigation-and-responsive-surfaces, number-picnic, memory-snap]
tech-stack:
  added: []
  patterns: [shared tracked timeout hook, replay-safe timer replacement, fake-timer gameplay regressions]
key-files:
  created: [src/utils/useTrackedTimeouts.ts, src/utils/useTrackedTimeouts.test.ts]
  modified: [src/utils/numberPicnicLogic.ts, src/utils/numberPicnicLogic.test.ts, src/components/GameBoard.tsx, src/components/GameBoard.test.tsx]
key-decisions:
  - "Extracted the Pattern Train timeout-registry pattern into a shared hook so audited games can share one cancellable timer contract."
  - "Memory Snap now clears all tracked timers before each restart so stale preview, match, and mismatch callbacks cannot mutate the next round."
patterns-established:
  - "Tracked gameplay timers: queueTimeout registers every delayed callback and clearAllTimeouts cancels them before replay or unmount."
  - "Timer regressions: fake-timer tests should cover replay and unmount cleanup anywhere delayed game state updates exist."
requirements-completed: [STAB-03, PERF-03]
duration: 6min
completed: 2026-03-17
---

# Phase 2 Plan 3: Replace audited gameplay timers with tracked cancellable cleanup Summary

**Shared tracked timeout cleanup now protects Number Picnic processing resets and Memory Snap preview and resolution callbacks from replay- and unmount-driven stale state updates.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T22:03:40Z
- **Completed:** 2026-03-17T22:09:57Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added a reusable `useTrackedTimeouts` hook with queued timeout registration, bulk cancellation, and unmount cleanup.
- Refactored Number Picnic to cancel delayed processing resets before replaying or leaving the game.
- Refactored Memory Snap to clear preview, match, and mismatch timers before replacement rounds and during unmount.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Extract tracked timeout cleanup and apply it to Number Picnic processing timers** - `e9f3127` (test)
2. **Task 1 GREEN: Extract tracked timeout cleanup and apply it to Number Picnic processing timers** - `9799e5d` (feat)
3. **Task 2 RED: Refactor Memory Snap match and preview timers to clear on replay and unmount** - `3f9f466` (test)
4. **Task 2 GREEN: Refactor Memory Snap match and preview timers to clear on replay and unmount** - `8dca52a` (feat)

**Plan metadata:** Pending final docs commit at summary creation time.

## Files Created/Modified
- `src/utils/useTrackedTimeouts.ts` - Shared hook for queueing and cancelling tracked timeouts with unmount cleanup.
- `src/utils/useTrackedTimeouts.test.ts` - Fake-timer coverage for registry cleanup and unmount cancellation.
- `src/utils/numberPicnicLogic.ts` - Number Picnic processing-reset timers now use tracked cleanup before replay.
- `src/utils/numberPicnicLogic.test.ts` - Regressions for replay-safe and unmount-safe processing resets.
- `src/components/GameBoard.tsx` - Memory Snap preview and resolution timers now use tracked cleanup before replay and unmount.
- `src/components/GameBoard.test.tsx` - Regressions for preview replacement, pending-match unmount safety, and stale mismatch replay cleanup.

## Decisions Made
- Extracted the existing timeout-registry pattern into `useTrackedTimeouts` instead of duplicating local refs in each game, keeping timer cleanup small and phase-scoped.
- Cleared all tracked Memory Snap timers at the start of `startNewGame` so replay paths cancel pending preview and resolution work before scheduling replacements.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial Memory Snap regression tests were not scheduling second-tile resolution work because presses happened in the same render frame; splitting interactions to match existing test patterns made the new regressions exercise the real timer seams.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 timer-driven gameplay flows now cancel audited delayed callbacks before replay and unmount, reducing stale-state risk for follow-on runtime hardening.
- Phase 3 can build on the new tracked-timeout pattern if other audited interactive surfaces need similarly narrow timer cleanup.

## Self-Check
PASSED

---
*Phase: 02-correct-and-safe-gameplay-interactions*
*Completed: 2026-03-17*
