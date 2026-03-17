# Phase 2: Correct and Safe Gameplay Interactions - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase fixes the audited gameplay correctness and timer-cleanup issues without redesigning the games themselves. It covers symmetry-aware undo in the drawing surface, real spatial drop/hover logic for Number Picnic, and cancellable timer handling for the flagged timer-driven gameplay flows in this phase.

</domain>

<decisions>
## Implementation Decisions

### Symmetry Undo Behavior
- Treat one mirrored drawing action as one undoable batch even when it creates multiple history entries.
- Keep the existing history model and drawing order semantics, but add whatever grouping metadata is needed so undo removes the full last mirrored action in one step.
- Fix the bug inside the existing `DrawingCanvas` history flow rather than adding a separate undo stack or redesigning the tool model.
- Add targeted regression coverage for half- and quarter-symmetry undo behavior.

### Number Picnic Drop Semantics
- Basket drops must be based on real overlap with the visible basket target, not only on an upward drag threshold.
- Use measured basket bounds and active drag position to determine both drop validity and hover/highlight state.
- Keep the phase scoped to the audited Number Picnic flow; do not invent a generalized drag-and-drop framework.
- Preserve the current calm interaction style while making the rules match the visuals.

### Timer Cleanup and Replay Safety
- Replace raw timeout usage in the flagged Phase 2 game flows with tracked cancellable timers that are cleaned up on unmount and replay transitions.
- Reuse or extract the existing tracked-timeout pattern already present in the codebase instead of introducing a heavy state machine.
- Ensure leaving a screen or rapidly replaying cannot trigger stale timeout callbacks that mutate gameplay state later.
- Focus timer hardening on the audited surfaces for this phase rather than broad repo-wide timer refactors.

### Testing Scope
- Add regression tests for the specific audited bugs: symmetry undo, spatial basket hit-testing/hover, and timer cleanup on unmount or rapid replay.
- Prefer colocated unit/integration tests that match the repository's current Jest + Testing Library approach.
- Avoid broad snapshot-only coverage; each new test should prove the concrete audited behavior.
- Preserve existing sensory-friendly copy and UI expectations while adding the new tests.

### Claude's Discretion
- Claude can choose whether the shared timer cleanup helper lives as a reusable hook or a smaller phase-local utility, as long as cleanup guarantees are explicit and test-covered.
- Claude can decide the exact geometry representation for Number Picnic bounds as long as the visual basket and logical drop target stay aligned.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/DrawingCanvas.tsx` already owns the drawing history and symmetry application flow where undo must be corrected.
- `src/components/numberpicnic/PicnicBlanket.tsx`, `src/components/numberpicnic/PicnicBasket.tsx`, and `src/utils/numberPicnicLogic.ts` already split Number Picnic rendering and logic in a way that can absorb measured-bounds wiring.
- `src/screens/usePatternTrainGame.ts` already demonstrates a tracked-timeout pattern that can guide safer timer cleanup here.
- `src/test-utils/` and existing colocated Jest tests provide the current regression-testing style to follow.

### Established Patterns
- Interactive game behavior is usually owned by a focused component or hook rather than a global manager.
- Timer-driven flows should stay simple and local, but must clean up on unmount to avoid stale state updates.
- Tests are colocated with the component or hook they protect and commonly use fake timers for deterministic timing assertions.
- The app favors calm, predictable UX, so correctness fixes should align visible affordances with actual interaction results.

### Integration Points
- `src/components/DrawingCanvas.tsx` and its tests are the main integration point for PLAY-01.
- `src/screens/NumberPicnicScreen.tsx`, `src/components/numberpicnic/PicnicBlanket.tsx`, `src/components/numberpicnic/PicnicBasket.tsx`, and `src/utils/numberPicnicLogic.ts` together form the integration seam for PLAY-02, PLAY-03, STAB-03, and PERF-03.
- `src/components/GameBoard.tsx` remains relevant as a timer-driven gameplay surface and should be checked for cleanup consistency if Phase 2 changes affect shared timeout handling.

</code_context>

<specifics>
## Specific Ideas

Match the game logic to what the child sees on screen: one mirrored action should undo as one action, and Number Picnic should only reward a drop when the item is actually over the basket. Timer cleanup changes should stay invisible to the player except for removing stale or confusing behavior.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>
