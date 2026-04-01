# Phase 2: Correct and Safe Gameplay Interactions - Research

**Researched:** 2026-03-17
**Domain:** React Native / Expo gameplay interaction correctness, drag-hit testing, and timer lifecycle safety
**Confidence:** MEDIUM

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Treat one mirrored drawing action as one undoable batch even when it creates multiple history entries.
- Keep the existing history model and drawing order semantics, but add whatever grouping metadata is needed so undo removes the full last mirrored action in one step.
- Fix the bug inside the existing `DrawingCanvas` history flow rather than adding a separate undo stack or redesigning the tool model.
- Add targeted regression coverage for half- and quarter-symmetry undo behavior.

- Basket drops must be based on real overlap with the visible basket target, not only on an upward drag threshold.
- Use measured basket bounds and active drag position to determine both drop validity and hover/highlight state.
- Keep the phase scoped to the audited Number Picnic flow; do not invent a generalized drag-and-drop framework.
- Preserve the current calm interaction style while making the rules match the visuals.

- Replace raw timeout usage in the flagged Phase 2 game flows with tracked cancellable timers that are cleaned up on unmount and replay transitions.
- Reuse or extract the existing tracked-timeout pattern already present in the codebase instead of introducing a heavy state machine.
- Ensure leaving a screen or rapidly replaying cannot trigger stale timeout callbacks that mutate gameplay state later.
- Focus timer hardening on the audited surfaces for this phase rather than broad repo-wide timer refactors.

- Add regression tests for the specific audited bugs: symmetry undo, spatial basket hit-testing/hover, and timer cleanup on unmount or rapid replay.
- Prefer colocated unit/integration tests that match the repository's current Jest + Testing Library approach.
- Avoid broad snapshot-only coverage; each new test should prove the concrete audited behavior.
- Preserve existing sensory-friendly copy and UI expectations while adding the new tests.

### Claude's Discretion

- Claude can choose whether the shared timer cleanup helper lives as a reusable hook or a smaller phase-local utility, as long as cleanup guarantees are explicit and test-covered.
- Claude can decide the exact geometry representation for Number Picnic bounds as long as the visual basket and logical drop target stay aligned.

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                             | Research Support                                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLAY-01 | User can undo one mirrored drawing action with a single undo step in half and quarter symmetry modes                                    | Use explicit per-action batch metadata in `DrawingCanvas` history so undo removes all entries from the last mirrored gesture, regardless of symmetry count                |
| PLAY-02 | User can only complete a Number Picnic basket drop when the dragged item overlaps the visible basket target                             | Wire `PicnicBasket` measured bounds into `NumberPicnicScreen`/`PicnicBlanket` and gate `handleItemDrop` behind real overlap checks in a shared geometry helper            |
| PLAY-03 | User sees Number Picnic basket hover feedback only when the dragged item is actually over the basket                                    | Split active-drag state from over-basket state and drive basket highlight from the same overlap computation used for valid drops                                          |
| STAB-03 | User does not experience delayed callbacks mutating flagged gameplay state after leaving a screen                                       | Replace raw timers in `numberPicnicLogic` and `GameBoard` with tracked cancellable timers cleared on unmount and replay/reset paths                                       |
| PERF-03 | Match and round scheduling on flagged games uses tracked cancellable timers that do not pile up across rapid navigation or replay flows | Reuse the `usePatternTrainGame` timeout-registry pattern in a small shared helper or phase-local utility, with fake-timer regression tests for repeated replay/navigation |

</phase_requirements>

## Summary

Phase 2 should stay tightly scoped to three concrete fixes already exposed by the codebase: `DrawingCanvas` undo batching, Number Picnic spatial drop/hover behavior, and timer cleanup on audited gameplay surfaces. The existing architecture already has the right seams: `DrawingCanvas` owns history, `NumberPicnicScreen` composes basket + blanket + hook logic, `PicnicBasket` already exposes a layout callback, and `usePatternTrainGame` already demonstrates the repository's preferred tracked-timeout pattern.

