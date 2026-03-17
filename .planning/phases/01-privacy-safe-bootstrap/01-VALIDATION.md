---
phase: 1
slug: privacy-safe-bootstrap
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + `jest-expo` |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx src/screens/HomeScreen.test.tsx src/utils/analytics.test.ts src/utils/sentry.test.ts App.test.tsx` |
| **Full suite command** | `npm run test:ci && npm run typecheck` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx src/screens/HomeScreen.test.tsx src/utils/analytics.test.ts src/utils/sentry.test.ts App.test.tsx`
- **After every plan wave:** Run `npm run test:ci && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PRIV-01 | integration | `npm test -- --runInBand src/context/SettingsContext.test.tsx` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | PRIV-01 | integration | `npm test -- --runInBand src/screens/SettingsScreen.test.tsx` | ✅ | ⬜ pending |
| 01-02-01 | 02 | 2 | PRIV-04 | unit | `npm test -- --runInBand src/utils/externalLinks.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | PRIV-04 | integration | `npm test -- --runInBand src/screens/HomeScreen.test.tsx src/utils/externalLinks.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | STAB-02, PRIV-02 | integration | `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | PRIV-02, PRIV-03 | unit/integration | `npm test -- --runInBand src/utils/analytics.test.ts src/utils/sentry.test.ts src/components/GentleErrorBoundary.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `node_modules/` install via `npm install` — Jest is not currently available in this workspace
- [ ] `src/utils/observabilityBootstrap.test.ts` — startup ordering and consent-gated bootstrap coverage for PRIV-02 and STAB-02
- [ ] `src/utils/externalLinks.test.ts` — guarded link outcome coverage for PRIV-04 (`opened`, `unsupported`, `failed`)
- [ ] Extend `App.test.tsx` — verify observability bootstrap ordering rather than only provider rendering
- [ ] Extend `src/components/GentleErrorBoundary.test.tsx` — assert the boundary routes through the shared consent-aware Sentry helper

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
