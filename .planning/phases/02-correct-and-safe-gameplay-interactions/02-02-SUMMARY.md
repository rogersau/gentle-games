---
phase: 02-correct-and-safe-gameplay-interactions
plan: 02
subsystem: ui
tags: [react, react-native, gesture, number-picnic, jest]
requires:
  - phase: 02-correct-and-safe-gameplay-interactions
    provides: active Phase 2 gameplay-fix baseline and Number Picnic hook/screen seams
provides:
  - Separate active-drag and basket-overlap state for Number Picnic
  - Basket hover and valid drops driven by real measured overlap
  - Regression coverage for no-overlap, overlap, and drag cleanup behavior
affects: [number-picnic, gameplay-correctness, touch-interactions]
tech-stack:
  added: []
  patterns: [measured drop-zone bounds, overlap-driven hover state, truthful drag-to-drop feedback]
key-files:
  created: []
  modified:
    - src/screens/NumberPicnicScreen.tsx
    - src/screens/NumberPicnicScreen.test.tsx
    - src/components/numberpicnic/PicnicBlanket.tsx
    - src/components/numberpicnic/PicnicBasket.tsx
    - src/utils/numberPicnicLogic.ts
    - src/utils/numberPicnicLogic.test.ts
key-decisions:
  - "Number Picnic now tracks active drag separately from basket overlap so scroll lock, hover, and drop validity are no longer conflated."
  - "The visible basket bounds now drive both hover feedback and drop acceptance, replacing the old upward-drag threshold heuristic."
patterns-established:
  - "Interactive drop targets should measure visible bounds and use the same overlap result for both highlight and drop validation."
  - "Number Picnic drag cleanup clears both active drag and hover state when a drag ends or a new round starts."
requirements-completed: [PLAY-02, PLAY-03]
duration: 3min
completed: 2026-03-17
---

# Phase 2 Plan 02: Make Number Picnic hover and drops match the visible basket Summary

**Number Picnic now highlights the basket only on real overlap and only accepts drops when the dragged item actually reaches the visible basket.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17
- **Completed:** 2026-03-17
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Split Number Picnic drag handling into distinct active-drag and basket-overlap state so hover and scroll lock no longer depend on the same boolean.
- Wired measured basket bounds from `PicnicBasket` through `NumberPicnicScreen` into `PicnicBlanket` so hover and drop validity use real overlap checks.
- Added regression coverage proving no-overlap drags do not highlight or drop, while real overlap does.

## Task Commits

Each task was committed atomically:

1. **Task 1: Separate active drag state from basket-overlap state in the Number Picnic screen flow** - `023f1e2` (test), `500015a` (feat)
2. **Task 2: Replace upward-threshold drops with measured basket overlap in the Number Picnic components** - `1c528a5` (feat)

## Files Created/Modified
- `src/utils/numberPicnicLogic.ts` - Tracks `isDragging` and `isOverBasket` separately and clears both cleanly on release/new round.
- `src/utils/numberPicnicLogic.test.ts` - Verifies drag-state separation and cleanup behavior.
- `src/screens/NumberPicnicScreen.tsx` - Stores measured basket bounds and passes overlap-driven state through the screen flow.
- `src/screens/NumberPicnicScreen.test.tsx` - Verifies hover, no-overlap, valid-drop, and cleanup behavior through the screen.
- `src/components/numberpicnic/PicnicBlanket.tsx` - Measures dragged item bounds, computes overlap in one coordinate space, and gates drops on overlap.
- `src/components/numberpicnic/PicnicBasket.tsx` - Reports measured visible basket bounds upward for hit testing.

## Decisions Made
- Hover state and valid-drop state now come from the same overlap calculation so the visuals and game rules stay aligned.
- The fix stays narrow to Number Picnic rather than introducing a generic drag-and-drop subsystem.

## Deviations from Plan

### Recovered Executor Handoff

The original background executor disappeared before it wrote the summary/doc-progress handoff, but its code commits were present and the plan verification commands passed locally:

- `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx`
- `npm run typecheck`

This summary and progress update reconstruct that missing handoff without changing the implemented gameplay behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 02-03 can now build timer cleanup on top of the corrected Number Picnic drag/drop flow.
- Phase verification can treat PLAY-02 and PLAY-03 as implemented and test-covered.

## Self-Check: PASSED
