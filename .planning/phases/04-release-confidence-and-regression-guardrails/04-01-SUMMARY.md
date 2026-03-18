---
phase: 04-release-confidence-and-regression-guardrails
plan: 01
subsystem: testing
tags: [jest, react-native, accessibility, category-match, bubble-pop, memory-snap, number-picnic]
requires:
  - phase: 02-correct-and-safe-gameplay-interactions
    provides: overlap-driven Number Picnic drop semantics and timer-safe gameplay cleanup
  - phase: 03-stable-navigation-and-responsive-surfaces
    provides: typed route wrappers that Phase 4 can lock down with targeted regressions
provides:
  - Repaired Number Picnic regression coverage aligned to visible-overlap drops
  - Real Category Match board drag/drop regressions plus stronger screen-flow coverage
  - Bubble Pop and Memory Snap route-wrapper accessibility guardrails
affects: [phase-04-02, phase-04-03, ci, regression-baseline]
tech-stack:
  added: []
  patterns: [PanResponder seam tests, route-wrapper accessibility assertions, overlap-first drag/drop regressions]
key-files:
  created:
    - src/components/CategoryMatchBoard.test.tsx
    - src/screens/GameScreen.test.tsx
  modified:
    - src/components/numberpicnic/PicnicBlanket.tsx
    - src/components/numberpicnic/PicnicBlanket.test.tsx
    - src/components/CategoryMatchBoard.tsx
    - src/screens/CategoryMatchScreen.test.tsx
    - src/screens/BubbleScreen.test.tsx
    - src/screens/GameScreen.tsx
key-decisions:
  - "Category Match board regressions stay on the live PanResponder seam, while screen tests own preview, counter, and streak flow."
  - "Memory Snap route coverage keeps GameBoard as the real owner of gameplay logic and only adds a stable stats test seam at the wrapper level."
  - "Number Picnic release validation can reuse a cached measured item rect when available instead of forcing a second measurement for the same drag."
patterns-established:
  - "Route-wrapper regressions should assert accessibility labels exposed to assistive tech, not only visible text."
  - "Gesture-heavy board tests can stay deterministic by driving PanResponder handlers directly and keeping feedback timers under fake timers."
requirements-completed: [RELG-04]
duration: 7min
completed: 2026-03-18
---

# Phase 4 Plan 01: Restore the regression baseline and add targeted Bubble Pop, Category Match, and Memory Snap guardrails Summary

**Overlap-aligned Number Picnic tests plus focused Bubble Pop, Category Match, and Memory Snap accessibility regressions now keep the highest-risk routed gameplay seams green.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T00:05:16Z
- **Completed:** 2026-03-18T00:12:03Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Replaced stale Number Picnic threshold assertions with measured overlap regressions so the shared Jest baseline matches shipped drop behavior.
- Added a dedicated Category Match board regression file that exercises hover highlighting, correct and incorrect drops, and feedback-timer cleanup.
- Locked Bubble Pop and Memory Snap route wrappers to their accessibility-facing counter, header, back, and stats contracts without duplicating gameplay logic.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace stale PicnicBlanket threshold assertions with overlap-based regression coverage** - `7608bab` (fix)
2. **Task 2 RED: Add real Category Match board regressions and extend the screen flow checks** - `abba98c` (test)
3. **Task 2 GREEN: Add real Category Match board regressions and extend the screen flow checks** - `6a7f41e` (feat)
4. **Task 3 RED: Cover Bubble Pop and Memory Snap route-wrapper accessibility contracts** - `d2196e5` (test)
5. **Task 3 GREEN: Cover Bubble Pop and Memory Snap route-wrapper accessibility contracts** - `6087de3` (feat)

**Plan metadata:** Final docs commit created after summary generation.

## Files Created/Modified
- `src/components/numberpicnic/PicnicBlanket.test.tsx` - Rewrites stale threshold-only assertions around real overlap-driven drops.
- `src/components/numberpicnic/PicnicBlanket.tsx` - Reuses cached measured item bounds on release when already available for the same drag.
- `src/components/CategoryMatchBoard.test.tsx` - Covers hover highlighting, correct/incorrect drops, and feedback timer cleanup on the live board seam.
- `src/components/CategoryMatchBoard.tsx` - Adds stable per-zone test IDs without changing gameplay flow.
- `src/screens/CategoryMatchScreen.test.tsx` - Extends preview dismissal, correct counter, incorrect reset, and streak encouragement regressions.
- `src/screens/BubbleScreen.test.tsx` - Verifies the screen wrapper exposes the popped counter through accessibility labels.
- `src/screens/GameScreen.test.tsx` - Adds route-wrapper regression coverage for Memory Snap header, board back flow, and stats accessibility output.
- `src/screens/GameScreen.tsx` - Exposes a stable test ID for the existing wrapper-owned stats label.

## Decisions Made
- Kept Category Match drag/drop verification in a new real board test so the screen test could stay focused on wrapper behavior and progression messaging.
- Added only tiny accessibility-safe seams (`testID`s) where needed instead of mocking or duplicating Bubble Pop or Memory Snap gameplay internals.
- Treated the Number Picnic release-measurement path as a legitimate regression hardening opportunity and reused cached measured bounds when the current drag already owns them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reused cached Number Picnic item measurements on release**
- **Found during:** Task 1 (Replace stale PicnicBlanket threshold assertions with overlap-based regression coverage)
- **Issue:** The release path always forced a second measurement even when the current drag already had a cached measured rect, which blocked deterministic overlap-regression coverage around the existing measurement seam.
- **Fix:** Updated `PicnicBlanket.tsx` to reuse the cached item rect on release when present and fall back to a fresh measurement only when needed.
- **Files modified:** `src/components/numberpicnic/PicnicBlanket.tsx`, `src/components/numberpicnic/PicnicBlanket.test.tsx`
- **Verification:** `npm test -- --runInBand src/components/numberpicnic/PicnicBlanket.test.tsx src/screens/NumberPicnicScreen.test.tsx`
- **Committed in:** `7608bab`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation stayed inside the audited Number Picnic drag seam and was necessary to restore a trustworthy overlap-based regression baseline without widening scope.

## Issues Encountered
- The first Memory Snap route-wrapper test failed because the safe-area mock did not supply `SafeAreaView`; adding a minimal test-only safe-area stub fixed the harness without touching shipped behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 04-02 can build source-map upload-path coverage on top of a green, trustworthy gameplay regression subset.
- RELG-04 now has targeted Jest coverage on the audited route and interaction seams named in the roadmap, reducing risk for release-confidence follow-up work.

---
*Phase: 04-release-confidence-and-regression-guardrails*
*Completed: 2026-03-18*

## Self-Check
PASSED
