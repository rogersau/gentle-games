---
phase: 04-release-confidence-and-regression-guardrails
plan: 02
subsystem: infra
tags: [sentry, sourcemaps, release, jest, expo]

# Dependency graph
requires:
  - phase: 04-01
    provides: targeted regression baseline restoration for Phase 4 follow-up work
provides:
  - explicit fallback source-map roots for web, Android, and iOS exports
  - Jest regression coverage for fallback upload path assumptions and skip behavior
affects: [release-tooling, ci, sentry, phase-04-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [CommonJS script entrypoint guards, explicit platform-output mapping, mocked Node script regression tests]

key-files:
  created: [scripts/upload-sourcemaps.test.js]
  modified: [scripts/upload-sourcemaps.js]

key-decisions:
  - "Kept the fallback uploader in scripts/upload-sourcemaps.js and fixed it with an explicit platform map instead of introducing a new release subsystem."
  - "Web source-map scans now treat dist/ as the real export root while explicitly skipping dist/android and dist/ios to avoid mixed-platform uploads after build:all."

patterns-established:
  - "Node release scripts should export minimal helpers and only execute under require.main === module so Jest can import them safely."
  - "Fallback upload path regressions are protected with mocked fs/path/execSync tests instead of live Sentry uploads."

requirements-completed: [RELG-01, RELG-03]

# Metrics
duration: 5m
completed: 2026-03-18
---

# Phase 4 Plan 02: Fix source-map fallback path handling and add automated upload-path regression coverage Summary

**Sentry fallback uploads now target the real Expo export roots for web, Android, and iOS, with Jest coverage preventing web/native source-map path drift.**

## Performance

- **Duration:** 5m
- **Started:** 2026-03-18T00:15:26Z
- **Completed:** 2026-03-18T00:20:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added a dedicated Jest suite for the fallback source-map uploader using the repo’s existing mocked Node-script test pattern.
- Refactored `scripts/upload-sourcemaps.js` behind a `require.main === module` guard so it can be imported safely in tests.
- Replaced the incorrect `dist/<platform>` web assumption with explicit platform roots and blocked web scans from absorbing native artifacts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make the fallback upload script importable and add platform-path regression tests** - `9add0bd` (test)
2. **Task 2: Implement explicit web/android/ios fallback roots and preserve current release commands** - `89c0136` (feat)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `scripts/upload-sourcemaps.test.js` - Adds deterministic regression coverage for import safety, platform-root mapping, web/native scan isolation, and graceful skip behavior.
- `scripts/upload-sourcemaps.js` - Exports testable helpers, adds a guarded CLI entrypoint, and maps fallback upload roots to `dist/`, `dist/android`, and `dist/ios`.

## Decisions Made
- Kept the existing fallback uploader and fixed only the audited root-path behavior instead of redesigning Sentry release handling.
- Preserved the existing `--url-prefix` contract per platform while changing only filesystem-root resolution.
- Protected web scans by ignoring native export subdirectories during recursive `.map` discovery.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The repository already had an unrelated modified `src/utils/observabilityBootstrap.ts` in the working tree; it was left untouched and excluded from task commits to keep this plan scoped.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 04-03 can extend startup observability regression coverage on top of a release script that now matches real export roots.
- CI retains the existing `build:web`, `validate:android`, and `validate:ios` commands unchanged, so later release-confidence work can rely on the same entrypoints.

## Self-Check: PASSED
- Verified summary file exists at `.planning/phases/04-release-confidence-and-regression-guardrails/04-02-SUMMARY.md`.
- Verified task commits `9add0bd` and `89c0136` exist in git history.

---
*Phase: 04-release-confidence-and-regression-guardrails*
*Completed: 2026-03-18*
