# Mochi Mascot — Design Spec

**Date:** 2026-03-18  
**Status:** Approved  
**Type:** Visual Identity / Feature

---

## Overview

Mochi is a soft, rounded blob creature that serves as the app's calming, nurturing mascot. Present throughout the experience — home screen, game intros, in-game moments, and completions — Mochi provides a consistent emotional thread without ever being distracting or demanding attention. Every child deserves a quiet friend alongside them.

---

## Visual Design

### Shape & Structure

- **Body:** Single soft oval/blob shape — no sharp corners, no hard edges
- **Legs:** Two small stubby ovals protruding from the bottom of the body
- **Face:** Two closed-eye smile arcs (like a happy cat purring) + optional soft blush circles
- **Construction:** Pure SVG — circles and bezier curves only, no complex paths

### Color

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Mochi body | `#D4A5E8` (warm lavender) | `#9B7BB0` (muted lavender) |
| Highlight | `#EDE0F5` (pale lavender) | `#B89CC8` (lighter muted) |
| Shadow | `#C496D8` (deeper lavender) | `#7A5E94` (darker muted) |
| Blush | `#F0C0D8` (soft pink) | `#C890B0` (muted pink) |

Mochi colors complement the existing `PASTEL_COLORS.accent` and sit naturally alongside all nine game accent colors without clashing.

### Size Variants

| Variant | Use Case | Approx. Size |
|---------|----------|-------------|
| `sm` | In-game corner presence, settings | 40-50px |
| `md` | Game intro modal, home screen secondary | 60-80px |
| `lg` | Home screen hero, completion celebration | 100-120px |

### Animation Style

| Animation | Description | Duration/Period |
|-----------|-------------|----------------|
| `floating` | Gentle sine-wave vertical drift | 3-4s period, 2-4px amplitude |
| `breathing` | Subtle scale pulse (1.0 → 1.02 → 1.0) | 3s period |
| `happy-bounce` | Quick vertical bounce on positive events | 400ms |
| `sparkle` | Small particle burst on completion | 600ms |
| `wiggle` | Gentle side-to-side wiggle on tap (if tap interaction enabled) | 300ms |

**All animations are disabled when `settings.reducedMotionEnabled` is true.** Mochi renders in a fully static pose in that case.

---

## Placement by Screen

### Home Screen

- **Position:** Floating near the title area, slight left-offset from the title text
- **Size:** `lg`
- **Behavior:** Gentle floating bob at rest. When a game card is pressed, Mochi does a soft happy-bounce before the navigation fires. Subtle and pre-attentive — the child notices Mochi reacting to their choice without being redirected from their intent.

### Game Intro Modal

- **Position:** Small, top-right corner of the intro modal, or beside the encouraging text
- **Size:** `sm` or `md`
- **Behavior:** Fades in with the modal content. Static or gentle breathing only. Displays a short warm phrase (localized) like "Let's find the matching cards!" The phrase appears in a soft speech-bubble or caption style.

### In-Game

- **Position:** Fixed bottom-right corner of the game screen, above any game UI, outside the playable area
- **Size:** `sm`
- **Behavior:** Quiet presence throughout gameplay. On positive events (match found, bubble popped, balloon kept aloft), Mochi does a tiny sparkle or micro-bounce. On neutral or negative events, Mochi remains still — no negative feedback ever.
- **Games that show Mochi:** All games opt-in via a shared context flag. Initial rollout: Bubble Pop, Memory Snap, Keepy Uppy, Category Match, Drawing. Deferred: Number Picnic, Pattern Train, Breathing Garden, Glitter Fall.

### Game Completion

- **Position:** Center-bottom of the completion screen, prominent
- **Size:** `lg`
- **Behavior:** Happy-bounce + sparkle burst when the completion screen appears. Stays visible with gentle floating while the child is on the completion screen. Fades out when leaving.

### Settings Screen

- **Position:** Small presence near section headers or top-right of the settings container
- **Size:** `sm`
- **Behavior:** Static or gentle breathing. Serves as a calm visual anchor that makes the settings feel less clinical and more cared-for.

---

## Copy & Tone

