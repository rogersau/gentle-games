# Phase 3: Stable Navigation and Responsive Surfaces - Research

**Researched:** 2026-03-18
**Domain:** Expo/React Native typed navigation, effect stability, motion-surface churn reduction, debounced drawing persistence
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Navigation Contracts
- Introduce a typed navigation contract for the app stack instead of continuing to rely on route strings plus `as never` casts.
- Keep the existing route structure and user flow, but make route names and params compile-time checked wherever possible.
- Fix the currently audited navigation call sites first: `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`.
- Add regression coverage that makes route-name drift visible before runtime.

### State-Flow Cleanup
- Remove or reduce the highest-risk hook dependency suppressions and timing hacks on audited surfaces rather than attempting a repo-wide cleanup pass.
- Prefer stable refs, focused helper hooks, and explicit effect ownership over `setTimeout(..., 0)` or omitted dependency arrays.
- Keep gameplay and animation behavior unchanged from the user's perspective while making the state flow easier to reason about.
- Focus this phase on the surfaces already called out in the concerns map, especially `KeepyUppyBoard` and `BreathingGardenScreen`.

### Motion Performance
- Reduce the hottest React-state churn on audited high-motion surfaces using practical refactoring within the existing stack rather than introducing new animation libraries.
- Prioritize improvements that preserve the current calm visuals while lowering unnecessary re-renders on lower-end devices.
- Keep changes localized to the flagged components instead of broad visual rewrites.
- Preserve existing responsiveness and accessibility behavior while making the internals cheaper to update.

### Drawing Persistence
- Debounce drawing persistence so long sessions do not rewrite the full history on every edit.
- Preserve current drawing UX, undo behavior, and saved-drawing fidelity; this phase should only change when persistence happens, not what the user can do.
- Keep persistence logic in the current drawing flow rather than introducing a separate offline sync layer or storage subsystem.
- Add targeted regression coverage around persistence timing or save behavior where feasible.

### Testing Scope
- Add or extend tests only where they prove the audited Phase 3 requirements: typed navigation safety, stable hook/timer behavior, reduced churn-sensitive surfaces, and drawing persistence behavior.
- Prefer colocated Jest tests and existing fake-timer patterns over new test harnesses.
- Keep tests concrete and behavioral, not broad snapshots.

### Claude's Discretion
- Claude can choose the exact typed-navigation module location and helper naming as long as the route contract is shared and compile-time enforced.
- Claude can decide which specific high-motion surfaces receive the most practical Phase 3 reductions first, provided the audited requirement coverage remains intact.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAB-01 | Navigation between app routes is type-checked without unsafe route casts | Shared `AppStackParamList`, typed `ROUTE_MAP`, typed `screenName` props, and `npm run typecheck` as a required gate remove the current `as never` pattern in `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`. |
| STAB-04 | Concern-prone gameplay state synchronization behaves consistently without timing hacks or disabled hook dependency checks | Replace deferred callback hacks in `KeepyUppyBoard` with post-commit effects and ref-held callbacks; replace mutable `Animated.Value` dependency suppressions in `BreathingGardenScreen` with stable refs plus explicit effects. |
| PERF-01 | High-motion screens avoid the hottest per-frame React state churn that causes dropped frames on lower-end devices | Collapse per-frame state updates in `BubbleField` and `GlitterGlobe` into single frame snapshots backed by refs; keep touch/motion bookkeeping out of render-state and only publish visible frame data once per RAF tick. |
| PERF-02 | Long drawing sessions persist changes without rewriting the full drawing history on every edit | Move `DrawingScreen` persistence to a debounced save coordinator with guaranteed flush on back navigation and `beforeRemove`, while keeping `DrawingCanvas` history fidelity and undo semantics intact. |
</phase_requirements>

## Summary

