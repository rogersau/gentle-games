# Phase 4: Release Confidence and Regression Guardrails - Research

**Researched:** 2026-03-17  
**Domain:** Release fallback tooling, startup observability regression coverage, and targeted route/interaction guardrails  
**Confidence:** MEDIUM

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Treat the stale `PicnicBlanket` regression as a release-confidence blocker and repair it during this phase rather than carrying a knowingly red suite into milestone completion.
- Keep source-map upload handling in the existing `scripts/upload-sourcemaps.js` fallback path instead of introducing a new release subsystem.
- Prefer extending the current Jest and Maestro coverage already wired into CI instead of introducing a new test framework.
- Keep route and interaction regressions focused on the audited concern surfaces named in the roadmap; do not broaden Phase 4 into a full app-wide accessibility overhaul.

### Claude's Discretion

None provided in `04-CONTEXT.md`.

### Deferred Ideas (OUT OF SCOPE)

None provided in `04-CONTEXT.md`.

### Additional request constraints

- Reuse existing Jest / Maestro / CI patterns where possible.
- Do not broaden scope beyond roadmap requirements unless something is a direct blocker to release confidence.
- Do not modify application code beyond writing the research artifact.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                                      | Research Support                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RELG-01 | Release automation includes web source maps in the Sentry upload path                                                                            | Documents the real export directories, current fallback-script mismatch, and the safest explicit web path mapping.                                                |
| RELG-02 | App startup telemetry and bootstrap behavior has automated regression coverage                                                                   | Maps existing App/bootstrap/Sentry/PostHog tests, then identifies missing partial-failure, install-ID, and enabled-startup permutations.                          |
| RELG-03 | Source-map upload tooling has automated regression coverage for web, Android, and iOS fallback paths                                             | Recommends a Jest-based script test patterned after `scripts/prepare-pwa.test.js`, with fixture directories for `dist/`, `dist/android/`, and `dist/ios/`.        |
| RELG-04 | Bubble Pop, Category Match, and Memory Snap route wiring have targeted regression coverage for interaction- and accessibility-sensitive behavior | Identifies the current route, screen, and component seams, then pinpoints missing tests for `GameScreen` and `CategoryMatchBoard` plus focused screen assertions. |

</phase_requirements>

## Summary

Phase 4 should stay narrowly focused on turning today’s mostly-correct repository into a trustworthy release baseline. The biggest concrete blockers are already in-repo: `scripts/upload-sourcemaps.js` assumes every platform exports to `dist/<platform>`, but the actual web build writes to `dist/`; startup observability tests cover the consent-aware happy path but not the failure permutations most likely to regress; and the shared Jest suite is still red because `src/components/numberpicnic/PicnicBlanket.test.tsx` asserts the removed upward-threshold drop behavior instead of the overlap contract Phase 2 introduced.

The existing stack is already sufficient. Jest + `jest-expo` cover nearly all of the phase with good seams: `App.test.tsx` already exercises `AppContent`, `src/utils/observabilityBootstrap.test.ts` covers the aggregator, `src/utils/analytics*.test.ts` and `src/utils/sentry.test.ts` cover consent wrappers, `HomeScreen.test.tsx` proves route launch wiring, `BubbleField.test.tsx` and `GameBoard.test.tsx` cover real interaction logic, and CI already runs `npm run ci:shared`, `npm run build:web`, native exports, and Android Maestro smoke. The gap is not tooling breadth; it is a few missing regression cases and one stale test contract.

For the source-map work, the safest low-scope change is to keep the existing fallback script but make platform output roots explicit instead of inferred. Current build commands produce web output in `dist/`, Android in `dist/android/`, and iOS in `dist/ios/`. The fallback script should special-case web to the real export root rather than scanning `dist/web`. Use Jest to lock that assumption down with synthetic fixture trees so future script changes break fast without requiring live Sentry uploads.

**Primary recommendation:** Start by restoring a green shared Jest baseline via the stale `PicnicBlanket` test, then land explicit source-map path tests/fix, then extend observability and route regressions using existing Jest files and one or two new focused test files only where the repo currently has no seam.

