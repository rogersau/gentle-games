# Phase 3: Stable Navigation and Responsive Surfaces - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the app's routed and high-motion surfaces so they are safer to change and smoother to use in longer sessions. It covers typed navigation contracts, removal of the riskiest timing/dependency hacks on audited surfaces, practical reductions to per-frame React churn in high-motion components, and debounced drawing persistence that preserves the existing drawing experience.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `App.tsx` already acts as the app composition root and is the natural place to anchor a typed stack contract.
- `HomeScreen.tsx` centralizes most route launches and currently exposes the riskiest string-based navigation calls.
- `src/screens/usePatternTrainGame.ts` already demonstrates a stable tracked-timeout pattern that can inform other state-flow cleanup work.
- `DrawingScreen.tsx` already contains the persistence seam where debouncing can be added without changing the canvas surface itself.

### Established Patterns

- Shared contracts and app-wide types tend to live in `src/types/`.
- Localized, component-level fixes are preferred over giant cross-cutting rewrites.
- Tests are colocated with the screen/component/hook they protect and often use fake timers for timing-sensitive behavior.
- The app's UX must remain calm and predictable, so internal hardening should not introduce new visible complexity.

### Integration Points

- `App.tsx`, `src/screens/HomeScreen.tsx`, and `src/components/GentleErrorBoundary.tsx` are the main STAB-01 integration points.
- `src/screens/BreathingGardenScreen.tsx` and `src/components/KeepyUppyBoard.tsx` are the main STAB-04 seams for dependency/timing cleanup.
- `src/components/BubbleField.tsx`, `src/components/GlitterGlobe.tsx`, and related motion-heavy surfaces are the main PERF-01 seams.
- `src/screens/DrawingScreen.tsx` and `src/components/DrawingCanvas.tsx` are the main PERF-02 persistence seams.

</code_context>

<specifics>
## Specific Ideas

Keep the experience feeling identical to the child while making the underlying navigation and motion/persistence code less fragile. The best Phase 3 changes are the ones that improve compile-time safety and runtime smoothness without adding new visible concepts.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>
