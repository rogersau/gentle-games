---
phase: 04-release-confidence-and-regression-guardrails
milestone: v1.1
created: 2026-03-17
status: locked
---

# Phase 4 Context: Release Confidence and Regression Guardrails

## Goal

Lock in the milestone with release-safe automation and targeted regression coverage so web, Android, and iOS builds remain debuggable and the audited user flows stay protected.

## Scope

This phase covers:

- RELG-01: release automation for source-map uploads across web, Android, and iOS fallback paths
- RELG-02: regression coverage for startup telemetry and observability bootstrap behavior
- RELG-03: automated checks that catch source-map upload regressions before release
- RELG-04: targeted route and interaction coverage for Bubble Pop, Category Match, and Memory Snap

## Inputs from prior phases

- Phase 1 made telemetry/bootstrap consent-aware through `App.tsx`, `src/utils/observabilityBootstrap.ts`, `src/utils/analytics.ts`, and `src/utils/sentry.ts`.
- Phase 2 changed Number Picnic from threshold-based dropping to visible-overlap dropping, which means old threshold-oriented regression expectations are now stale.
- Phase 3 added typed navigation seams in `src/types/navigation.ts`, stabilized state-heavy surfaces, and passed targeted verification plus `npm run typecheck` and `npm run build:pwa`.

## Current evidence

- CI already runs `npm run ci:shared`, platform exports, and Android Maestro smoke via `.github/workflows/ci.yml`.
- Source-map upload fallback logic exists in `scripts/upload-sourcemaps.js`, but it only scans `dist/<platform>` directories and will skip the current web export because `build:web` writes to `dist/`.
- Existing startup observability tests cover the happy path but leave gaps around partial failure handling, install-ID persistence/error paths, and top-level app bootstrap permutations.
- Existing route coverage proves Home launches several games, but regression coverage is still thin around Bubble Pop, Category Match, and Memory Snap interaction-sensitive paths.
- Repo-wide `npm run test:ci` is currently blocked by `src/components/numberpicnic/PicnicBlanket.test.tsx`, which still expects the removed upward-threshold drop behavior instead of Phase 2's overlap-based contract.

## Locked decisions

- Treat the stale `PicnicBlanket` regression as a release-confidence blocker and repair it during this phase rather than carrying a knowingly red suite into milestone completion.
- Keep source-map upload handling in the existing `scripts/upload-sourcemaps.js` fallback path instead of introducing a new release subsystem.
- Prefer extending the current Jest and Maestro coverage already wired into CI instead of introducing a new test framework.
- Keep route and interaction regressions focused on the audited concern surfaces named in the roadmap; do not broaden Phase 4 into a full app-wide accessibility overhaul.

## Expected plan slices

1. Repair and lock release automation for source-map uploads and add automated coverage for upload path assumptions.
2. Extend startup observability regression coverage so consent-aware bootstrap failures and enabled/disabled paths are exercised.
3. Add or extend targeted route/interaction regressions for Bubble Pop, Category Match, and Memory Snap.
4. Repair the stale Number Picnic regression expectation so shared CI returns to a trustworthy baseline for milestone closeout.

## Risks and constraints

- Build and upload changes must preserve current web, Android, and iOS export commands used by CI and deployment workflows.
- Startup observability tests must not reintroduce telemetry before consent or weaken the Phase 1 allowlist guarantees.
- Route regressions should validate existing calm UX and accessibility-sensitive behavior without forcing unrelated screen rewrites.
- Manual performance-feel checks from Phase 3 remain deferred by user choice and should be documented, not silently treated as complete.