## Standard Stack

### Core

| Library                         | Version          | Purpose                                 | Why Standard                                                                                 |
| ------------------------------- | ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `expo`                          | `~54.0.33`       | Cross-platform export/build entry point | All current release/export commands are `expo export`; Phase 4 should stay inside that path. |
| `jest`                          | `^29.7.0`        | Primary regression runner               | Already powers `npm run test:ci` and all relevant phase tests.                               |
| `jest-expo`                     | `~54.0.12`       | Expo-aware Jest preset                  | Existing RN/Expo tests already rely on it through `jest.config.js`.                          |
| `@testing-library/react-native` | `^13.3.3`        | Screen/component interaction assertions | Current route and interaction tests use it consistently.                                     |
| `maestro`                       | CI-installed CLI | Android smoke coverage                  | Already wired in `.github/workflows/ci.yml`; reuse, don’t replace.                           |

### Supporting

| Library                    | Version   | Purpose                                          | When to Use                                                            |
| -------------------------- | --------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `typescript`               | `~5.9.2`  | Type-checked route and screen contracts          | Run `npm run typecheck` for route-wiring changes and new test helpers. |
| `@react-navigation/native` | `^7.1.28` | App route container                              | Relevant for RELG-04 route guardrails.                                 |
| `@sentry/react-native`     | `^8.2.0`  | Crash telemetry wrapper + release tooling plugin | Relevant to fallback upload script and consent-aware startup coverage. |
| `posthog-react-native`     | `^4.37.1` | Analytics consent wrapper                        | Relevant to startup telemetry regression cases.                        |

### Alternatives Considered

| Instead of                         | Could Use                     | Tradeoff                                                                                                                 |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Jest script tests                  | Ad-hoc shell assertions in CI | Harder to make deterministic; current repo already has a good Node-script Jest pattern in `scripts/prepare-pwa.test.js`. |
| Existing Maestro smoke             | New E2E framework             | Violates user constraint and adds setup scope with no clear benefit for this phase.                                      |
| Extending existing fallback script | New release subsystem         | Directly conflicts with locked decision to keep `scripts/upload-sourcemaps.js` as the fallback path.                     |

**Installation:**

```bash
npm ci
```

## Recommended Plan Decomposition

### Slice 1: Restore shared CI trust by realigning the stale Number Picnic regression

**Depends on:** Nothing  
**Why first:** `npm run test:ci` is currently blocked by `src/components/numberpicnic/PicnicBlanket.test.tsx`, so every later phase verification inherits a noisy baseline until this is fixed.

### Slice 2: Repair source-map fallback directory assumptions and add path regression tests

**Depends on:** Slice 1 for a clean Jest baseline  
**Scope:** `scripts/upload-sourcemaps.js`, new script tests, and no broader release-system redesign.

### Slice 3: Expand startup observability/bootstrap regression coverage

**Depends on:** Slice 1  
**Scope:** `App.test.tsx`, `src/utils/observabilityBootstrap.test.ts`, `src/utils/sentry.test.ts`, and `src/utils/analytics.test.ts` / `analytics-fallback.test.ts`.

### Slice 4: Add targeted route/interaction guardrails for Bubble Pop, Category Match, and Memory Snap

**Depends on:** Slice 1  
**Scope:** extend current route tests and add only missing focused seams (`CategoryMatchBoard`, `GameScreen`) rather than broad E2E expansion.

### Verification strategy by slice

1. **Slice 1:** run only the repaired `PicnicBlanket` / Number Picnic tests first.
2. **Slice 2:** run a dedicated script-test path plus `npm run build:web`, `npm run validate:android`, and `npm run validate:ios`.
3. **Slice 3:** run the observability-focused Jest subset.
4. **Slice 4:** run the targeted route/interaction Jest subset, then rely on existing Android Maestro smoke in CI for final confidence.

## Standard Stack Findings for This Phase

