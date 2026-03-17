---
phase: 3
slug: stable-navigation-and-responsive-surfaces
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + `jest-expo` 54 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm run typecheck && npx jest --runInBand <phase-targeted tests>` |
| **Full suite command** | `npm run ci:shared` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run only the smallest relevant targeted checks, for example `npm run typecheck && npx jest --runInBand src/types/navigation.test.ts App.test.tsx` or `npm run typecheck && npx jest --runInBand src/screens/DrawingScreen.test.tsx`
- **After every plan wave:** Run `npm run ci:shared`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | STAB-01 | typecheck + component integration | `npm run typecheck && npx jest --runInBand src/types/navigation.test.ts App.test.tsx src/components/GentleErrorBoundary.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | STAB-01 | screen integration | `npm run typecheck && npx jest --runInBand src/screens/HomeScreen.test.tsx src/types/navigation.test.ts App.test.tsx src/components/GentleErrorBoundary.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | STAB-04 | component integration | `npm run typecheck && npx jest --runInBand src/components/KeepyUppyBoard.test.tsx` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 1 | STAB-04 | screen integration | `npm run typecheck && npx jest --runInBand src/screens/BreathingGardenScreen.test.tsx src/components/KeepyUppyBoard.test.tsx` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 1 | PERF-01 | component + screen integration | `npm run typecheck && npx jest --runInBand src/components/BubbleField.test.tsx src/screens/BubbleScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | PERF-01 | component + screen integration | `npm run typecheck && npx jest --runInBand src/components/GlitterGlobe.test.tsx src/screens/GlitterScreen.test.tsx src/components/BubbleField.test.tsx src/screens/BubbleScreen.test.tsx` | ✅ | ⬜ pending |
| 03-04-01 | 04 | 1 | PERF-02 | unit + fake timers | `npm run typecheck && npx jest --runInBand src/screens/useDebouncedDrawingSave.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 1 | PERF-02 | screen integration + fake timers | `npm run typecheck && npx jest --runInBand src/screens/useDebouncedDrawingSave.test.ts src/screens/DrawingScreen.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/types/navigation.ts` — shared route contract used by `App.tsx`, `HomeScreen.tsx`, and `GentleErrorBoundary.tsx`
- [ ] `src/types/navigation.test.ts` or equivalent route-contract regression test — concrete runtime assertions around exported route names/maps
- [ ] Expand `src/components/KeepyUppyBoard.test.tsx` — assert callback publication without zero-delay timer flushing and add cleanup/unmount coverage
- [ ] Expand `src/screens/BreathingGardenScreen.test.tsx` — assert stable render behavior after removing dependency suppressions
- [ ] `src/components/BubbleField.test.tsx` — direct coverage for frame-loop cleanup and single-snapshot interaction behavior
- [ ] Expand `src/screens/DrawingScreen.test.tsx` — fake-timer coverage for debounce delay, flush-on-back, and `beforeRemove` save behavior
- [ ] `src/screens/useDebouncedDrawingSave.test.ts` — direct coverage for scheduled save coalescing and explicit flush behavior

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bubble and Glitter motion feel smoother on lower-end devices | PERF-01 | Responsiveness improvements are relative and device-sensitive | Play Bubble Pop and Glitter Fall on a lower-end device or throttled emulator, then confirm motion remains calm and no obvious dropped-frame regressions appear during sustained interaction. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
