# Mochi Game Integration Design

## Overview

Mochi the mascot is extended across all 8 games in the Gentle Games app. Rather than being present during gameplay (which can distract or overwhelm), Mochi appears at meaningful moments — celebrations, milestones, and gentle check-ins. A parent toggle allows disabling Mochi in games entirely.

## Core Principles

- Mochi never disrupts gameplay or forces attention
- All appearances are brief, non-blocking, and gentle
- Phrases cycle through arrays to avoid repetition
- Mochi is disabled by default in games via parent settings toggle
- Every game has a tailored Mochi experience appropriate to its emotional rhythm

---

## Memory Snap

**Mochi Role**: Celebration only on completion.

Mochi does not appear at all during gameplay. When the game completes (all pairs matched), `celebrate()` fires — Mochi appears briefly with a happy animation and encouraging phrase.

**Celebration phrases** (cycle randomly, avoid repeat until all shown):
- `"You did it!"`
- `"Amazing!"`
- `"Wonderful!"`
- `"So clever!"`
- `"Fantastic!"`

**Parent toggle effect**: ON = Mochi celebration fires on completion. OFF = No Mochi appearance.

---

## Bubble Pop

**Mochi Role**: Corner milestone celebration.

After popping **10, 25, 50** bubbles cumulatively (resets when leaving screen), Mochi briefly appears in the corner with a happy phrase, then auto-hides after ~3 seconds.

**Position**: Bottom-right or top-right — unobtrusive, doesn't block bubble field.

**Size**: `sm`

**Variant**: `happy` — big smile, bouncy.

**Milestone phrases** (cycle through, one shown per milestone):
- `"You're on a roll!"`
- `"Pop pop pop!"`
- `"So satisfying!"`
- `"Keep going!"`
- `"Amazing!"`

**Queue behavior**: If two milestones fire close together, second celebration queues and fires after the first finishes.

**Reset**: Counter resets when leaving BubbleScreen.

**Parent toggle effect**: ON = milestones appear. OFF = no Mochi appearances.

---

## Keepy Uppy

**Mochi Role**: Corner milestone celebration.

Same mechanic as Bubble Pop but for **successful balloon taps** (not balloons popped — positive actions only).

**Milestone triggers**: 10, 25, 50 taps.

**Position, size, variant**: Same as Bubble Pop (bottom-right, `sm`, `happy`).

**Phrases**:
- `"Balloon friend loves you!"`
- `"Look at them fly!"`
- `"Beautiful taps!"`
- `"You're doing amazing!"`
- `"So graceful!"`

**Parent toggle effect**: ON = milestones appear. OFF = no Mochi appearances.

---

## Number Picnic

**Mochi Role**: Corner milestone celebration on round completion.

After completing **every 5 picnics** (cumulative across session), Mochi appears briefly.

**Position, size, variant**: Same as above.

**Phrases**:
- `"Delicious!"`
- `"What a feast!"`
- `"Picnic master!"`
- `"Yum yum yum!"`
- `"Perfect!"`

**Parent toggle effect**: ON = milestones appear. OFF = no Mochi appearances.

---

## Pattern Train

**Mochi Role**: Corner milestone celebration on pattern completion.

Same mechanic — after completing **every 5 patterns**, Mochi appears briefly.

**Position, size, variant**: Same as above.

**Phrases**:
- `"All aboard!"`
- `"Pattern pro!"`
- `"Choo choo!"`
- `"You're on track!"`
- `"Brilliant!"`

**Parent toggle effect**: ON = milestones appear. OFF = no Mochi appearances.

---

## Breathing Garden

**Mochi Role**: Mochi replaces the expanding ball — the player breathes *with* Mochi, not an abstract shape.

Mochi sits centered in the screen and gently expands during inhale, contracts during exhale, synchronized to the breathing cycle (3.5s inhale, 3.5s exhale).

### Visual Design

- **Inhale**: Mochi expands to full size (~180px), eyes open and happy, subtle sparkles appear
- **Exhale**: Mochi contracts to smaller size (~120px), eyes close to relaxed curves, softer overall appearance
- **Rippling rings**: Still expand outward from Mochi during inhale (existing behavior, not removed)
- **Color theming**: Lavender tint during inhale, soft blue during exhale (or follow selected color scheme)

### UI Elements Preserved

- Color scheme selector (Ocean, Rose, Mint, Sunset, Lavender)
- Cycle counter ("3 breaths completed")
- Inhale/Exhale text labels (fade between phases)
- Breath count number (1-4 during each phase)
- Background music toggle
- No timing changes — breathing rhythm stays identical

### Breath Indicator

Currently V1 shows no nose/mouth indicator. Future iteration may add a subtle guide.

### Parent Toggle Effect