Phase 3 should be planned as a narrow hardening pass, not a redesign. The repository already has clear audited seams: route typing is missing in `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`; state-flow hacks are concentrated in `KeepyUppyBoard.tsx` and `BreathingGardenScreen.tsx`; the hottest per-frame churn is concentrated in `BubbleField.tsx` and `GlitterGlobe.tsx`; and drawing persistence is centralized in `DrawingScreen.tsx` with `DrawingCanvas.tsx` already exposing the needed history seam. That makes this phase well-suited to localized, behavior-safe refactors.

The strongest plan is to keep the current Expo/React Native/Jest stack, add one shared navigation contract, replace timing hacks with post-commit effect ownership, reduce motion-surface churn by publishing one visible frame snapshot per loop instead of multiple state updates, and debounce drawing saves while still flushing on route exit. Nothing in the repo suggests this phase needs new libraries. The existing stack already supports the work; the main issue is unsafe patterns, not missing dependencies.

The biggest planning risk is trying to solve too much at once. The repository evidence points toward small, targeted extractions: one navigation types module, one or two localized helper hooks for unstable surfaces, and focused Jest coverage using fake timers and the existing typecheck command. That aligns with the project constraint to stay inside current Expo/React Native/Jest patterns and favor behavior-safe refactors.

**Primary recommendation:** Use a shared typed route contract, ref-backed post-commit effects, single-snapshot RAF updates, and debounced drawing persistence with explicit flush-on-exit; do not introduce new animation or storage libraries in this phase.

## Standard Stack

**Confidence:** MEDIUM — versions are verified from `package.json`, but external library docs were not available in this environment for current API confirmation.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | `~54.0.33` | App runtime and platform integration | Already defines the project runtime and constrains safe Phase 3 changes. |
| react | `19.1.0` | Component/render model | Existing code and tests depend on current React semantics; Phase 3 should stay idiomatic to this model. |
| react-native | `0.81.5` | Native/web UI runtime | Current screens, animation loops, and gesture surfaces are built on RN primitives already. |
| @react-navigation/native | `^7.1.28` | Navigation container and hooks | Current route wiring already uses this package; typed contracts should be layered onto it, not replaced. |
| @react-navigation/stack | `^7.7.2` | Stack navigator | Existing route tree is stack-based and should remain so for this phase. |
| @react-native-async-storage/async-storage | `2.2.0` | Persistent local storage | Current drawing persistence and settings persistence already use it; Phase 3 should improve save timing, not storage backend. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-svg | `15.12.1` | Rendering for `BubbleField` and `GlitterGlobe` | Keep for existing motion surfaces; optimize state flow around it rather than replacing it. |
| react-native-safe-area-context | `^5.6.2` | Insets and layout safety | Continue using for responsive screen sizing like `DrawingScreen`. |
| jest / jest-expo | `^29.7.0` / `~54.0.12` | Test runner and Expo preset | Use for all automated Phase 3 regression coverage. |
| @testing-library/react-native | `^13.3.3` | Screen/component interaction tests | Use for navigation contracts, surface behavior, and persistence verification. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing React Navigation stack + typed param list | New router abstraction | Out of scope and higher risk; Phase 3 only needs compile-time safety over the current route tree. |
| Ref-backed motion model + single frame snapshot | Reanimated or Skia rewrite | Likely more scalable long term, but explicitly outside the “localized, behavior-safe refactor” boundary for this phase. |
| AsyncStorage with debounced writes | New persistence layer or offline subsystem | Unnecessary for v1.1; the problem is write frequency, not missing storage capability. |

**Installation:**
```bash
# No Phase 3 package additions recommended.
npm install
```

## Architecture Patterns

**Confidence:** HIGH for project-specific structure, MEDIUM for library typing API details.

### Recommended Project Structure
```text
src/
├── types/
│   └── navigation.ts          # AppStackParamList, route names, typed game-to-route map
├── screens/
│   ├── HomeScreen.tsx         # typed route launches only
│   ├── BreathingGardenScreen.tsx
│   ├── DrawingScreen.tsx      # debounced persistence coordinator
│   └── *.test.tsx             # colocated behavior tests
├── components/
│   ├── GentleErrorBoundary.tsx
│   ├── KeepyUppyBoard.tsx
│   ├── BubbleField.tsx
│   └── GlitterGlobe.tsx
└── test-utils/
    └── infiniteLoopDetection.ts
```