### Current build/export outputs

| Platform | Build command                                        | Real output root | Observed bundle path                                                              |
| -------- | ---------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Web      | `npm run build:web`                                  | `dist/`          | `dist/_expo/static/js/web/index-44ac91bc4717c9b42c7c0112f7f4d316.js`              |
| Android  | `npm run validate:android` / `npm run build:android` | `dist/android/`  | `dist/android/_expo/static/js/android/index-e8519cb31335a7a2f90a557b2b715c2c.hbc` |
| iOS      | `npm run validate:ios` / `npm run build:ios`         | `dist/ios/`      | `dist/ios/_expo/static/js/ios/index-08bffe8ae7511e1bb88450089a0e15dc.hbc`         |

### Current fallback upload flow

| Step   | Current behavior                                                                                               | Result                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Build  | `npm run sentry:release` runs `npm run build:all` then `npm run upload:sourcemaps`                             | Uses existing Expo exports only                                         |
| Scan   | `scripts/upload-sourcemaps.js` loops `['web', 'ios', 'android']` and checks `dist/<platform>`                  | Web always misses, because web exports to `dist/` not `dist/web/`       |
| Upload | Runs `npx sentry-cli releases files <release> upload-sourcemaps <distDir> --url-prefix ~/<platform> --rewrite` | Only reached if the platform directory exists and contains `.map` files |

### Minimal-risk web fix

Use an explicit platform-output map instead of assuming `dist/<platform>`:

```js
const platformOutputs = {
  web: path.join(root, 'dist'),
  android: path.join(root, 'dist', 'android'),
  ios: path.join(root, 'dist', 'ios'),
};
```

That keeps native behavior unchanged and fixes the web root mismatch without adding a new subsystem. If the implementation scans `dist/` for web, it must either:

- restrict traversal to web-owned paths, or
- explicitly skip `dist/android` and `dist/ios`,

otherwise a `build:all` run could cause the web scan to pick up native artifacts.

### Important observed limitation

Local exports produced bundle files but no `.map` files under `dist/`, `dist/android/`, or `dist/ios/`. That means:

- the web path mismatch is definitely real,
- native fallback directory assumptions are real,
- but actual source-map generation in release-like environments is not verified from this repo alone.

Treat script-path regression tests as mandatory, and treat end-to-end proof of real `.map` emission as an open validation step rather than an assumed fact.

## Architecture Patterns

### Recommended Project Structure

```text
scripts/
├── upload-sourcemaps.js       # fallback release script under test
├── upload-sourcemaps.test.js  # new Jest regression coverage for path assumptions
└── prepare-pwa.test.js        # existing pattern to copy

src/
├── utils/
│   ├── observabilityBootstrap.ts
│   ├── observabilityBootstrap.test.ts
│   ├── analytics.ts
│   ├── analytics.test.ts
│   └── sentry.test.ts
├── screens/
│   ├── HomeScreen.test.tsx
│   ├── BubbleScreen.test.tsx
│   ├── CategoryMatchScreen.test.tsx
│   └── GameScreen.test.tsx    # recommended new seam
└── components/
    ├── BubbleField.test.tsx
    ├── GameBoard.test.tsx
    └── CategoryMatchBoard.test.tsx # recommended new seam
```

### Pattern 1: Layered startup observability coverage

**What:** Keep bootstrap tests split by responsibility: App loading gate, aggregator behavior, analytics wrapper behavior, and Sentry wrapper behavior.  
**When to use:** Any change touching telemetry consent, startup ordering, install IDs, or failure handling.  
**Example:**

```typescript
// Source: App.tsx + src/utils/observabilityBootstrap.ts
useEffect(() => {
  if (isLoading) {
    return;
  }

  void reconcileObservability(settings.telemetryEnabled).catch((error: unknown) => {
    console.warn(
      'Observability bootstrap failed. Continuing without analytics or crash reporting.',
      error,
    );
  });
}, [isLoading, settings.telemetryEnabled]);
```

