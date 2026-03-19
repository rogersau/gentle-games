---
phase: 4
slug: release-confidence-and-regression-guardrails
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **Framework**          | Jest 29 + `jest-expo` 54                                                                     |
| **Config file**        | `jest.config.js`                                                                             |
| **Quick run command**  | `npm test -- --runInBand <phase-targeted tests> && npm run typecheck`                        |
| **Full suite command** | `npm run ci:shared && npm run build:web && npm run validate:android && npm run validate:ios` |
| **Estimated runtime**  | ~60 seconds                                                                                  |

---

## Sampling Rate

- **After every task commit:** Run only the smallest relevant targeted checks, for example `npm test -- --runInBand src/components/numberpicnic/PicnicBlanket.test.tsx`, `npm test -- --runInBand scripts/upload-sourcemaps.test.js`, or `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts`.
- **After every plan wave:** Run the targeted suite for completed plans plus `npm run typecheck`.
- **Before `/gsd-verify-work`:** Shared checks and export validation must be green, with any manual-only items called out explicitly.
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement      | Test Type                          | Automated Command                                                                                                                                                 | File Exists | Status     |
| -------- | ---- | ---- | ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 04-01-01 | 01   | 1    | RELG-04          | component integration              | `npm test -- --runInBand src/components/numberpicnic/PicnicBlanket.test.tsx src/screens/NumberPicnicScreen.test.tsx`                                              | ✅          | ⬜ pending |
| 04-01-02 | 01   | 1    | RELG-04          | component + screen integration     | `npm test -- --runInBand src/components/CategoryMatchBoard.test.tsx src/screens/CategoryMatchScreen.test.tsx`                                                     | ❌ W0       | ⬜ pending |
| 04-01-03 | 01   | 1    | RELG-04          | screen/component integration       | `npm test -- --runInBand src/screens/BubbleScreen.test.tsx src/screens/GameScreen.test.tsx src/components/BubbleField.test.tsx src/components/GameBoard.test.tsx` | ❌ W0       | ⬜ pending |
| 04-02-01 | 02   | 2    | RELG-01, RELG-03 | node script unit test              | `npm test -- --runInBand scripts/upload-sourcemaps.test.js`                                                                                                       | ❌ W0       | ⬜ pending |
| 04-02-02 | 02   | 2    | RELG-01, RELG-03 | script + export validation         | `npm test -- --runInBand scripts/upload-sourcemaps.test.js && npm run build:web && npm run validate:android && npm run validate:ios`                              | ❌ W0       | ⬜ pending |
| 04-03-01 | 03   | 2    | RELG-02          | app + utility regression           | `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts && npm run typecheck`                                                              | ✅          | ⬜ pending |
| 04-03-02 | 03   | 2    | RELG-02          | observability lifecycle regression | `npm test -- --runInBand src/utils/sentry.test.ts src/utils/analytics.test.ts src/utils/analytics-fallback.test.ts && npm run typecheck`                          | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Repair `src/components/numberpicnic/PicnicBlanket.test.tsx` to reflect overlap-based drop behavior instead of the removed threshold contract
- [ ] Add `src/components/CategoryMatchBoard.test.tsx` as the missing real interaction seam for Category Match
- [ ] Add `src/screens/GameScreen.test.tsx` for Memory Snap route-wrapper coverage
- [ ] Add `scripts/upload-sourcemaps.test.js` using the existing Node-script Jest pattern
- [ ] Expand `App.test.tsx` with loading-to-ready and enabled/disabled observability bootstrap coverage
- [ ] Expand `src/utils/observabilityBootstrap.test.ts` with partial-failure aggregation coverage

---

## Manual-Only Verifications

No new manual-only validation is expected for this phase. Any deferred manual checks from earlier phases remain documented in their verification artifacts and are not silently treated as complete here.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency is bounded and phase-appropriate
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