### Pattern 1: Shared Typed Navigation Contract
**Confidence:** MEDIUM  
**What:** Define one shared app stack param list and route-name source of truth, then type the navigator, navigation hooks, route maps, and error-boundary recovery path against it.  
**When to use:** Immediately for all audited route seams in `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`.  
**Example:**
```typescript
// Source: derived from App.tsx, src/screens/HomeScreen.tsx, src/components/GentleErrorBoundary.tsx
export type AppStackParamList = {
  Home: undefined;
  Game: undefined;
  Settings: undefined;
  Drawing: undefined;
  Glitter: undefined;
  Bubble: undefined;
  CategoryMatch: undefined;
  KeepyUppy: undefined;
  BreathingGarden: undefined;
  PatternTrain: undefined;
  NumberPicnic: undefined;
};

export type AppRouteName = keyof AppStackParamList;

export const ROUTES = {
  Home: 'Home',
  Game: 'Game',
  Settings: 'Settings',
  Drawing: 'Drawing',
  Glitter: 'Glitter',
  Bubble: 'Bubble',
  CategoryMatch: 'CategoryMatch',
  KeepyUppy: 'KeepyUppy',
  BreathingGarden: 'BreathingGarden',
  PatternTrain: 'PatternTrain',
  NumberPicnic: 'NumberPicnic',
} as const satisfies Record<AppRouteName, AppRouteName>;

export const GAME_ROUTE_MAP = {
  'memory-snap': ROUTES.Game,
  drawing: ROUTES.Drawing,
  'glitter-fall': ROUTES.Glitter,
  'bubble-pop': ROUTES.Bubble,
  'category-match': ROUTES.CategoryMatch,
  'keepy-uppy': ROUTES.KeepyUppy,
  'breathing-garden': ROUTES.BreathingGarden,
  'pattern-train': ROUTES.PatternTrain,
  'number-picnic': ROUTES.NumberPicnic,
} as const;
```

### Pattern 2: Post-Commit Callback Effects Instead of `setTimeout(..., 0)`
**Confidence:** HIGH  
**What:** Keep latest callbacks in refs, update local state normally, and notify parents from `useEffect` after commit. This removes the current timer-based deferrals and the need to suppress dependency lint rules in `KeepyUppyBoard`.  
**When to use:** Any surface where local state changes are followed by parent callbacks, especially score/count/popped synchronization.  
**Example:**
```typescript
// Source: derived from src/components/KeepyUppyBoard.tsx
const onScoreChangeRef = useRef(onScoreChange);
useEffect(() => {
  onScoreChangeRef.current = onScoreChange;
}, [onScoreChange]);

const [score, setScore] = useState(0);

useEffect(() => {
  onScoreChangeRef.current?.(score);
}, [score]);

const [balloons, setBalloons] = useState<KeepyUppyBalloon[]>(initialBalloons);
useEffect(() => {
  onBalloonCountChangeRef.current?.(balloons.length);
}, [balloons.length]);
```

### Pattern 3: Stable Animation Refs With Explicit Effect Ownership
**Confidence:** HIGH  
**What:** Keep `Animated.Value` instances in refs, derive display-only values from scalar state, and let effects depend only on scalars. This removes exhaustive-deps suppressions in `BreathingGardenScreen` without changing visible behavior.  
**When to use:** Animated label/count transitions where the animation object itself is mutable and should not participate in dependency tracking.  
**Example:**
```typescript
// Source: derived from src/screens/BreathingGardenScreen.tsx
const phaseOpacityRef = useRef(new Animated.Value(1));
const countOpacityRef = useRef(new Animated.Value(0));

const currentCount = useMemo(
  () => Math.min(4, Math.max(1, Math.ceil(progress * 4))),
  [progress]
);

useEffect(() => {
  const phaseOpacity = phaseOpacityRef.current;
  if (!settings.animationsEnabled) {
    setDisplayedPhase(phase);
    phaseOpacity.setValue(1);
    return;
  }

  Animated.timing(phaseOpacity, {
    toValue: 0,
    duration: 400,
    useNativeDriver: Platform.OS !== 'web',
  }).start(() => {
    setDisplayedPhase(phase);
    Animated.timing(phaseOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  });
}, [phase, settings.animationsEnabled]);
```