### Pattern 2: Route guardrails split into route-launch tests and real interaction tests

**What:** Keep route assertions in `HomeScreen.test.tsx` and actual gameplay interaction assertions in the real component tests.  
**When to use:** RELG-04 changes to Bubble Pop, Category Match, or Memory Snap.  
**Example:**

```typescript
// Source: src/screens/HomeScreen.test.tsx
expect(mockNavigate).toHaveBeenCalledWith(HOME_GAME_ROUTES['bubble-pop']);
expect(mockNavigate).toHaveBeenCalledWith(HOME_GAME_ROUTES['category-match']);
expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
```

### Pattern 3: Reuse the existing Node-script Jest pattern for release tooling

**What:** Test script behavior by mocking `fs`, `path`, and command execution, matching `scripts/prepare-pwa.test.js`.  
**When to use:** RELG-01 and RELG-03.  
**Example:**

```javascript
// Source pattern: scripts/prepare-pwa.test.js
jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}));
```

### Anti-Patterns to Avoid

- **Scanning `dist/<platform>` for every platform:** web does not build there.
- **Using real Sentry uploads in unit tests:** too brittle; test path resolution and CLI invocation arguments instead.
- **Only testing mocked screen children:** useful for route seams, but insufficient for Category Match because there is currently no real `CategoryMatchBoard` test.
- **Reintroducing threshold assertions for Number Picnic:** the contract is overlap-based now.

## Don't Hand-Roll

| Problem                         | Don't Build                           | Use Instead                                            | Why                                                                                                        |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Release validation              | A new release orchestration subsystem | Existing `scripts/upload-sourcemaps.js` + Jest tests   | Locked decision says keep the fallback path; the missing piece is regression coverage, not a new pipeline. |
| Cross-platform regression suite | A new E2E framework                   | Existing Jest + Maestro split                          | Current CI already supports both; adding a new framework expands scope.                                    |
| Timer cleanup assertions        | Custom async polling harnesses        | Existing `useTrackedTimeouts`-based component tests    | Current game tests already use fake timers and direct callbacks effectively.                               |
| Number Picnic drop logic        | Distance/threshold heuristics         | `doesNumberPicnicRectOverlap` + explicit basket layout | Phase 2 already standardized on visible overlap.                                                           |

**Key insight:** Phase 4 should harden the repo by codifying existing behavior, not by inventing new infrastructure.

## Common Pitfalls

### Pitfall 1: Web source-map uploads silently skip because the script looks in `dist/web`

**What goes wrong:** `scripts/upload-sourcemaps.js` checks `dist/web`, but `build:web` and Azure deploy both export web to `dist/`.  
**Why it happens:** The fallback script assumes every platform follows the native subdirectory layout.  
**How to avoid:** Make the platform output roots explicit and test them with fixture directories.  
**Warning signs:** The script logs `Skipping web (no dist directory)` after a successful `npm run build:web`.

### Pitfall 2: Web scans can accidentally absorb native artifacts

**What goes wrong:** A naive “just scan `dist/` for web” fix can recurse into `dist/android` and `dist/ios` after `build:all`.  
**Why it happens:** Web is the only platform whose export root is the shared `dist/` directory.  
**How to avoid:** Skip native subtrees or constrain the search roots.  
**Warning signs:** Web upload counts unexpectedly include native bundle maps in a synthetic fixture test.

### Pitfall 3: Startup tests cover happy paths but not partial failures

**What goes wrong:** A regression in only Sentry or only PostHog can slip by because `observabilityBootstrap.test.ts` only asserts the all-pass cases.  
**Why it happens:** Coverage is split across several files, but failure aggregation is only lightly exercised.  
**How to avoid:** Add tests for one-side failure, aggregated error messages, and App-level warning behavior for enabled startup.  
**Warning signs:** `reconcileObservability` rejects differently than `AppContent` expects, or warning logs become noisy/duplicated.

### Pitfall 4: Over-mocked route tests miss real interaction regressions