The main planning insight is that each bug comes from a missing piece of explicit state. Symmetry undo currently has no concept of a single user action spanning multiple history entries. Number Picnic currently conflates "dragging anything" with "dragging over the basket" and never wires measured geometry into drop logic. The timer issues come from delayed callbacks that are scheduled ad hoc instead of being registered and cancelled as part of gameplay lifecycle. Fixes should add that missing state explicitly, not redesign the games.

No new dependency is needed. Use the existing React Native stack (`Animated`, `PanResponder`, hooks, refs, Jest fake timers) and keep changes local to the affected surfaces. The planner should prefer small extractions that make correctness testable: a batch ID on drawing history entries, a tiny overlap helper for Number Picnic, and a tiny tracked-timeout helper reused across the flagged flows.

**Primary recommendation:** Implement Phase 2 by adding explicit action grouping, explicit overlap state, and explicit timer registries—without introducing a new undo subsystem, drag-and-drop framework, or state machine.

## Standard Stack

### Core

| Library      | Version  | Purpose                                     | Why Standard                                                                                        |
| ------------ | -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| React        | 19.1.0   | Component/state model for gameplay surfaces | Existing app baseline; all relevant screens/components already use hooks and local state            |
| React Native | 0.81.5   | Native/web interaction layer                | Existing gameplay surfaces already use RN views, `PanResponder`, `Animated`, and layout measurement |
| Expo         | ~54.0.33 | App runtime/build integration               | Current repository platform contract; Phase 2 should stay compatible with existing Expo workflow    |
| Jest         | ^29.7.0  | Regression test runner                      | Existing repo standard for gameplay logic, hooks, and component behavior                            |
| jest-expo    | ~54.0.12 | Expo-aware Jest preset                      | Existing test harness used by all current app tests                                                 |

### Supporting

| Library                                  | Version            | Purpose                                                          | When to Use                                                                                           |
| ---------------------------------------- | ------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| @testing-library/react-native            | ^13.3.3            | Render screens/components and assert behavior                    | Use for integration coverage around undo controls, basket highlight, and replay cleanup               |
| react-native-svg                         | 15.12.1            | Drawing canvas rendering                                         | Keep `DrawingCanvas` fixes inside the existing SVG/history model                                      |
| React Native `Animated` + `PanResponder` | Built into RN      | Drag motion, basket highlight, and current gameplay interactions | Keep for Number Picnic because the feature already uses them and phase scope forbids a framework swap |
| `usePatternTrainGame` timeout pattern    | Repo-local pattern | Tracked timeout registration/cleanup                             | Reuse as the model for timer hardening in audited Phase 2 flows                                       |

### Alternatives Considered

| Instead of                                    | Could Use                                                                            | Tradeoff                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Batch metadata inside `DrawingCanvas` history | Separate undo stack                                                                  | Violates locked scope and duplicates existing ordering/history responsibilities                |
| Existing `PanResponder` + measured bounds     | A generalized drag-and-drop framework or full `react-native-gesture-handler` rewrite | Too large for phase scope; would turn a correctness fix into an interaction-platform migration |
| Tiny tracked-timeout helper/ref registry      | Global scheduler or full state machine                                               | Overkill for the small number of audited delayed transitions                                   |

**Installation:**

```bash
# No new packages recommended for Phase 2.
```

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── components/
│   ├── DrawingCanvas.tsx                 # Add per-action batch metadata and batch-aware undo
│   ├── DrawingCanvas.test.tsx            # Add half/quarter symmetry undo regressions
│   ├── GameBoard.tsx                     # Replace raw delayed match callbacks with tracked timers
│   └── numberpicnic/
│       ├── PicnicBasket.tsx              # Measure visible basket bounds and expose them upward
│       └── PicnicBlanket.tsx             # Compute drag overlap and emit hover/valid-drop events
├── screens/
│   ├── NumberPicnicScreen.tsx            # Own basket-bounds state and separate drag vs hover wiring
│   └── usePatternTrainGame.ts            # Existing timeout-registry reference pattern
└── utils/
    ├── numberPicnicLogic.ts              # Keep round rules + processing state; remove raw timers
    └── useTrackedTimeouts.ts             # Recommended tiny shared helper if timer logic is reused