### Pattern 4: One Published Frame Snapshot Per Motion Loop
**Confidence:** MEDIUM  
**What:** Keep live motion data in refs, perform physics/touch bookkeeping there, and publish one combined render snapshot per RAF tick instead of multiple `setState` calls per frame.  
**When to use:** `BubbleField` and `GlitterGlobe`, where current loops update multiple state atoms every frame.  
**Example:**
```typescript
// Source: derived from src/components/BubbleField.tsx and src/components/GlitterGlobe.tsx
type FrameState = {
  bubbles: Bubble[];
  popIndicators: PopIndicator[];
};

const liveRef = useRef<FrameState>({ bubbles: initialBubbles, popIndicators: [] });
const [frameState, setFrameState] = useState<FrameState>(liveRef.current);

useEffect(() => {
  const tick = (now: number) => {
    liveRef.current = stepFrame(liveRef.current, now);
    setFrameState(liveRef.current); // one visible publish per frame
    frameRef.current = requestAnimationFrame(tick);
  };

  frameRef.current = requestAnimationFrame(tick);
  return () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
  };
}, []);
```

### Pattern 5: Debounced Persistence With Explicit Flush Points
**Confidence:** HIGH  
**What:** Treat `onHistoryChange` as an in-memory signal, not an immediate storage write. Queue a debounced save for the latest history and force-flush on explicit exit paths.  
**When to use:** `DrawingScreen` persistence for `PERF-02`.  
**Example:**
```typescript
// Source: derived from src/screens/DrawingScreen.tsx and src/components/DrawingCanvas.tsx
const pendingHistoryRef = useRef<HistoryEntry[]>(savedHistory);
const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const flushSave = useCallback(async () => {
  const history = pendingHistoryRef.current;
  if (saveTimerRef.current) {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
  }

  if (history.length > 0) {
    await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(history));
  } else {
    await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
  }
}, []);

const scheduleSave = useCallback((history: HistoryEntry[]) => {
  pendingHistoryRef.current = history;
  if (saveTimerRef.current) {
    clearTimeout(saveTimerRef.current);
  }
  saveTimerRef.current = setTimeout(() => {
    void flushSave();
  }, 400);
}, [flushSave]);
```

### Anti-Patterns to Avoid
- **String route literals scattered across files:** they drift independently and force `as never` casts.
- **Parent callback deferrals via zero-delay timers:** they hide sequencing bugs and make tests depend on timer flushing.
- **Multiple per-frame React state updates in one RAF loop:** they amplify render cost on motion-heavy screens.
- **AsyncStorage writes on every `history` edit:** they scale cost with session length and duplicate the same serialized payload.
- **Repo-wide hook-cleanup crusade:** Phase 3 is intentionally scoped to audited surfaces only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route safety | Per-file string constants and `as never` casts | One shared `AppStackParamList` + typed route map | Compile-time drift becomes visible and the route tree stays centralized. |
| Post-state synchronization | `setTimeout(..., 0)` callback shims | Ref-held callbacks + post-commit `useEffect` notifications | Effects already run after commit; timers add jitter and cleanup burden. |
| Motion updates | Separate React state atoms for each animated concern | Single frame snapshot backed by refs | Fewer render publications and clearer ownership of per-frame mutable data. |
| Drawing persistence | Immediate full-history writes on every edit | Debounced save coordinator + flush on exit | Same fidelity, much less storage churn, safer long sessions. |

**Key insight:** This phase does not need new infrastructure; it needs fewer ad hoc escape hatches. The repo already has the right seams, but several hot paths currently bypass React’s normal ownership model with casts, timer hacks, and eager writes.