**What goes wrong:** `BubbleScreen.test.tsx` and `CategoryMatchScreen.test.tsx` prove wrapper wiring, but mocked child components can hide interaction/a11y breaks in the real boards.  
**Why it happens:** Mocking keeps tests fast, but removes the audited surface.  
**How to avoid:** Keep route tests, but add one real interaction seam where none exists today (`CategoryMatchBoard.test.tsx`) and one wrapper seam where the route/screen boundary is untested (`GameScreen.test.tsx`).  
**Warning signs:** Screen tests stay green while actual drag/drop or stats/header wiring regresses.

### Pitfall 5: `PicnicBlanket.test.tsx` still encodes the removed threshold contract

**What goes wrong:** Shared CI stays red even though the implementation is already using overlap-based drop validation.  
**Why it happens:** The test calls pan-responder handlers with `dy` thresholds and no valid `dropZoneLayout`/measured overlap.  
**How to avoid:** Rewrite the test around overlap, not drag distance.  
**Warning signs:** `onItemDrop` never fires even on large upward drags.

## Code Examples

Verified patterns from the current repo:

### Explicit typed home-route launch map

```typescript
// Source: src/types/navigation.ts
export const HOME_GAME_ROUTES = {
  'memory-snap': APP_ROUTES.Game,
  drawing: APP_ROUTES.Drawing,
  'glitter-fall': APP_ROUTES.Glitter,
  'bubble-pop': APP_ROUTES.Bubble,
  'category-match': APP_ROUTES.CategoryMatch,
  'keepy-uppy': APP_ROUTES.KeepyUppy,
  'breathing-garden': APP_ROUTES.BreathingGarden,
  'pattern-train': APP_ROUTES.PatternTrain,
  'number-picnic': APP_ROUTES.NumberPicnic,
} as const;
```

### Overlap-based Number Picnic contract

```typescript
// Source: src/components/numberpicnic/PicnicBlanket.tsx
export const doesNumberPicnicRectOverlap = (
  draggedRect: WindowRect | null,
  dropZoneLayout: WindowRect | null | undefined,
): boolean => {
  if (!draggedRect || !dropZoneLayout) {
    return false;
  }

  return (
    draggedRect.x < dropZoneLayout.x + dropZoneLayout.width &&
    draggedRect.x + draggedRect.width > dropZoneLayout.x &&
    draggedRect.y < dropZoneLayout.y + dropZoneLayout.height &&
    draggedRect.y + draggedRect.height > dropZoneLayout.y
  );
};
```

### Aggregated observability bootstrap

```typescript
// Source: src/utils/observabilityBootstrap.ts
export async function reconcileObservability(telemetryEnabled: boolean): Promise<void> {
  const results = await Promise.allSettled([
    reconcileSentryConsent(telemetryEnabled),
    reconcileAnalyticsConsent(telemetryEnabled),
  ]);

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failures.length > 0) {
    throw new Error(
      failures
        .map((failure) =>
          failure.reason instanceof Error ? failure.reason.message : String(failure.reason),
        )
        .join('; '),
    );
  }
}
```

## State of the Art

| Old Approach                                  | Current Approach                                               | When Changed                                                 | Impact                                                             |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Threshold-based Number Picnic drag assertions | Visible-overlap-based drop and hover contract                  | Phase 2 (`PicnicBlanket.tsx`, `NumberPicnicScreen.test.tsx`) | Tests must assert overlap, not drag distance.                      |
| Route strings/casts spread across screens     | Shared `APP_ROUTES` / `HOME_GAME_ROUTES` contract              | Phase 3                                                      | RELG-04 should extend the typed-route guardrails, not bypass them. |
| Generic `dist/<platform>` fallback assumption | Mixed real export roots: `dist/`, `dist/android/`, `dist/ios/` | Current package/workflow scripts                             | Release fallback tests must pin the actual roots.                  |

**Deprecated/outdated:**