```

### Pattern 1: Batch mirrored drawing entries by action ID

**What:** Keep the ordered `history` array, but tag every stroke/shape/erase entry created by one user gesture with the same `actionId` or `batchId`.

**When to use:** Every time `DrawingCanvas` creates one or more history entries from a single pointer gesture or shape placement.

**Example:**

```typescript
// Source: repo behavior adapted from src/components/DrawingCanvas.tsx
type HistoryEntry = (Stroke | Shape | ErasedRegion) & { actionId: string };

const nextActionId = () => `draw-${Date.now()}-${actionCounterRef.current++}`;

const handleUndo = () => {
  setHistory((prev) => {
    const lastActionId = prev[prev.length - 1]?.actionId;
    if (!lastActionId) return prev;
    return prev.filter((entry) => entry.actionId !== lastActionId);
  });
};
```

**Why this pattern:** The current code only does `prev.slice(0, -1)`, which is guaranteed to break when one action creates multiple mirrored entries. Explicit batch identity is safer than inferring "remove N items" from the current symmetry mode, because the last action may have been created under a different mode and may be a shape, stroke, or erase.

### Pattern 2: Separate active drag state from over-basket state

**What:** Track at least two pieces of state for Number Picnic: `isDragging` for screen scroll/gesture lifecycle, and `isOverBasket` for hover/highlight and valid drop logic.

**When to use:** Whenever a drag surface has one UI concern tied to "finger is active" and another tied to "dragged object overlaps target".

**Example:**

```typescript
// Source: repo wiring adapted from src/screens/NumberPicnicScreen.tsx and src/utils/numberPicnicLogic.ts
const [basketBounds, setBasketBounds] = useState<Rect | null>(null);
const [isOverBasket, setIsOverBasket] = useState(false);

<PicnicBasket
  onDropZoneLayout={setBasketBounds}
  isDropTarget={isOverBasket}
  ...
/>

<PicnicBlanket
  basketBounds={basketBounds}
  onDropStart={() => setIsDragging(true)}
  onDragOverBasket={setIsOverBasket}
  onValidDrop={handleItemDrop}
  onDropEnd={() => {
    setIsDragging(false);
    setIsOverBasket(false);
    handleDropEnd();
  }}
/>
```

**Why this pattern:** The current hook uses `isDragging` as a proxy for hover/highlight, but `NumberPicnicScreen` also uses that value to disable `ScrollView` scrolling. Those are not the same state. Planning must preserve both behaviors.

### Pattern 3: Use a tiny tracked-timeout registry for delayed gameplay transitions

**What:** Register all `setTimeout` calls in a ref-backed registry and clear them on unmount plus replay/reset transitions.

**When to use:** Any delayed gameplay callback that can fire after navigation, unmount, or rapid replay.

**Example:**

```typescript
// Source: repo pattern from src/screens/usePatternTrainGame.ts
const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

const queueTimeout = useCallback((callback: () => void, delay: number) => {
  const timeoutId = setTimeout(() => {
    timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
    callback();
  }, delay);
  timeoutIdsRef.current.push(timeoutId);
}, []);