## Common Pitfalls

### Pitfall 1: Route contract drift between screen registration and callers
**What goes wrong:** `App.tsx` registers screens one way while `HomeScreen` and `GentleErrorBoundary` navigate by raw strings. Renames compile, then fail at runtime.  
**Why it happens:** There is no shared typed route contract today; `ROUTE_MAP` is `Record<string, string>` and callers cast to `never`.  
**How to avoid:** Export route names and param list from one module and type all navigation seams against it.  
**Warning signs:** Any new `as never`, `Record<string, string>` route map, or `screenName: string` prop.

### Pitfall 2: Replacing timer hacks with effects but keeping duplicate state ownership
**What goes wrong:** A refactor removes `setTimeout(..., 0)` but still stores both source state and duplicated derived state in ways that can loop or lag.  
**Why it happens:** The current audited surfaces mix mutable refs, duplicate display state, and delayed callbacks.  
**How to avoid:** Pick one owner for each value: source state, derived display value, or imperative animation ref. Do not duplicate all three unless necessary.  
**Warning signs:** Effects that both read and write the same conceptual value, or tests that need `advanceTimersByTime(0)` just to observe ordinary state sync.

### Pitfall 3: “Optimizing” motion by moving everything to refs and forgetting render publication
**What goes wrong:** The animation model updates internally, but the UI stops visibly updating because nothing triggers a render snapshot.  
**Why it happens:** Refs are good for mutable frame data, but SVG output still needs a published render state.  
**How to avoid:** Keep live simulation in refs and publish exactly one visible frame state per tick.  
**Warning signs:** Motion code that mutates refs only, with no state/reducer/setter used to publish the new frame.

### Pitfall 4: Debouncing saves without a guaranteed flush path
**What goes wrong:** Drawing performance improves, but the last strokes disappear if the user leaves before the debounce fires.  
**Why it happens:** Current code writes immediately, so it never needed an explicit flush contract.  
**How to avoid:** Flush on app back action, `beforeRemove`, and cleanup of any pending debounce timer.  
**Warning signs:** Debounce timer exists, but navigation listeners and back handlers still call `goBack()` without an awaited flush.

### Pitfall 5: Treating compile-time safety as a Jest-only problem
**What goes wrong:** Tests pass, but route drift still ships because Jest cannot assert TypeScript errors by itself.  
**Why it happens:** The real enforcement for STAB-01 is `npm run typecheck`, not a runtime interaction test alone.  
**How to avoid:** Make `npm run typecheck` part of every phase gate and add Jest tests only for route-wiring behavior.  
**Warning signs:** Planning only runtime tests for STAB-01 and omitting `typecheck` from the validation map.

## Code Examples

Verified project patterns from repository sources:

### Shared route contract replacing current string map
```typescript
// Source: App.tsx + src/screens/HomeScreen.tsx
type GameId =
  | 'memory-snap'
  | 'drawing'
  | 'glitter-fall'
  | 'bubble-pop'
  | 'category-match'
  | 'keepy-uppy'
  | 'breathing-garden'
  | 'pattern-train'
  | 'number-picnic';

type GameRouteMap = Record<GameId, AppRouteName>;
```

### Post-commit callback publication for Keepy Uppy
```typescript
// Source: src/components/KeepyUppyBoard.tsx
useEffect(() => {
  onPoppedChangeRef.current?.(popped);
}, [popped]);

const resetBalloons = () => {
  setBalloons([createBalloon(bounds, { colors, resolvedMode })]);
  setScore(0);
  setPopped(0);
};
```

### Drawing persistence that preserves current canvas contract
```typescript
// Source: src/screens/DrawingScreen.tsx + src/components/DrawingCanvas.tsx
<DrawingCanvas
  ref={canvasRef}
  width={canvasDimensions.width}
  height={canvasDimensions.height}
  initialHistory={savedHistory}
  onHistoryChange={scheduleSave}
/>
```