ON = Mochi breathing guide active. OFF = Shows current abstract ball instead (existing BreathingBall behavior preserved).

---

## Drawing

**Mochi Role**: Welcome back greeting when returning to an existing drawing.

When the user opens DrawingScreen and there is an existing (saved) drawing to resume, Mochi appears briefly in the corner with a warm welcome phrase, then auto-hides.

**Trigger**: Existing drawing found on screen load.

**Position**: Top-right or bottom-right corner.

**Size**: `sm`

**Variant**: `happy`

**Phrases** (cycle through):
- `"So happy to see you!"`
- `"Your drawing awaits!"`
- `"Missed you!"`

**If no existing drawing**: No Mochi appearance (fresh canvas = new start, not a return).

**Parent toggle effect**: ON = welcome back Mochi appears. OFF = no Mochi.

---

## Glitter Globe

**Mochi Role**: Positive check-in after calm interaction.

After **15 seconds** of continuous, calm interaction with the Glitter Globe (sandbox, no pressure), Mochi briefly appears with a positive, affirming phrase, then auto-hides.

**Trigger**: 15 seconds of touch/shake interaction without leaving the screen.

**Position**: Top-right or bottom-right corner.

**Size**: `sm`

**Variant**: `happy`

**Phrases** (cycle through):
- `"This is beautiful!"`
- `"You're so creative!"`
- `"Sparkly!"`
- `"Magnificent!"`

**Parent toggle effect**: ON = check-in appears. OFF = no Mochi.

---

## Parent Settings Toggle

### Location

`SettingsScreen.tsx` — already exists, fits naturally alongside other accessibility/comfort settings.

### Setting

**"Show Mochi in games"**
- Type: Toggle/Switch
- Default: `ON` (Mochi appears as described above)
- OFF: All game-based Mochi appearances disabled across all games
- Note: Home screen Mochi (the floating companion on the home screen) is separate and always visible — this toggle only affects in-game appearances

### Implementation

Add `showMochiInGames: boolean` to SettingsContext. Each game checks this flag before triggering any Mochi appearance. If `false`, the game behaves as if Mochi doesn't exist.

---

## Implementation Notes

### Mochi State Management

- All game-based Mochi appearances use the existing `useMochi` hook and `MochiContext`
- `celebrate()` — existing function, fires completion Mochi
- `showMochi(phrase, variant)` — shows Mochi with phrase and variant, auto-hides after duration
- Phrase selection: randomly pick from game array, avoid repeat until all shown (track last shown per game in component state or hook)

### Auto-Hide Duration

- All corner milestone appearances: 3 seconds
- Drawing welcome back: 3 seconds
- Glitter Globe check-in: 3 seconds

### Queue Behavior

If a second Mochi trigger fires while one is already visible, the second queues and fires after the first completes its auto-hide. This prevents overlapping/stacking Mochi.

### Milestone Counter Scope

Counters are session-scoped (reset on leaving the screen). No cross-session persistence of milestone counts.

---

## Files to Create/Modify

### New Files
- None required — all implementation fits within existing Mochi infrastructure

### Files to Modify
- `src/screens/BubbleScreen.tsx` — add pop counter, milestone check, `showMochi` call
- `src/screens/KeepyUppyScreen.tsx` — add tap counter, milestone check, `showMochi` call
- `src/screens/NumberPicnicScreen.tsx` — add picnic completion counter, milestone check, `showMochi` call
- `src/screens/PatternTrainScreen.tsx` — add pattern completion counter, milestone check, `showMochi` call
- `src/screens/DrawingScreen.tsx` — check for existing drawing, welcome back `showMochi` call
- `src/screens/GlitterScreen.tsx` — add 15-second interaction timer, `showMochi` call
- `src/screens/BreathingGardenScreen.tsx` — replace BreathingBall with Mochi component, breathing animation
- `src/components/BreathingBall.tsx` — no changes (BreathingGarden screen will conditionally render either Ball or Mochi)
- `src/screens/BreathingGardenScreen.tsx` — add `useMochi` with breathing animation, handle inhale/exhale timing
- `src/screens/GameScreen.tsx` — ensure `celebrate()` only fires on completion (already done)
- `src/context/SettingsContext.tsx` — add `showMochiInGames` boolean
- `src/screens/SettingsScreen.tsx` — add toggle for `showMochiInGames`
- `src/i18n/locales/en-AU.json` / `en-US.json` — add mascot phrase keys per game
- Tests for all modified screens

---

## Out of Scope

- Home screen Mochi changes (already working, not in scope)
- Mochi animations beyond expand/contract (breathing) and existing happy/idle/floating variants
- Sound effects tied to Mochi appearances
- Cross-game Mochi continuity (Mochi doesn't remember which game you played last)