- `src/components/numberpicnic/PicnicBlanket.test.tsx` upward-threshold drop expectation: outdated relative to Phase 2 overlap behavior.
- `.maestro/accessibility-flow.yml` and `.maestro/game-flow.yml` names/strings: appear stale relative to current app copy and are not part of CI’s current guardrail path.

## Existing Coverage and Concrete Missing Cases

### RELG-02: startup observability / telemetry bootstrap

**Currently covered**

- `App.test.tsx`
  - waits for settings load before bootstrap
  - disabled-telemetry startup render path
  - warning + continued render when bootstrap rejects
  - route tracking constrained to typed routes
- `src/utils/observabilityBootstrap.test.ts`
  - disabled and enabled happy-path delegation
- `src/utils/analytics.test.ts`
  - no-op before enable
  - allowlisted event props and screen tracking after enable
- `src/utils/analytics-fallback.test.ts`
  - PostHog constructor failure
  - missing API key in production
  - track functions remain safe after failed init
- `src/utils/sentry.test.ts`
  - no-op helpers when disabled
  - allowlisted `beforeSend` / `beforeBreadcrumb` filtering

**Concrete missing regression cases**

1. `reconcileObservability` when **only one** dependency fails:
   - Sentry rejects / analytics resolves
   - analytics rejects / Sentry resolves
   - both reject with joined message order/assertion
2. `AppContent` enabled-startup permutation:
   - `settings.telemetryEnabled === true` after loading should call `reconcileObservability(true)`
3. `AppContent` setting transition coverage:
   - rerender from loading → ready
   - rerender from telemetry disabled → enabled
4. `reconcileSentryConsent` install-ID paths:
   - missing install ID should call `AsyncStorage.setItem`
   - storage failure should return `null` install ID without crashing the wrapper path
   - repeated enable calls after init should not reinitialize Sentry
5. `reconcileAnalyticsConsent` lifecycle:
   - disabling after enable should call `optOut`
   - pending install ID should be identified after client creation

### RELG-04: Bubble Pop, Category Match, Memory Snap

**Bubble Pop coverage today**

- `HomeScreen.test.tsx`: route launch to `APP_ROUTES.Bubble`
- `BubbleScreen.test.tsx`: back button + count increment wiring
- `BubbleField.test.tsx`: real pop interaction, frame cleanup, accessible label translation seam

**Bubble Pop concrete seam**

- Extend `BubbleScreen.test.tsx` to assert the counter’s accessibility label path, not just visible text, so route-to-screen regressions preserve the accessible surface the screen exports.

**Category Match coverage today**

- `HomeScreen.test.tsx`: route launch to `APP_ROUTES.CategoryMatch`
- `CategoryMatchScreen.test.tsx`: preview-to-board transition and correct-count increment, but with a mocked board
- No `CategoryMatchBoard.test.tsx`

**Category Match concrete seams**

1. Add `src/components/CategoryMatchBoard.test.tsx` for:
   - hovered drop-zone highlighting
   - correct drop callback
   - incorrect drop reset
   - feedback timer cleanup on unmount
2. Extend `CategoryMatchScreen.test.tsx` for:
   - streak message after 3 correct matches
   - preview disappears when sorting starts

**Memory Snap coverage today**

- `HomeScreen.test.tsx`: difficulty modal + route to `APP_ROUTES.Game`
- `GameBoard.test.tsx`: rich real-board interaction and timer cleanup coverage
- No `GameScreen.test.tsx`

**Memory Snap concrete seam**

- Add `src/screens/GameScreen.test.tsx` to prove the route wrapper still:
  - renders the Memory Snap header,
  - passes `onBackPress` through correctly,
  - exposes the `renderStats` accessibility label (`Time X, Y moves`), and
  - keeps the route wrapper aligned with `GameBoard`.

## PicnicBlanket stale-test failure

### Root cause

`src/components/numberpicnic/PicnicBlanket.test.tsx` still contains:

- **“drops item when dragged upward past threshold”**
- **“does not drop item when release is below threshold”**

That no longer matches the component. The implementation now calls `updateDragOverlap(...)`, which depends on:

1. a measured or cached item layout, and
2. a real `dropZoneLayout`,

before accepting a drop. The stale test provides neither a meaningful drop-zone rect nor an overlap-based assertion, so `onItemDrop` never fires even with `dy: -250`.

### Safest realignment

Do **not** change the implementation back toward threshold logic. Instead:

1. keep the existing visible-item and emoji-refresh tests,
2. replace the threshold test with an overlap test that supplies `dropZoneLayout`,
3. manually seed item layout for the dragged node (or mock `measureInWindow`) so the translated rect overlaps the basket on release,
4. keep a non-overlap negative test,
5. leave overlap math ownership in `doesNumberPicnicRectOverlap`, which `NumberPicnicScreen.test.tsx` already exercises directly.

### Why this is the safest fix

- It restores alignment with Phase 2’s shipped contract.
- It repairs the red suite without reopening gameplay logic.
- It keeps regression ownership at the component boundary instead of relying only on screen-level smoke.

## Open Questions

1. **Do release-like environments emit `.map` files into the same directories local exports used here?**
   - What we know: local `build:web`, `validate:android`, and `validate:ios` runs produced bundles in `dist/`, `dist/android/`, and `dist/ios/`, but no `.map` files were present.
   - What's unclear: whether CI/EAS/Sentry-plugin release paths emit `.map` files elsewhere or inject upload behavior outside the fallback script.
   - Recommendation: treat this as a validation step during implementation, not as a precondition for writing the path-regression tests.

2. **Are current `--url-prefix` values in the fallback script sufficient for Expo’s `_expo/static/js/<platform>` bundle paths?**
   - What we know: observed bundle files live under `_expo/static/js/web|android|ios`, while the script currently uses `~/web`, `~/android`, and `~/ios`.
   - What's unclear: whether Sentry CLI rewriting normalizes these paths acceptably in the actual release environment.
   - Recommendation: do not broaden Phase 4 to redesign this blindly; keep the path-fix scoped to the known web-root bug, and add one implementation-time validation step against a release-like artifact/log if available.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Jest `^29.7.0` with `jest-expo ~54.0.12`; Maestro smoke in CI                                                                                                                                                                                                                                                                                                                                                     |
| Config file        | `jest.config.js`                                                                                                                                                                                                                                                                                                                                                                                                  |
| Quick run command  | `npm run test:ci -- --runTestsByPath App.test.tsx src/utils/observabilityBootstrap.test.ts src/utils/analytics.test.ts src/utils/analytics-fallback.test.ts src/utils/sentry.test.ts src/screens/HomeScreen.test.tsx src/screens/BubbleScreen.test.tsx src/screens/CategoryMatchScreen.test.tsx src/components/BubbleField.test.tsx src/components/GameBoard.test.tsx src/screens/NumberPicnicScreen.test.tsx -x` |
| Full suite command | `npm run ci:all`                                                                                                                                                                                                                                                                                                                                                                                                  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                          | Test Type        | Automated Command                                                                                                                                                                                                                                                                                    | File Exists?       |
| ------- | --------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| RELG-01 | Web fallback upload path uses the real web export root                            | unit/script      | `npm run test:ci -- --runTestsByPath scripts/upload-sourcemaps.test.js -x`                                                                                                                                                                                                                           | ❌ Wave 0          |
| RELG-02 | Startup bootstrap honors loading, consent, and partial failure behavior           | unit/integration | `npm run test:ci -- --runTestsByPath App.test.tsx src/utils/observabilityBootstrap.test.ts src/utils/analytics.test.ts src/utils/analytics-fallback.test.ts src/utils/sentry.test.ts -x`                                                                                                             | ✅                 |
| RELG-03 | Upload fallback covers web/android/ios path assumptions and skip behavior         | unit/script      | `npm run test:ci -- --runTestsByPath scripts/upload-sourcemaps.test.js -x`                                                                                                                                                                                                                           | ❌ Wave 0          |
| RELG-04 | Bubble Pop, Category Match, and Memory Snap keep route and interaction guardrails | unit/integration | `npm run test:ci -- --runTestsByPath src/screens/HomeScreen.test.tsx src/screens/BubbleScreen.test.tsx src/components/BubbleField.test.tsx src/screens/CategoryMatchScreen.test.tsx src/components/CategoryMatchBoard.test.tsx src/screens/GameScreen.test.tsx src/components/GameBoard.test.tsx -x` | Mixed — see Wave 0 |

