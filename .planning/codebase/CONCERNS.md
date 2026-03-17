# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**Monolithic interactive components:**
- Issue: Large files combine rendering, gesture handling, timers, accessibility, animation orchestration, and game rules in single modules. Keep new changes small and extract hooks or child components before expanding behavior further.
- Files: `src/components/DrawingCanvas.tsx`, `src/components/GlitterGlobe.tsx`, `src/screens/PatternTrainScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/components/numberpicnic/PicnicBasket.tsx`
- Impact: Changes are high-risk, review is slow, and regressions spread across unrelated behavior.
- Fix approach: Split stateful logic into focused hooks such as drawing history, motion loop, drag/drop, and screen routing helpers; keep UI components mostly presentational.

**Stringly typed navigation contracts:**
- Issue: Navigation uses untyped route strings and `as never` casts instead of a typed param list.
- Files: `App.tsx`, `src/screens/HomeScreen.tsx`, `src/components/GentleErrorBoundary.tsx`
- Impact: Route renames or parameter changes fail at runtime instead of compile time.
- Fix approach: Introduce a typed stack param list and replace string literals with typed navigation helpers.

**Hook dependency suppressions and deferred callbacks:**
- Issue: State synchronization relies on `setTimeout(..., 0)` and disabled exhaustive-deps warnings to avoid render-loop issues.
- Files: `src/components/KeepyUppyBoard.tsx`, `src/screens/BreathingGardenScreen.tsx`, `src/test-utils/infiniteLoopDetection.ts`
- Impact: Behavior depends on timing quirks, making state flow harder to reason about and easier to break during refactors.
- Fix approach: Move mutable callbacks into stable refs or dedicated hooks, and remove dependency suppressions once update flow is explicit.

## Known Bugs

**Drawing undo breaks symmetry groups:**
- Symptoms: Undo removes only one mirrored entry even when one action created multiple symmetry copies.
- Files: `src/components/DrawingCanvas.tsx`
- Trigger: Draw in `half` or `quarter` symmetry mode, then press undo.
- Workaround: Press undo multiple times until every mirrored copy is removed.

**Number Picnic drop target is not spatially wired:**
- Symptoms: Any sufficiently upward drag counts as a basket drop, and basket highlighting tracks “currently dragging” rather than “currently over basket”.
- Files: `src/screens/NumberPicnicScreen.tsx`, `src/components/numberpicnic/PicnicBlanket.tsx`, `src/components/numberpicnic/PicnicBasket.tsx`, `src/utils/numberPicnicLogic.ts`
- Trigger: Drag any item upward by more than about 200px without actually intersecting the basket.
- Workaround: Use the current “drag upward” gesture model; do not rely on visible basket bounds.

**Web source maps are skipped by the Sentry upload fallback:**
- Symptoms: `npm run sentry:release` uploads iOS and Android maps from `dist/ios` and `dist/android`, but the web export lives in `dist/` while the script looks for `dist/web`.
- Files: `package.json`, `scripts/upload-sourcemaps.js`
- Trigger: Run `npm run sentry:release` after `npm run build:all`.
- Workaround: Upload web maps manually from `dist/` or adjust the script before using the fallback path.

## Security Considerations

**Telemetry is enabled in production without an in-app consent or opt-out control:**
- Risk: A child-focused app sends analytics and crash telemetry by default in production, which creates privacy-review pressure even with anonymous identifiers.
- Files: `app.config.js`, `App.tsx`, `src/utils/analytics.ts`, `src/utils/sentry.ts`, `src/context/SettingsContext.tsx`
- Current mitigation: `src/utils/sentry.ts` generates a random install ID and strips some common PII patterns from strings; `src/utils/analytics.ts` tracks only app events and screen names.
- Recommendations: Add a parent-controlled telemetry toggle in `src/context/SettingsContext.tsx` and gate `initAnalytics` / `initSentry` in `App.tsx` behind explicit consent.

**Sentry sanitization is partial rather than allowlisted:**
- Risk: Only string fields are regex-scrubbed. Non-string breadcrumb data, custom event context, and React component stack data can still include sensitive user-entered content.
- Files: `src/utils/sentry.ts`, `src/components/GentleErrorBoundary.tsx`
- Current mitigation: `src/utils/sentry.ts` sanitizes common email, phone, card, and SSN-like patterns from some strings.
- Recommendations: Switch to an allowlist for breadcrumb fields, strip or hash free-form values, and review whether `componentStack` should be sent at all.

**External URL handling assumes success:**
- Risk: The app opens `https://gentlegames.org` directly without `canOpenURL` or failure handling.
- Files: `src/screens/HomeScreen.tsx`
- Current mitigation: Not detected.
- Recommendations: Wrap `Linking.openURL` in a guarded helper with error handling and fallback messaging.

## Performance Bottlenecks

**Animation loops re-render React state every frame:**
- Problem: Several sensory/animation-heavy components call `setState` inside `requestAnimationFrame` or a 30fps interval.
- Files: `src/components/GlitterGlobe.tsx`, `src/components/BubbleField.tsx`, `src/components/BreathingBall.tsx`, `src/components/KeepyUppyBoard.tsx`
- Cause: Particle, bubble, breathing, and balloon motion all live in React state instead of a lower-level animation layer.
- Improvement path: Keep mutable frame data in refs, render from a canvas-style abstraction, or move continuous animation logic to Reanimated/Skia-style primitives before increasing complexity.

