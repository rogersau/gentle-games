---
phase: 01-privacy-safe-bootstrap
plan: 03
subsystem: infra
tags: [react-native, posthog, sentry, privacy, observability]

# Dependency graph
requires:
  - phase: 01-01
    provides: persisted telemetryEnabled settings state for consent-aware startup
provides:
  - centralized observability reconciliation after settings finish loading
  - consent-aware PostHog lifecycle with opt-in/opt-out and allowlisted event payloads
  - consent-aware Sentry lifecycle with allowlisted event filtering and shared boundary capture
affects: [phase-04-regression, analytics, crash-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - post-settings bootstrap for startup side effects
    - allowlisted telemetry wrappers around third-party SDKs

key-files:
  created:
    - src/utils/observabilityBootstrap.ts
    - src/utils/observabilityBootstrap.test.ts
  modified:
    - App.tsx
    - App.test.tsx
    - src/utils/analytics.ts
    - src/utils/analytics.test.ts
    - src/utils/sentry.ts
    - src/utils/sentry.test.ts
    - src/components/GentleErrorBoundary.tsx
    - src/components/GentleErrorBoundary.test.tsx

key-decisions:
  - 'Observability now reconciles only after SettingsContext finishes loading so cold starts honor persisted consent.'
  - 'PostHog uses defaultOptIn=false plus explicit optIn/optOut to keep telemetry off until consent is granted in-session.'
  - 'Sentry strips free-form messages, extra data, and component stacks while preserving only allowlisted tags and the anonymous install ID.'

patterns-established:
  - 'Bootstrap pattern: app-level side effects that depend on persisted settings run from a provider-backed AppContent component.'
  - 'Telemetry pattern: wrappers sanitize allowlisted flat diagnostic fields before forwarding data to analytics or crash reporting.'

requirements-completed: [PRIV-02, PRIV-03, STAB-02]

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 1 Plan 03: Observability Bootstrap Summary

**Consent-aware startup now waits for settings, then reconciles PostHog and Sentry through allowlisted wrappers that keep telemetry off until parents enable it.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T21:07:31+11:00
- **Completed:** 2026-03-17T10:15:13Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Moved observability startup out of module-load side effects and into a single post-settings bootstrap path in `App.tsx`.
- Added consent-aware analytics and Sentry wrappers that opt in/out explicitly and only forward allowlisted diagnostic fields.
- Routed `GentleErrorBoundary` crash reporting through the shared Sentry helper so raw component stacks and ad hoc error text are not forwarded.

## Task Commits

Each task was committed atomically:

1. **Task 1: Move observability startup into an explicit post-settings bootstrap flow** - `c26c38a` (test), `34c55a9` (feat)
2. **Task 2: Enforce consent-aware allowlists in analytics, Sentry, and error-boundary capture** - `1bb5993` (test), `9207ffb` (feat)

**Plan metadata:** Recorded in the final docs commit for execution artifacts.

_Note: TDD tasks used RED → GREEN commits._

## Files Created/Modified

- `App.tsx` - Exports provider-backed `AppContent` and defers observability reconciliation until settings loading completes.
- `App.test.tsx` - Verifies settings-gated startup, telemetry-off shell rendering, and non-blocking bootstrap failure handling.
- `src/utils/observabilityBootstrap.ts` - Centralizes consent-aware reconciliation across analytics and Sentry.
- `src/utils/observabilityBootstrap.test.ts` - Locks in bootstrap reconciliation behavior for enabled and disabled telemetry states.
- `src/utils/analytics.ts` - Adds PostHog consent reconciliation, explicit opt-in/out, anonymous install ID reuse, and allowlisted event filtering.
- `src/utils/analytics.test.ts` - Verifies telemetry-off no-ops and allowlisted analytics payload shaping.
- `src/utils/sentry.ts` - Adds consent-aware initialization, allowlisted `beforeSend`/`beforeBreadcrumb` filtering, and shared screen error capture.
- `src/utils/sentry.test.ts` - Verifies disabled no-ops and Sentry allowlist filtering behavior.
- `src/components/GentleErrorBoundary.tsx` - Sends boundary errors through the shared Sentry wrapper instead of the SDK directly.
- `src/components/GentleErrorBoundary.test.tsx` - Verifies wrapper-based reporting and fallback rendering.

## Decisions Made

- Used a provider-backed `AppContent` component so settings-dependent startup work stays centralized and runs only after `SettingsContext` resolves.
- Preserved the existing public `initAnalytics` and `initSentry` entry points while adding explicit consent reconciliation helpers for future in-session toggles.
- Filtered telemetry by allowlisted keys instead of regex scrubbing so only known diagnostic fields survive across analytics, breadcrumbs, and crash events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced dynamic analytics import in Sentry consent setup**

- **Found during:** Task 2 (Enforce consent-aware allowlists in analytics, Sentry, and error-boundary capture)
- **Issue:** Jest could not execute the `import('./analytics')` callback used during Sentry initialization, which blocked task verification.
- **Fix:** Switched the analytics bridge in `sentry.ts` to a typed `require(...)` call so test and runtime environments can share the same anonymous install ID flow.
- **Files modified:** `src/utils/sentry.ts`
- **Verification:** `npm test -- --runInBand src/utils/sentry.test.ts` and full plan verification suite
- **Committed in:** `9207ffb`

**2. [Rule 3 - Blocking] Tightened sanitized payload helpers to satisfy strict TypeScript checks**

- **Found during:** Task 2 (Enforce consent-aware allowlists in analytics, Sentry, and error-boundary capture)
- **Issue:** `Object.fromEntries(...)` widened filtered telemetry values back to `unknown`/`undefined`, causing `npm run typecheck` to fail.
- **Fix:** Rewrote analytics and Sentry allowlist reducers to build typed records directly and narrowed `beforeSend` to `Sentry.ErrorEvent`.
- **Files modified:** `src/utils/analytics.ts`, `src/utils/sentry.ts`
- **Verification:** `npm run typecheck`
- **Committed in:** `9207ffb`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were verification blockers in the planned work. They preserved scope and were required to complete the consent-aware wrappers safely.

## Issues Encountered

- Existing Jest module rules rejected JSX mocks that captured `Text` from outer scope in `App.test.tsx`; the test was adjusted to lazy-require `react-native` within mocks during the RED step.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Privacy-safe observability startup is ready for later regression coverage in Phase 4.
- The remaining Phase 1 work can assume telemetry consent is already persisted and reconciled centrally.

## Self-Check: PASSED

- Found `.planning/phases/01-privacy-safe-bootstrap/01-03-SUMMARY.md`
- Found commit `c26c38a`
- Found commit `34c55a9`
- Found commit `1bb5993`
- Found commit `9207ffb`

---

_Phase: 01-privacy-safe-bootstrap_
_Completed: 2026-03-17_
