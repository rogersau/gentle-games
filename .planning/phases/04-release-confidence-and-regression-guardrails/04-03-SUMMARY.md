---
phase: 04-release-confidence-and-regression-guardrails
plan: 03
subsystem: testing
tags: [jest, react-native, expo, posthog, sentry, observability]

# Dependency graph
requires:
  - phase: 01-03
    provides: consent-aware observability bootstrap and allowlisted telemetry wrappers
  - phase: 04-01
    provides: restored regression baseline and Phase 4 test-suite confidence
provides:
  - startup-loading and consent-transition coverage around AppContent observability bootstrap
  - aggregated observability reconciliation error assertions for Sentry and analytics failures
  - lifecycle regression coverage for install ID persistence, repeated enable, and disable-after-enable telemetry flows
affects: [phase-04-closeout, release-validation, observability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD around existing observability seams instead of introducing new bootstrap abstractions
    - labeled aggregation errors for deterministic bootstrap failure assertions

key-files:
  created: []
  modified:
    - App.test.tsx
    - src/utils/observabilityBootstrap.ts
    - src/utils/observabilityBootstrap.test.ts
    - src/utils/analytics.ts
    - src/utils/analytics.test.ts
    - src/utils/sentry.test.ts
    - src/components/numberpicnic/PicnicBlanket.test.tsx

key-decisions:
  - "Kept startup regression coverage anchored to AppContent and reconcileObservability instead of adding another app-bootstrap abstraction."
  - "Prefixed aggregated observability failures with source labels so partial-failure warnings remain deterministic and debuggable."
  - "PostHog enable flow now reuses pending install IDs without double-identifying a freshly created client."

patterns-established:
  - "Observability regression pattern: cover loading-to-ready and consent transitions by rerendering the provider-backed AppContent seam."
  - "Telemetry lifecycle pattern: wrapper tests use resetModules plus per-suite SDK mocks to assert enable, disable, and install-ID behavior deterministically."

requirements-completed: [RELG-02]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 4 Plan 03: Startup Observability Regression Summary

**Consent-aware startup now has deterministic regression coverage across loading, partial failures, install-ID propagation, and analytics opt-out lifecycle edges.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T00:15:15Z
- **Completed:** 2026-03-18T00:20:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Expanded `AppContent` regression coverage so observability waits for settings, handles consent transitions, and keeps rendering after bootstrap warnings.
- Added partial-failure aggregation assertions for `reconcileObservability` so Sentry-only, analytics-only, and dual-failure cases stay predictable.
- Extended telemetry lifecycle coverage for Sentry and PostHog install-ID handling, repeated enable behavior, and disable-after-enable opt-out flow.

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand App bootstrap and observability aggregation regressions** - `2d1586d` (test), `c6b939e` (feat)
2. **Task 2: Cover Sentry and analytics consent lifecycle edge cases** - `b12313e` (test), `b071bcd` (feat)

**Plan metadata:** Pending final docs commit.

_Note: TDD tasks used RED → GREEN commits._

## Files Created/Modified
- `App.test.tsx` - Adds loading-to-ready, consent transition, and non-blocking bootstrap warning coverage around `AppContent`.
- `src/utils/observabilityBootstrap.test.ts` - Verifies labeled aggregated errors for Sentry, analytics, and dual bootstrap failures.
- `src/utils/observabilityBootstrap.ts` - Emits deterministic aggregated observability failure messages that preserve source context.
- `src/utils/analytics.test.ts` - Covers pending install ID reuse plus disable-after-enable opt-out behavior.
- `src/utils/analytics.ts` - Avoids double-identifying a freshly created PostHog client while preserving opt-in/out flow.
- `src/utils/sentry.test.ts` - Covers generated install ID persistence, analytics ID sharing, storage failure tolerance, and repeated enable idempotence.
- `src/components/numberpicnic/PicnicBlanket.test.tsx` - Restores shared typecheck compatibility for the known Phase 4 Number Picnic regression suite blocker.

## Decisions Made
- Kept startup regression coverage on the existing AppContent/reconcileObservability seam so Phase 1 bootstrap behavior remains the single source of truth.
- Made aggregated reconciliation failures source-labeled instead of raw joined messages so partial failures are easier to diagnose and assert.
- Treated duplicate PostHog `identify` calls on first enable as a real lifecycle bug and fixed it without broadening telemetry scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored shared typecheck by tightening PicnicBlanket test node-mock typing**
- **Found during:** Task 1 (Expand App bootstrap and observability aggregation regressions)
- **Issue:** Required `npm run typecheck` failed in the phase’s known Number Picnic regression test because `createNodeMock` read `element.props` from an `unknown` type.
- **Fix:** Added a narrow React element cast for `testID` access inside `src/components/numberpicnic/PicnicBlanket.test.tsx` so the pre-existing Phase 4 blocker no longer prevents verification.
- **Files modified:** `src/components/numberpicnic/PicnicBlanket.test.tsx`
- **Verification:** `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts && npm run typecheck`
- **Committed in:** `c6b939e`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to complete the plan’s mandated typecheck and stayed inside an already documented Phase 4 release-confidence blocker.

## Issues Encountered
- `npm run typecheck` surfaced the known `PicnicBlanket` test typing regression before Task 1 could complete; fixing that blocker restored the shared verification baseline without expanding runtime scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Startup observability seams now have targeted regression coverage for consent, failure aggregation, install-ID propagation, and lifecycle toggles.
- Phase 4 closeout can rely on this suite to catch telemetry/bootstrap regressions before release.

## Self-Check: PASSED
- Found `.planning/phases/04-release-confidence-and-regression-guardrails/04-03-SUMMARY.md`
- Found commit `2d1586d`
- Found commit `c6b939e`
- Found commit `b12313e`
- Found commit `b071bcd`

---
*Phase: 04-release-confidence-and-regression-guardrails*
*Completed: 2026-03-18*