**Drawing persistence rewrites the full history repeatedly:**
- Problem: Saved drawings serialize the entire history to `AsyncStorage` on history changes and again on navigation events.
- Files: `src/screens/DrawingScreen.tsx`, `src/components/DrawingCanvas.tsx`
- Cause: `onHistoryChange` writes full JSON snapshots instead of debounced or incremental persistence.
- Improvement path: Debounce writes, cap retained history, and store a compact representation instead of full-path snapshots for long sessions.

**Match game and Number Picnic rely on timeout-driven state churn:**
- Problem: Delayed flips, round transitions, and processing flags schedule extra state updates that can stack during rapid navigation.
- Files: `src/components/GameBoard.tsx`, `src/utils/numberPicnicLogic.ts`, `src/components/numberpicnic/PicnicBasket.tsx`
- Cause: Time-based transitions are managed with raw `setTimeout` calls instead of tracked cancellable state machines.
- Improvement path: Centralize timers in refs with cleanup on unmount and screen changes.

## Fragile Areas

**Untethered timeouts can update after unmount:**
- Files: `src/components/GameBoard.tsx`, `src/utils/numberPicnicLogic.ts`, `src/components/KeepyUppyBoard.tsx`
- Why fragile: Match resolution, processing resets, and deferred callbacks are not all tracked and cleared on unmount.
- Safe modification: Add timeout refs for every scheduled callback and clear them in effect cleanup before changing game flow.
- Test coverage: Tests exist for `src/components/GameBoard.test.tsx` and `src/utils/numberPicnicLogic.test.ts`, but dedicated unmount/cancellation coverage is not detected for these timeout paths.

**PWA browser guards can interfere with web expectations:**
- Files: `src/utils/pwaInteractionGuards.ts`, `src/utils/pwaBackGuard.ts`, `App.tsx`
- Why fragile: Global listeners disable context menus, text selection, multi-touch zoom, and back navigation whenever the PWA guard is active.
- Safe modification: Change guard behavior only with web regression tests in place and validate editable fields, accessibility flows, and install-mode behavior manually.
- Test coverage: Good unit coverage exists in `src/utils/pwaInteractionGuards.test.ts` and `src/utils/pwaBackGuard.test.ts`, but browser/device matrix behavior still needs manual validation.

**Startup side effects run at module load:**
- Files: `App.tsx`
- Why fragile: `initSentry`, `initAnalytics`, and splash-screen calls execute during import rather than from a controlled startup hook.
- Safe modification: Move startup orchestration into a top-level component effect or bootstrap module with explicit loading/error state.
- Test coverage: Direct startup orchestration tests are not detected for `App.tsx`.

## Scaling Limits

**Drawing history is effectively unbounded:**
- Current capacity: Limited only by device memory and `AsyncStorage` capacity.
- Limit: Long drawing sessions expand `history` in `src/components/DrawingCanvas.tsx` and JSON payload size in `src/screens/DrawingScreen.tsx`, increasing render and persistence cost together.
- Scaling path: Introduce history compaction, snapshotting, and a maximum retained action count.

**Frame-based effects are tuned for small object counts only:**
- Current capacity: `src/components/BubbleField.tsx` defaults to 2-12 active bubbles, `src/components/GlitterGlobe.tsx` uses bounded particle counts, and `src/utils/keepyUppyLogic.ts` caps balloons via `MAX_BALLOONS`.
- Limit: Raising those counts scales React render work linearly and will push low-end mobile devices into dropped frames.
- Scaling path: Preserve current caps unless animation state is moved out of React render cycles.

## Dependencies at Risk

**Not detected:**
- Risk: No immediately unsupported or abandoned package stands out from repository evidence alone.
- Impact: Dependency risk is currently lower than app-logic and maintainability risk.
- Migration plan: Reassess during dependency upgrade work, especially around `expo`, `react-native`, `@sentry/react-native`, and `posthog-react-native` in `package.json`.

## Missing Critical Features

**Parent-facing privacy control for telemetry:**
- Problem: There is no settings-level control to disable analytics or crash reporting after install.
- Blocks: Shipping a stronger child-privacy posture and handling privacy-sensitive deployments without a separate build configuration.

**Robust drag-and-drop hit testing for Number Picnic:**
- Problem: The game exposes drop-zone props and logic, but the current screen wiring never uses measured basket bounds to determine whether a drop is valid.
- Blocks: Reliable touch behavior, clearer accessibility hints, and future difficulty increases for `src/screens/NumberPicnicScreen.tsx`.

## Test Coverage Gaps

**Startup and release tooling paths:**
- What's not tested: App bootstrap side effects and Sentry source-map upload behavior.
- Files: `App.tsx`, `scripts/upload-sourcemaps.js`, `app.config.js`
- Risk: Telemetry setup can silently regress, and release/debuggability issues may only surface after deployment.
- Priority: High

**Bubble and category-match UI layers:**
- What's not tested: No dedicated tests are detected for the live bubble field renderer or the category match board surface.
- Files: `src/components/BubbleField.tsx`, `src/components/CategoryMatchBoard.tsx`
- Risk: Gesture, animation, and accessibility regressions can slip through even when logic tests pass.
- Priority: Medium

**Memory Snap screen wrapper:**
- What's not tested: No dedicated screen-level test is detected for the `GameScreen` container around `GameBoard`.
- Files: `src/screens/GameScreen.tsx`
- Risk: Navigation wiring, translated labels, and back-button behavior can break without affecting lower-level board tests.
- Priority: Low

---

*Concerns audit: 2026-03-17*
