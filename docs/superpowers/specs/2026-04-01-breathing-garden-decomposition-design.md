# Breathing Garden Decomposition Design

## Overview

Decompose `src/screens/BreathingGardenScreen.tsx` into a thin screen coordinator plus one focused breathing-session hook. The goal is to reduce the amount of animation and session-state orchestration living directly in the screen without changing the breathing experience.

This is a screen-specific cleanup, not a new cross-game framework. The output should make Breathing Garden easier to modify, test, and review while preserving its calm, predictable behavior.

## Problem

`src/screens/BreathingGardenScreen.tsx` currently mixes too many responsibilities in one file:

- screen composition and layout
- navigation and back handling
- breathing phase state
- displayed-phase transition logic
- count fade animation lifecycle
- breath counting and progress tracking
- color cycling
- music lifecycle wiring
- Mochi visibility and rendering decisions

The heaviest friction is the breathing-session orchestration. A developer has to read animation refs, transition guards, breathing progress, and layout code all at once to understand or change the screen.

## Goals

- Reduce the responsibility count of `src/screens/BreathingGardenScreen.tsx`
- Move breathing-session state and transition orchestration into one dedicated hook
- Preserve the current breathing flow, visual timing, and accessibility behavior
- Keep the new boundaries specific to Breathing Garden unless reuse is clearly justified

## Non-Goals

- Do not redesign the Breathing Garden UI
- Do not change `BreathingBall` behavior or convert it into a different control model
- Do not move music control in this pass
- Do not introduce a reusable game-session abstraction for other screens

## Target Architecture

### 1. Thin screen coordinator

`src/screens/BreathingGardenScreen.tsx` should become a composition layer responsible for:

- theme, settings, translation, and navigation hookup
- rendering `AppScreen`, `AppHeader`, buttons, and layout containers
- wiring `useBackgroundMusic()` and blur cleanup
- deciding whether to render `Mochi` or the hidden `BreathingBall` wrapper
- passing hook state and callbacks into the rendered UI

The screen should not directly own breathing-session transition logic or animation sequencing.

### 2. Breathing Garden session hook

Add a new hook, likely `src/screens/useBreathingGardenSession.ts`, that owns the breathing-session model.

This hook should own:

- current breathing phase
- displayed phase used for animated label transitions
- breathing progress
- breath count
- derived count label value
- color scheme index and color cycling
- phase label opacity animation state
- count opacity animation state
- transition guards and animation cleanup related to the breathing session

This hook answers: "what state is the breathing session in, and how should its transitions behave?"

### 3. Keep music outside the new hook

Music stays in `src/screens/BreathingGardenScreen.tsx` for this pass.

Reasons:

- the main friction is breathing-session orchestration, not music wiring
- `useBackgroundMusic()` is already a separate concern with a small API surface
- keeping music in the screen avoids turning the new hook into a catch-all owner of unrelated behavior

This keeps the extraction boundary tight and easier to test.

## File Structure

### Keep

- `src/screens/BreathingGardenScreen.tsx` - thin screen coordinator
- `src/components/BreathingBall.tsx` - breathing interaction source

### Add

- `src/screens/useBreathingGardenSession.ts` - Breathing Garden-specific session and transition orchestration
- matching hook tests

### Modify

- `src/screens/BreathingGardenScreen.tsx` - remove session orchestration and use the new hook
- existing screen tests or nearby tests as needed to preserve behavior coverage

## Data Flow

The intended dependency direction is:

1. `BreathingGardenScreen` reads settings, theme, i18n, and navigation
2. `BreathingGardenScreen` composes `useBreathingGardenSession({ animationsEnabled })`
3. the hook returns render state, animated values, and callbacks
4. `BreathingBall` emits `onPhaseChange`, `onCycleComplete`, and `onProgress` into hook-owned callbacks
5. the screen renders label text, count text, buttons, and the optional `Mochi` overlay from hook state

Important rule: the hook owns breathing-session transitions, but not navigation, music, or screen-shell concerns.

## Hook Contract

The exact names can follow repo conventions, but the hook should expose a shape close to:

- state:
  - current phase
  - displayed phase
  - progress
  - breaths
  - current count
  - current color scheme
  - animated opacity values for the phase label and count label
- actions:
  - `handlePhaseChange`
  - `handleCycleComplete`
  - `handleProgress`
  - `cycleColors`

The screen should not need to know how transition ids, animation refs, or cleanup rules work internally.

## Behavior Preservation Requirements

This refactor must preserve:

- the same inhale/exhale phase behavior
- the same displayed-phase fade transition behavior
- the same count fade behavior when animations are enabled
- the same immediate updates when animations are disabled
- the same breath counting behavior
- the same color cycling behavior
- the same music toggle and music stop-on-blur behavior
- the same Mochi rendering behavior controlled by settings

If a behavior is unclear during extraction, keep current behavior rather than simplifying it.

## Testing Strategy

### Hook coverage

Add focused tests for `src/screens/useBreathingGardenSession.ts`.

At minimum, test:

- phase updates when `handlePhaseChange` is called
- displayed-phase behavior with animations disabled
- displayed-phase transition behavior with animations enabled
- count opacity reset/fade behavior when progress changes the count
- breath counting through `handleCycleComplete`
- color cycling wraps correctly

### Screen coverage

Keep or add a screen-level test that proves `src/screens/BreathingGardenScreen.tsx` still:

- renders the title and breathing UI
- wires the back action
- exposes the music toggle
- renders the expected breathing content after hook extraction

### Verification

Run focused Breathing Garden tests first, then broader app verification and typecheck.

## Implementation Order

1. Add focused tests that lock the current breathing-session behavior
2. Implement `src/screens/useBreathingGardenSession.ts`
3. Move breathing-session logic out of `src/screens/BreathingGardenScreen.tsx`
4. Keep music wiring in the screen and confirm behavior is unchanged
5. Run focused tests, then full verification

## Success Criteria

- `src/screens/BreathingGardenScreen.tsx` is noticeably easier to read in one pass
- the new hook has one clear job: breathing-session state and transitions
- music remains separate and does not bloat the extracted hook
- no behavior regressions are introduced in breathing flow, motion handling, or music cleanup

## Follow-On Decision

After this pass, reassess whether any remaining friction justifies:

- a separate side-effects hook for Mochi or music later, or
- stopping here because the screen is clear enough with a single session hook