const clearAllTimeouts = useCallback(() => {
  timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIdsRef.current = [];
}, []);
```

**Why this pattern:** `GameBoard` already tracks only its preview timer, but match-resolution timers are still raw. `numberPicnicLogic` has a raw processing-reset timeout. Clearing timers only on unmount is not enough; replay/reset paths must also cancel them.

### Anti-Patterns to Avoid

- **Undo by entry count heuristic:** Do not remove "last 2" or "last 4" entries based on the current symmetry mode. The last action's symmetry mode may differ from the current mode.
- **Single boolean for drag + hover:** Do not keep using one `isDragging` flag for scroll locking, basket highlighting, and drop validity.
- **Coordinate-space mixing:** Do not compare local component coordinates from one surface to window coordinates from another. Use one coordinate space end-to-end.
- **Raw `setTimeout` in gameplay callbacks:** Do not schedule delayed state changes without a tracked ref and cleanup path for replay/unmount.
- **Framework escalation:** Do not turn this phase into a generalized drag/drop or interaction-architecture rewrite.

## Don't Hand-Roll

| Problem             | Don't Build                                         | Use Instead                                                                           | Why                                                                                          |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Symmetry-aware undo | A second undo stack or "remove N last entries" rule | Explicit `actionId`/batch metadata on existing `history` entries                      | Keeps current history model, preserves draw order, and works for strokes, shapes, and erases |
| Basket hit-testing  | A generic drag-and-drop framework                   | One small rect-overlap helper wired into the existing Number Picnic screen/components | Scope stays local and testable without redesigning other games                               |
| Hover highlighting  | Separate visual-only hover heuristic                | Drive highlight from the exact same overlap function used for valid drops             | Keeps visuals truthful and prevents mismatch between highlight and drop success              |
| Timer cleanup       | Ad hoc `setTimeout` calls with scattered cleanups   | A tiny tracked-timeout utility/hook modeled on `usePatternTrainGame`                  | Avoids stale callbacks and timeout buildup across replay/navigation                          |

**Key insight:** The deceptively hard parts here are identity, geometry, and lifecycle. Small explicit primitives for those three concerns are safer than clever heuristics.

## Common Pitfalls

### Pitfall 1: Grouping undo by current symmetry mode instead of last action identity

**What goes wrong:** Undo removes the wrong number of entries when the last action was created under a different symmetry mode, or when shapes/eraser actions are mixed with strokes.

**Why it happens:** The current history entries do not encode which entries belong to one user gesture.

**How to avoid:** Tag all history entries created by one gesture with a shared `actionId`, including eraser regions and shapes.

**Warning signs:** Undo behavior changes depending on whether the user changed symmetry mode before pressing undo.

### Pitfall 2: Conflating “currently dragging” with “currently over the basket”

**What goes wrong:** The basket highlights too early, or scroll-lock breaks because hover-only state is reused as drag lifecycle state.

**Why it happens:** The current Number Picnic hook exposes a single `isDragging` flag that is used as drop-target state in the screen.

**How to avoid:** Keep `isDragging` and `isOverBasket` separate, and reset both in drop-end cleanup.

**Warning signs:** Basket highlight appears as soon as any drag starts, even far from the basket.

### Pitfall 3: Mixing layout coordinate systems

**What goes wrong:** Drops fail or succeed incorrectly when the screen is scrolled or when the dragged item is animated.

**Why it happens:** `measureInWindow` returns window coordinates, while gesture handlers can provide local or accumulated deltas.

**How to avoid:** Pick one geometry model and stay in it. Recommended: measure basket and dragged item in window space, then translate the dragged item rect by gesture deltas in that same space.

**Warning signs:** Hover/drop behavior changes after scrolling the `ScrollView`, rotating the device, or replaying a round.

### Pitfall 4: Clearing timers only on unmount, not on replay/reset

**What goes wrong:** Old callbacks mutate a new round after the user taps replay quickly, even if no React warning is emitted.

**Why it happens:** Unmount cleanup is present or planned, but restart paths still leave old timers alive.

**How to avoid:** Clear tracked timers in both effect cleanup and replay/reset/start-new-round functions before scheduling replacements.

**Warning signs:** A board resets, then suddenly flips cards back or clears processing state from a prior round.

### Pitfall 5: Tests that prove counts changed but not why

**What goes wrong:** A test passes even though the app still accepts upward drags that miss the basket or still highlights during non-overlapping drags.

**Why it happens:** Current Number Picnic tests focus on counts/rendering, not geometry semantics.

**How to avoid:** Add tests that explicitly assert “no overlap → no drop / no hover” and “overlap → hover + valid drop”.

**Warning signs:** Test names mention a bug, but the assertions only check that the component rendered.

## Code Examples

Verified repo-aligned patterns:

### Batch-aware undo in `DrawingCanvas`

```typescript
// Source: repo-adapted from src/components/DrawingCanvas.tsx
interface BaseHistoryMeta {
  actionId: string;
}

type HistoryEntry = (Stroke | Shape | ErasedRegion) & BaseHistoryMeta;

const createMirroredStrokeEntries = (
  strokes: Omit<Stroke, 'kind' | 'id'>[],
  actionId: string,
): HistoryEntry[] =>
  strokes.map((stroke, idx) => ({
    kind: 'stroke',
    id: `stroke-${Date.now()}-${idx}`,
    actionId,
    points: stroke.points,
    color: stroke.color,
    width: stroke.width,
  }));