### Fake-timer persistence test shape
```typescript
// Source: testing pattern from src/screens/DrawingScreen.test.tsx
jest.useFakeTimers();
latestProps.onHistoryChange(historyAfterStroke);
act(() => {
  jest.advanceTimersByTime(400);
});
await waitFor(() => {
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Route strings plus `as never` casts | Shared typed stack contract | Phase 3 target (2026-03) | Route renames fail at compile time instead of runtime. |
| `setTimeout(..., 0)` to “stabilize” parent callbacks | Post-commit effect ownership with refs | Phase 3 target (2026-03) | State flow becomes deterministic and testable without timer tricks. |
| Multiple React state updates each frame | One published frame snapshot per loop | Phase 3 target (2026-03) | Lower render pressure on motion-heavy screens. |
| Full-history AsyncStorage writes on every edit | Debounced writes with explicit flush points | Phase 3 target (2026-03) | Better long-session performance with unchanged drawing fidelity. |

**Deprecated/outdated:**
- `navigation.navigate(route as never)`: replace with typed route names and typed navigation hooks.
- `screenName: string` for routed boundaries: replace with an `AppRouteName` union.
- `setTimeout(..., 0)` for ordinary post-state notifications: replace with `useEffect` and refs unless true delayed behavior is user-visible.

## Open Questions

1. **What debounce interval is acceptable for drawing persistence without user-visible risk?**
   - What we know: Current code saves immediately on every history change and again on exit; there is no UX requirement for instant storage flush after each stroke.
   - What's unclear: The repo does not include a measured performance baseline or a user-approved debounce interval.
   - Recommendation: Plan around a conservative 300-500ms debounce and require explicit flush on back/route-exit so interval tuning stays low-risk.

2. **How should Phase 3 prove PERF-01 without frame-rate instrumentation?**
   - What we know: The repo has good Jest coverage patterns but no perf harness or FPS benchmark tooling.
   - What's unclear: There is no automated frame-time metric available in current infrastructure.
   - Recommendation: Treat PERF-01 as a structural requirement: reduce multiple per-frame state publications to one, add direct tests around cleanup/event behavior, and rely on manual low-end-device sanity checks if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + `jest-expo` 54 |
| Config file | `jest.config.js` |
| Quick run command | `npm run typecheck && npx jest --runInBand src/screens/HomeScreen.test.tsx src/components/GentleErrorBoundary.test.tsx src/components/KeepyUppyBoard.test.tsx src/screens/BreathingGardenScreen.test.tsx src/screens/DrawingScreen.test.tsx src/components/GlitterGlobe.test.tsx src/screens/BubbleScreen.test.tsx src/screens/GlitterScreen.test.tsx` |
| Full suite command | `npm run ci:shared` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-01 | Route names and screen recovery paths stay aligned with the shared route contract | typecheck + screen integration | `npm run typecheck && npx jest --runInBand src/screens/HomeScreen.test.tsx src/components/GentleErrorBoundary.test.tsx App.test.tsx` | ❌ Wave 0 |
| STAB-04 | Keepy Uppy and Breathing Garden state sync no longer relies on timing hacks or dependency suppressions | integration | `npx jest --runInBand src/components/KeepyUppyBoard.test.tsx src/screens/BreathingGardenScreen.test.tsx` | ✅ |
| PERF-01 | Bubble/Glitter motion surfaces reduce churn-sensitive update behavior without breaking interaction | component + screen integration | `npx jest --runInBand src/components/GlitterGlobe.test.tsx src/screens/BubbleScreen.test.tsx src/screens/GlitterScreen.test.tsx` | ❌ Wave 0 |
| PERF-02 | Drawing history saves are debounced but flush before leaving the screen | integration with fake timers | `npx jest --runInBand src/screens/DrawingScreen.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npx jest --runInBand <phase-targeted tests>`
- **Per wave merge:** `npm run ci:shared`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/types/navigation.ts` — shared route contract used by `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`
- [ ] `src/types/navigation.test.ts` or equivalent route-contract regression test — concrete runtime assertions around exported route names/maps
- [ ] Expand `src/components/KeepyUppyBoard.test.tsx` — assert callback publication without zero-delay timer flushing and add cleanup/unmount coverage
- [ ] Expand `src/screens/BreathingGardenScreen.test.tsx` — assert stable render behavior after removing dependency suppressions
- [ ] `src/components/BubbleField.test.tsx` — direct coverage for frame-loop cleanup and single-snapshot interaction behavior
- [ ] Expand `src/screens/DrawingScreen.test.tsx` — fake-timer coverage for debounce delay, flush-on-back, and `beforeRemove` save behavior

