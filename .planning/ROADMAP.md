# Roadmap: Gentle Games

## Overview

Milestone `v1.1 Resolve Identified Concerns` hardens the shipped app without changing its sensory-friendly identity. The roadmap uses 4 coarse phases to first make observability privacy-safe, then fix audited gameplay and timer correctness issues, then stabilize high-risk runtime surfaces, and finally lock the milestone down with release and regression guardrails.

**Milestone:** v1.1 Resolve Identified Concerns  
**Granularity:** Coarse  
**Coverage:** 18/18 v1 requirements mapped exactly once

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Privacy-Safe Bootstrap** - Parent-controlled telemetry and safer startup observability defaults land first. (completed 2026-03-17)
- [x] **Phase 2: Correct and Safe Gameplay Interactions** - Audited gameplay interactions behave correctly and timer-driven flows stop cleanly. (completed 2026-03-17)
- [x] **Phase 3: Stable Navigation and Responsive Surfaces** - High-risk routed and interactive surfaces become safer to change and smoother to use. (completed 2026-03-17)
- [x] **Phase 4: Release Confidence and Regression Guardrails** - Cross-platform release tooling and targeted regression coverage lock in the milestone. (completed 2026-03-18)

## Phase Details

### Phase 1: Privacy-Safe Bootstrap
**Goal**: Parents can control telemetry, and the app starts with privacy-safe observability behavior by default.
**Depends on**: Nothing (first phase)
**Requirements**: PRIV-01, PRIV-02, PRIV-03, PRIV-04, STAB-02
**Success Criteria** (what must be TRUE):
  1. Parent can review and change the telemetry preference from app settings without leaving the app.
  2. On a fresh install or whenever telemetry is disabled, the app reaches the home experience without sending analytics or crash telemetry first.
  3. When telemetry is enabled, crash and analytics events send only allowlisted diagnostic fields and exclude free-form user content.
  4. If a privacy or support link cannot be opened, the user sees a calm fallback message instead of a silent or jarring failure.
  5. App startup applies required settings before observability services initialize, so cold starts behave consistently.
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Add the persisted telemetry consent contract and settings toggle
- [ ] 01-02-PLAN.md — Guard the audited website link with a calm in-app fallback
- [ ] 01-03-PLAN.md — Move observability into a consent-aware bootstrap flow and allowlisted wrappers

### Phase 2: Correct and Safe Gameplay Interactions
**Goal**: The known gameplay bugs are fixed, and timer-driven game flows stop mutating state after the player leaves.
**Depends on**: Phase 1
**Requirements**: PLAY-01, PLAY-02, PLAY-03, STAB-03, PERF-03
**Success Criteria** (what must be TRUE):
  1. In half and quarter symmetry modes, one undo removes the full mirrored drawing action created by the last stroke.
  2. Number Picnic only completes a basket drop when the dragged item overlaps the visible basket target.
  3. Number Picnic shows basket hover feedback only while the dragged item is actually over the basket.
  4. Leaving a timer-driven game screen does not trigger delayed callbacks that mutate gameplay state after the screen is gone.
  5. Rapid replay or navigation does not stack stale timers that cause duplicate flips, delayed resets, or out-of-sequence rounds.
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Make Drawing Canvas undo remove one mirrored action per tap
- [x] 02-02-PLAN.md — Align Number Picnic hover and drop behavior with visible basket overlap
- [x] 02-03-PLAN.md — Replace audited gameplay timers with tracked cancellable cleanup

### Phase 3: Stable Navigation and Responsive Surfaces
**Goal**: Concern-prone routed and interactive surfaces remain consistent under change and responsive during longer or higher-motion sessions.
**Depends on**: Phase 2
**Requirements**: STAB-01, STAB-04, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. Audited app routes continue to open correctly after route or parameter changes because navigation contracts are type-checked instead of cast-driven.
  2. Concern-prone gameplay state synchronization behaves consistently during repeated interactions without timing hacks or hidden dependency suppression.
  3. High-motion screens avoid their hottest per-frame React state churn so normal play remains smooth on lower-end devices.
  4. Long drawing sessions stay responsive and preserve progress without rewriting the full drawing history on every edit.
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Type the shared navigation contract and audited route call sites
- [x] 03-02-PLAN.md — Remove audited timing and dependency hacks from Keepy Uppy and Breathing Garden
- [x] 03-03-PLAN.md — Reduce per-frame React churn on Bubble Field and Glitter Globe
- [x] 03-04-PLAN.md — Debounce drawing persistence with flush-on-exit safeguards

### Phase 4: Release Confidence and Regression Guardrails
**Goal**: The hardened app can be shipped and validated confidently across web, Android, and iOS concern-prone paths.
**Depends on**: Phase 3
**Requirements**: RELG-01, RELG-02, RELG-03, RELG-04
**Success Criteria** (what must be TRUE):
  1. Running release automation uploads source maps for web and native fallback paths so production failures remain debuggable across platforms.
  2. Automated regression coverage catches startup telemetry and bootstrap regressions before release.
  3. Automated regression coverage catches source-map upload regressions for web, Android, and iOS fallback paths before release.
  4. Bubble Pop, Category Match, and Memory Snap route wiring retain their interaction- and accessibility-sensitive behavior under targeted regression tests.
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Restore the regression baseline and add targeted Bubble Pop, Category Match, and Memory Snap guardrails
- [x] 04-02-PLAN.md — Fix source-map fallback path handling and add automated upload-path regression coverage
- [x] 04-03-PLAN.md — Expand startup telemetry and bootstrap regression coverage around observability lifecycle edges

## Coverage Check

| Requirement | Phase |
|-------------|-------|
| PRIV-01 | Phase 1 |
| PRIV-02 | Phase 1 |
| PRIV-03 | Phase 1 |
| PRIV-04 | Phase 1 |
| PLAY-01 | Phase 2 |
| PLAY-02 | Phase 2 |
| PLAY-03 | Phase 2 |
| STAB-01 | Phase 3 |
| STAB-02 | Phase 1 |
| STAB-03 | Phase 2 |
| STAB-04 | Phase 3 |
| PERF-01 | Phase 3 |
| PERF-02 | Phase 3 |
| PERF-03 | Phase 2 |
| RELG-01 | Phase 4 |
| RELG-02 | Phase 4 |
| RELG-03 | Phase 4 |
| RELG-04 | Phase 4 |

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Privacy-Safe Bootstrap | 3/3 | Complete   | 2026-03-17 |
| 2. Correct and Safe Gameplay Interactions | 3/3 | Complete | 2026-03-17 |
| 3. Stable Navigation and Responsive Surfaces | 4/4 | Complete | 2026-03-17 |
| 4. Release Confidence and Regression Guardrails | 3/3 | Complete | 2026-03-18 |