const handleUndo = () => {
  setHistory((prev) => {
    const lastActionId = prev.at(-1)?.actionId;
    return lastActionId ? prev.filter((entry) => entry.actionId !== lastActionId) : prev;
  });
};
```

### Shared overlap function for hover and valid drop

```typescript
// Source: recommended extraction for src/components/numberpicnic + src/screens/NumberPicnicScreen.tsx
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const rectsOverlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const isOverBasket = basketBounds && rectsOverlap(draggedItemRect, basketBounds);
onDragOverBasket(Boolean(isOverBasket));
if (isOverBasket) {
  onValidDrop(index);
}
```

### Tracked timeout helper for replay-safe cleanup

```typescript
// Source: repo pattern adapted from src/screens/usePatternTrainGame.ts
export function useTrackedTimeouts() {
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const queueTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  return { queueTimeout, clearAllTimeouts };
}
```

## State of the Art

| Old Approach                                        | Current Approach                                                       | When Changed | Impact                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ------------ | ----------------------------------------------------------- |
| Undo removes one history entry at a time            | Undo removes one action batch via explicit metadata                    | Phase 2      | PLAY-01 becomes deterministic for half and quarter symmetry |
| Number Picnic accepts “drag upward enough”          | Number Picnic accepts only real overlap with the visible basket target | Phase 2      | PLAY-02 aligns game rules with what the child sees          |
| Basket highlight means “something is being dragged” | Basket highlight means “dragged item overlaps basket”                  | Phase 2      | PLAY-03 removes misleading affordances                      |
| Raw delayed callbacks in gameplay flow              | Tracked cancellable timers cleared on reset/unmount                    | Phase 2      | STAB-03 / PERF-03 prevent stale callbacks and timer pileup  |

**Deprecated/outdated:**

- `gestureState.dy < -200` as the drop rule in `PicnicBlanket.tsx`: outdated for this phase because it does not reflect visible geometry.
- `history.slice(0, -1)` for undo in `DrawingCanvas.tsx`: outdated because mirrored actions are multi-entry actions.
- Raw `setTimeout` usage in `numberPicnicLogic.ts` and match-resolution paths in `GameBoard.tsx`: outdated for audited gameplay flows that can unmount or replay quickly.

## Open Questions

1. **Which dragged-item geometry is most stable across native and web: full translated item rect or touch-centered rect?**
   - What we know: `PicnicBasket` already measures itself with `measureInWindow`, and `PanResponder` provides enough movement data to derive translated item position.
   - What's unclear: the most reliable way to model the dragged item rectangle across RN native and RN web without introducing flaky tests.
   - Recommendation: Prefer item-rect translation from an initial measured item rect plus gesture deltas; if web behavior is inconsistent, keep the overlap helper isolated so the geometry source can be swapped without changing game rules.

2. **Where should the timeout helper live?**
   - What we know: `usePatternTrainGame.ts` already has a good local pattern, and both `GameBoard` and `numberPicnicLogic` need the same guarantees.
   - What's unclear: whether both audited surfaces will share enough code to justify a reusable helper.
   - Recommendation: Start with a tiny reusable helper in `src/utils/useTrackedTimeouts.ts` if both surfaces use the same API; otherwise keep the pattern phase-local but identical.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Jest 29 + `jest-expo` 54                                                                                                                                                      |
| Config file        | `jest.config.js`                                                                                                                                                              |
| Quick run command  | `npm test -- --runInBand src/components/DrawingCanvas.test.tsx src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx src/components/GameBoard.test.tsx` |
| Full suite command | `npm run ci:shared`                                                                                                                                                           |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                      | Test Type                            | Automated Command                                                                                                                       | File Exists? |
| ------- | ----------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| PLAY-01 | One undo removes the entire last mirrored action in half and quarter symmetry | component integration                | `npm test -- --runInBand src/components/DrawingCanvas.test.tsx`                                                                         | ✅           |
| PLAY-02 | Number Picnic drop succeeds only when the dragged item overlaps basket bounds | hook/unit + screen integration       | `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx`                                   | ✅           |
| PLAY-03 | Basket hover/highlight appears only during real overlap                       | screen/component integration         | `npm test -- --runInBand src/screens/NumberPicnicScreen.test.tsx`                                                                       | ✅           |
| STAB-03 | Delayed gameplay callbacks do not mutate state after unmount/navigation away  | hook/component fake-timer regression | `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/components/GameBoard.test.tsx`                                         | ✅           |
| PERF-03 | Rapid replay/reset does not accumulate stale timers in audited gameplay flows | hook/component fake-timer regression | `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/components/GameBoard.test.tsx src/screens/usePatternTrainGame.test.ts` | ✅           |

### Sampling Rate

- **Per task commit:** Run only the relevant phase tests for the surface changed, e.g. `npm test -- --runInBand src/components/DrawingCanvas.test.tsx` or `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx`
- **Per wave merge:** `npm test -- --runInBand src/components/DrawingCanvas.test.tsx src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx src/components/GameBoard.test.tsx`
- **Phase gate:** `npm run ci:shared` before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Expand `src/components/DrawingCanvas.test.tsx` with half- and quarter-symmetry undo batch regressions
- [ ] Expand `src/screens/NumberPicnicScreen.test.tsx` with “no overlap → no hover/no drop” and “overlap → hover/valid drop” assertions
- [ ] Expand `src/utils/numberPicnicLogic.test.ts` with cancellation tests for processing/reset timers
- [ ] Expand `src/components/GameBoard.test.tsx` with replay/unmount cancellation coverage for delayed match-resolution timers
- [ ] If a shared helper is introduced: add `src/utils/useTrackedTimeouts.test.ts` for queue/clear/unmount behavior

## Sources

### Primary (HIGH confidence)

- `.planning/phases/02-correct-and-safe-gameplay-interactions/02-CONTEXT.md` - locked decisions, phase boundary, test scope
- `.planning/REQUIREMENTS.md` - requirement definitions for PLAY-01, PLAY-02, PLAY-03, STAB-03, PERF-03
- `.planning/codebase/CONCERNS.md` - audited bugs, fragile timer paths, and test coverage gaps
- `.planning/codebase/ARCHITECTURE.md` - repo layering and ownership boundaries for screens/components/utils
- `.planning/codebase/TESTING.md` - established Jest + Testing Library patterns and commands
- `src/components/DrawingCanvas.tsx` - current symmetry history flow and one-entry undo bug
- `src/components/DrawingCanvas.test.tsx` - existing test location for drawing canvas regressions
- `src/screens/NumberPicnicScreen.tsx` - current basket/blanket wiring and scroll-lock usage
- `src/components/numberpicnic/PicnicBlanket.tsx` - current upward-threshold drop logic and drag lifecycle
- `src/components/numberpicnic/PicnicBasket.tsx` - measured bounds seam and success-delay cleanup pattern
- `src/utils/numberPicnicLogic.ts` - current Number Picnic state model and raw timeout usage
- `src/utils/numberPicnicLogic.test.ts` - existing Number Picnic hook test location
- `src/components/GameBoard.tsx` - current replay-sensitive match timers
- `src/components/GameBoard.test.tsx` - existing board test location
- `src/screens/usePatternTrainGame.ts` - existing tracked-timeout registry pattern
- `src/screens/usePatternTrainGame.test.ts` - existing timeout-registry test style

### Secondary (MEDIUM confidence)

- `package.json` - dependency versions and test/typecheck commands
- `jest.config.js` - active Jest configuration
- `jest.setup.ts` - global mocks and fake animation/time environment

### Tertiary (LOW confidence)

- None. No external docs or Context7 sources were available in this environment, so ecosystem-level recommendations here are intentionally limited to repo-aligned guidance.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - fully verified from `package.json`, `jest.config.js`, and existing source usage
- Architecture: HIGH - based on direct inspection of current phase files and codebase architecture docs
- Pitfalls: HIGH - directly supported by existing bugs and fragile areas documented in code + planning docs
- Ecosystem “best practice” framing: LOW-MEDIUM - no external documentation tools were available in this environment, so recommendations intentionally stay close to observed repo patterns

**Research date:** 2026-03-17
**Valid until:** 2026-03-31 or until the affected gameplay files change materially