All Mochi text is localized via the i18n system under the `mascot.*` key namespace.

### Principles

- **Short:** Under 10 words per phrase
- **Warm:** Affectionate, encouraging, never corrective
- **Present:** Never points out mistakes or failures
- **Patient:** Always implying "take your time"

### Phrase Examples

| Context | English Text |
|---------|-------------|
| Home greeting | "Hello, friend!" |
| Game intro | "Let's play!" |
| Game intro (specific) | "Let's find the matches!" / "Let's draw something beautiful!" |
| Positive event | "Beautiful!" / "Wonderful!" / "You're doing great!" |
| Completion | "Amazing job!" / "You're wonderful!" |
| Settings | "Here's where you can change things." |

**Mochi never says:** "Wrong", "Try again", "Not quite", "Oops", or anything that implies failure.

---

## Component Architecture

### `Mochi.tsx`

Single SVG component. Props:

```typescript
interface MochiProps {
  variant: 'floating' | 'idle' | 'happy';
  size?: 'sm' | 'md' | 'lg';
  color?: string;          // overrides theme-aware default
  animate?: boolean;       // false when reducedMotionEnabled
  className?: string;
}
```

| Variant | Animation |
|---------|-----------|
| `floating` | Gentle sine-wave vertical drift |
| `idle` | Subtle breathing scale pulse |
| `happy` | Quick vertical bounce + sparkle burst |

The SVG is constructed from:
- One `<ellipse>` for the body
- Two small `<ellipse>` elements for legs
- Two `<path>` elements for closed-eye smiles
- Two small `<circle>` elements for blush (optional)

All colors are passed as props and derived from theme context, not hardcoded.

### `MochiPresence.tsx`

A shared wrapper component that:

1. Reads `settings.reducedMotionEnabled` from context
2. Reads `settings.colorMode` for light/dark adaptation
3. Renders `<Mochi>` with appropriate `animate` and `color` props
4. Optionally accepts a `phrase` prop for intro modals — renders the localized string in a small speech bubble beside Mochi

### `useMochi()` hook

```typescript
interface UseMochiResult {
  mochiProps: MochiProps;
  showMochi: (phrase?: string) => void;
  hideMochi: () => void;
  celebrate: () => void;     // triggers happy-bounce + sparkle
}
```

Games and screens use this hook to trigger Mochi reactions without managing animation state directly.

---

## i18n Namespace

```
mascot.greeting         → "Hello, friend!"
mascot.letsPlay        → "Let's play!"
mascot.letsMatch       → "Let's find the matches!"
mascot.letsDraw        → "Let's draw something beautiful!"
mascot.letsPop         → "Let's pop some bubbles!"
mascot.letsKeepUp      → "Let's keep them aloft!"
mascot.letsCategorize  → "Let's sort these things!"
mascot.letsBreathe     → "Let's breathe together."
mascot.letsPattern     → "Let's find the pattern!"
mascot.letsCount       → "Let's count together!"
mascot.beautiful       → "Beautiful!"
mascot.wonderful       → "Wonderful!"
mascot.greatJob        → "Amazing job!"
mascot.amazing         → "You're amazing!"
mascot.takingTime      → "You're doing great!"
mascot.settingsHelper  → "Here's where you can change things."
```

---

## Rollout Plan

### Phase 1 (this spec)
- Implement `Mochi.tsx` SVG component
- Implement `MochiPresence.tsx` wrapper
- Implement `useMochi()` hook
- Add mascot i18n keys
- Integrate on Home Screen (lg, floating, game-select reaction)
- Integrate on Memory Snap (game intro modal + in-game corner + completion)

### Phase 2 (follow-up)
- Integrate on Bubble Pop, Keepy Uppy, Category Match, Drawing
- Completion celebrations for remaining games

### Phase 3 (deferred)
- Number Picnic, Pattern Train, Breathing Garden, Glitter Fall

---

## Constraints

- Mochi never overlays interactive game elements
- Mochi never appears in front of navigation or modal close buttons
- Mochi animations never block or delay gameplay
- Mochi text is never longer than 2 lines
- All Mochi visuals respect the app's existing `reducedMotionEnabled` contract