## Sources

### Primary (HIGH confidence)
- `/home/james/git/gentle-games/.planning/phases/03-stable-navigation-and-responsive-surfaces/03-CONTEXT.md` - locked decisions, phase seams, testing scope
- `/home/james/git/gentle-games/.planning/REQUIREMENTS.md` - STAB-01, STAB-04, PERF-01, PERF-02 requirement definitions
- `/home/james/git/gentle-games/.planning/codebase/CONCERNS.md` - audited navigation, state-flow, performance, and persistence risks
- `/home/james/git/gentle-games/.planning/codebase/ARCHITECTURE.md` - current layering, route ownership, and shared-type conventions
- `/home/james/git/gentle-games/.planning/codebase/TESTING.md` - Jest/Testing Library patterns and CI commands
- `/home/james/git/gentle-games/package.json` - dependency and script versions
- `/home/james/git/gentle-games/App.tsx` - current stack registration and untyped route strings
- `/home/james/git/gentle-games/src/screens/HomeScreen.tsx` - current `ROUTE_MAP` and unsafe navigation casts
- `/home/james/git/gentle-games/src/components/GentleErrorBoundary.tsx` - unsafe recovery navigation
- `/home/james/git/gentle-games/src/components/KeepyUppyBoard.tsx` - timer/dependency hacks to replace
- `/home/james/git/gentle-games/src/screens/BreathingGardenScreen.tsx` - dependency suppressions and duplicated display state
- `/home/james/git/gentle-games/src/components/BubbleField.tsx` - multi-state RAF loop
- `/home/james/git/gentle-games/src/components/GlitterGlobe.tsx` - multi-state RAF loop plus touch/motion updates
- `/home/james/git/gentle-games/src/screens/DrawingScreen.tsx` - eager persistence and navigation-exit save path
- `/home/james/git/gentle-games/src/components/DrawingCanvas.tsx` - history seam and imperative `getHistory()` contract

### Secondary (MEDIUM confidence)
- `/home/james/git/gentle-games/src/screens/usePatternTrainGame.ts` - existing tracked-timeout pattern that informs stable state ownership
- `/home/james/git/gentle-games/src/ui/useLayout.ts` - existing responsive-layout pattern that should remain the standard
- `/home/james/git/gentle-games/src/screens/DrawingScreen.test.tsx` - existing persistence test seam to extend with fake timers
- `/home/james/git/gentle-games/src/screens/HomeScreen.test.tsx` - current navigation interaction coverage
- `/home/james/git/gentle-games/src/components/GentleErrorBoundary.test.tsx` - current boundary fallback coverage
- `/home/james/git/gentle-games/src/components/KeepyUppyBoard.test.tsx` - current timer-dependent callback coverage
- `/home/james/git/gentle-games/src/screens/BreathingGardenScreen.test.tsx` - existing infinite-loop safety test
- `/home/james/git/gentle-games/src/components/GlitterGlobe.test.tsx` - current motion-surface direct coverage

### Tertiary (LOW confidence)
- No external library documentation was available in this environment, so exact React Navigation typing API guidance should be validated during implementation if package-level typings differ from expected usage.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - versions are repository-verified, but no external docs were queried for current API details.
- Architecture: HIGH - recommendations align directly with audited project files and established repository patterns.
- Pitfalls: HIGH - risks are explicitly documented in `CONCERNS.md` and visible in current code.

**Research date:** 2026-03-18
**Valid until:** 2026-04-17
