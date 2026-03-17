---
phase: 03-stable-navigation-and-responsive-surfaces
plan: 02
subsystem: ui
tags: [react-native, react, hooks, animated, gameplay, testing]

# Dependency graph
requires:
  - phase: 02-correct-and-safe-gameplay-interactions
    provides: tracked timer cleanup patterns and behavior-safe gameplay hardening baselines
provides:
  - Keepy Uppy callback publication from post-commit effects instead of zero-delay timers
  - Breathing Garden animation effects with stable ref ownership and stale-callback guards
  - Regression coverage for repeated interactions, repeated renders, and animation-enabled/disabled breathing labels
affects: [phase-03-performance-work, phase-04-regression-guardrails, keepy-uppy, breathing-garden]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ref-held callbacks with post-commit publication effects
    - stable Animated.Value refs with token-guarded animation completion

key-files:
  created: []
  modified:
    - src/components/KeepyUppyBoard.tsx
    - src/components/KeepyUppyBoard.test.tsx
    - src/screens/BreathingGardenScreen.tsx
    - src/screens/BreathingGardenScreen.test.tsx

key-decisions:
  - "Keepy Uppy now publishes score, popped, and balloon-count updates from committed React state instead of zero-delay timer shims."
  - "Breathing Garden phase transitions keep Animated.Value ownership in refs and ignore stale animation completions when the phase changes mid-transition."

patterns-established:
  - "Pattern 1: Publish parent callbacks from state-owned useEffect hooks after commit rather than from setTimeout(..., 0) inside setters."
  - "Pattern 2: Use stable animation refs plus transition tokens to keep repeated renders and rapid state changes from replaying stale callbacks."

requirements-completed: [STAB-04]

# Metrics
duration: 7m 15s
completed: 2026-03-17
---

# Phase 03 Plan 02: Remove audited timing and dependency hacks from Keepy Uppy and Breathing Garden Summary

**Post-commit Keepy Uppy state publication and token-guarded Breathing Garden label animations now keep repeated interactions stable without timer hacks or suppressed hook dependencies.**

## Performance

- **Duration:** 7m 15s
- **Started:** 2026-03-17T23:12:54Z
- **Completed:** 2026-03-17T23:21:04Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced Keepy Uppy's zero-delay callback deferrals with explicit post-commit effects while preserving the board ref API, easy-mode taps, and balloon cap behavior.
- Stabilized Breathing Garden phase and count label effects with ref-owned `Animated.Value` instances and guards against stale animation completions.
- Added focused regressions that cover repeated add/reset flows, repeated renders, and animation-enabled versus animation-disabled label updates.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Keepy Uppy deferred callback hacks with post-commit publication**
   - `ed1c24c` test(03-02): add failing Keepy Uppy callback sync regressions
   - `182153f` feat(03-02): publish Keepy Uppy callbacks after commit
2. **Task 2: Make Breathing Garden animation effects dependency-complete and stable**
   - `452c673` test(03-02): add failing breathing phase stability regressions
   - `fdd2e76` feat(03-02): stabilize Breathing Garden animation effects

_Note: Final planning metadata commit is created after state and roadmap updates._

## Files Created/Modified
- `src/components/KeepyUppyBoard.tsx` - Publishes score, popped, and balloon-count callbacks from committed state effects and keeps reset behavior synchronous.
- `src/components/KeepyUppyBoard.test.tsx` - Verifies callback sync, repeated add/reset interactions, and imperative API behavior without timer flushing.
- `src/screens/BreathingGardenScreen.tsx` - Moves animation ownership into stable refs, derives count labels from scalar state, and guards phase transitions from stale callbacks.
- `src/screens/BreathingGardenScreen.test.tsx` - Exercises stale phase-transition protection, repeated render safety, enabled/disabled animation behavior, and existing control interactions.

## Decisions Made
- Keepy Uppy callback refs stay stable, but publication now happens only from state-owned effects so parents observe committed values instead of deferred timer timing.
- Breathing Garden uses transition tokens plus latest-phase refs so a previously queued fade-out cannot replace a newer inhale/exhale label.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- STAB-04 behavior coverage now exists for the two audited state-flow surfaces, which lowers risk for later runtime and regression work.
- Bubble Field, Glitter Globe, and release/regression plans can build on these explicit effect-ownership patterns.

## Self-Check: PASSED

---
*Phase: 03-stable-navigation-and-responsive-surfaces*
*Completed: 2026-03-17*