### Sampling Rate

- **Per task commit:** targeted Jest path for the touched slice
- **Per wave merge:** `npm run ci:all`
- **Phase gate:** `npm run ci:all`, then rely on existing CI `android-smoke` job for Maestro confirmation before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/upload-sourcemaps.test.js` — covers RELG-01 and RELG-03 with fixture directories and mocked `execSync`
- [ ] `src/components/CategoryMatchBoard.test.tsx` — covers RELG-04 real drag/drop and accessibility-sensitive board behavior
- [ ] `src/screens/GameScreen.test.tsx` — covers RELG-04 route-wrapper wiring for Memory Snap
- [ ] Extend `App.test.tsx` — add enabled-startup and rerender transition coverage for RELG-02
- [ ] Extend `src/utils/observabilityBootstrap.test.ts` — add partial-failure aggregation for RELG-02
- [ ] Extend `src/utils/sentry.test.ts` / `src/utils/analytics.test.ts` — add install-ID and opt-out lifecycle coverage for RELG-02

## Sources

### Primary (HIGH confidence)

- Repository source: `scripts/upload-sourcemaps.js`
- Repository source: `package.json`
- Repository source: `.github/workflows/ci.yml`
- Repository source: `.github/workflows/azure-dev-deploy.yml`
- Repository source: `.github/workflows/azure-prod-deploy.yml`
- Repository source: `App.tsx`
- Repository source: `App.test.tsx`
- Repository source: `src/utils/observabilityBootstrap.ts`
- Repository source: `src/utils/observabilityBootstrap.test.ts`
- Repository source: `src/utils/analytics.ts`
- Repository source: `src/utils/analytics.test.ts`
- Repository source: `src/utils/analytics-fallback.test.ts`
- Repository source: `src/utils/sentry.ts`
- Repository source: `src/utils/sentry.test.ts`
- Repository source: `src/screens/HomeScreen.test.tsx`
- Repository source: `src/screens/BubbleScreen.test.tsx`
- Repository source: `src/screens/CategoryMatchScreen.test.tsx`
- Repository source: `src/components/BubbleField.test.tsx`
- Repository source: `src/components/GameBoard.test.tsx`
- Repository source: `src/components/numberpicnic/PicnicBlanket.tsx`
- Repository source: `src/components/numberpicnic/PicnicBlanket.test.tsx`
- Repository source: `src/screens/NumberPicnicScreen.test.tsx`
- Local command output: `npm run validate:android`
- Local command output: `npm run validate:ios`
- Local command output: `find dist ...`, `find dist/android ...`, `find dist/ios ...`
- Local command output: targeted Jest runs for observability/route suites and the failing `PicnicBlanket` suite

### Secondary (MEDIUM confidence)

- Repository pattern reference: `scripts/prepare-pwa.test.js` as the existing Node-script Jest testing model
- Repository pattern reference: `.maestro/smoke-home.yml` and CI `android-smoke` job for current Maestro usage

### Tertiary (LOW confidence)

- None. No external documentation was consulted in this run; any source-map generation assumptions beyond the observed repo outputs still need release-like validation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - versions, commands, and workflows are directly present in `package.json` and GitHub Actions files.
- Architecture: HIGH - current test seams and route/bootstrap structure are directly visible in repo code and targeted test runs.
- Pitfalls: MEDIUM - the web-root mismatch and stale PicnicBlanket failure are verified locally, but actual `.map` emission and `url-prefix` behavior still need a release-like validation step.

**Research date:** 2026-03-17  
**Valid until:** 2026-04-16
