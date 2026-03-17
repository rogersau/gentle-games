---
phase: 2
slug: correct-and-safe-gameplay-interactions
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + `jest-expo` 54 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm test -- --runInBand src/components/DrawingCanvas.test.tsx src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx src/components/GameBoard.test.tsx` |
| **Full suite command** | `npm run ci:shared` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant surface tests, for example `npm test -- --runInBand src/components/DrawingCanvas.test.tsx` or `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx`
- **After every plan wave:** Run `npm test -- --runInBand src/components/DrawingCanvas.test.tsx src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx src/components/GameBoard.test.tsx`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PLAY-01 | component integration | `npm test -- --runInBand src/components/DrawingCanvas.test.tsx` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 1 | PLAY-02, PLAY-03 | hook + screen integration | `npm test -- --runInBand src/utils/numberPicnicLogic.test.ts src/screens/NumberPicnicScreen.test.tsx` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 1 | PLAY-02, PLAY-03 | screen/component integration | `npm test -- --runInBand src/screens/NumberPicnicScreen.test.tsx src/utils/numberPicnicLogic.test.ts` | ✅ | ⬜ pending |
| 02-03-01 | 03 | 2 | STAB-03, PERF-03 | hook/unit + fake timers | `npm test -- --runInBand src/utils/useTrackedTimeouts.test.ts src/utils/numberPicnicLogic.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | STAB-03, PERF-03 | component integration + fake timers | `npm test -- --runInBand src/components/GameBoard.test.tsx src/utils/useTrackedTimeouts.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Expand `src/components/DrawingCanvas.test.tsx` with half- and quarter-symmetry undo batch regressions
- [ ] Expand `src/screens/NumberPicnicScreen.test.tsx` with “no overlap → no hover/no drop” and “overlap → hover/valid drop” assertions
- [ ] Expand `src/utils/numberPicnicLogic.test.ts` with cancellation tests for processing/reset timers
- [ ] Expand `src/components/GameBoard.test.tsx` with replay/unmount cancellation coverage for delayed match-resolution timers
- [ ] Add `src/utils/useTrackedTimeouts.test.ts` if the shared helper is introduced

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
