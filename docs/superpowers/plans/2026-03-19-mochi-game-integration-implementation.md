# Mochi Game Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Mochi the mascot across all 8 games with appropriate milestone celebrations, breathing guide integration, and a parent toggle to disable in-game Mochi.

**Architecture:** Mochi appearances are driven by game-specific hooks/callbacks that call `showMochi(phrase, variant)`. A new `showMochiInGames` setting gates all game-based Mochi appearances. Phrase selection uses a cycler per game to avoid repeats. MochiContext handles a single queued appearance (max 1 queued, 3rd dropped).

**Tech Stack:** React, React Native, MochiContext/MochiPresence, SettingsContext, i18n

---

## Task 1: Add `showMochiInGames` Setting

**Files:**
- Modify: `src/types/index.ts` — add `showMochiInGames: boolean` to Settings interface
- Modify: `src/context/SettingsContext.tsx` — add `showMochiInGames: true` to defaultSettings, sanitize, and load
- Modify: `src/screens/SettingsScreen.tsx` — add SettingToggle for Mochi in games
- Modify: `src/i18n/locales/en-AU.json` — add `settings.showMochiInGames.label` and `settings.showMochiInGames.description`
- Modify: `src/i18n/locales/en-US.json` — same

- [ ] **Step 1: Add `showMochiInGames` to Settings type**

Modify `src/types/index.ts` line ~35, add to Settings interface:
```typescript
showMochiInGames: boolean;
```

- [ ] **Step 2: Add default and sanitization in SettingsContext**

In `src/context/SettingsContext.tsx`:

Add to `defaultSettings`:
```typescript
showMochiInGames: true,
```

Add to `sanitizeSettings`:
```typescript
showMochiInGames: toBoolean(parsed.showMochiInGames, defaultSettings.showMochiInGames),
```

- [ ] **Step 3: Add toggle to SettingsScreen**

In `src/screens/SettingsScreen.tsx`, add after the "Reduced Motion" section (~line 111):
```tsx
{/* Show Mochi in Games */}
<View style={styles.section}>
  <SettingToggle
    label={t('settings.showMochiInGames.label')}
    description={t('settings.showMochiInGames.description')}
    value={!!settings.showMochiInGames}
    onValueChange={(value) => updateSettings({ showMochiInGames: value })}
  />
</View>
```

- [ ] **Step 4: Add i18n strings**

In `src/i18n/locales/en-AU.json`, add to `settings`:
```json
"showMochiInGames": {
  "label": "Show Mochi in games",
  "description": "Mochi appears to celebrate milestones and encourage during games. Turn off for a quieter experience."
}
```

Same for `en-US.json`.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/context/SettingsContext.tsx src/screens/SettingsScreen.tsx src/i18n/locales/en-AU.json src/i18n/locales/en-US.json
git commit -m "feat: add showMochiInGames parent setting"
```

---

## Task 2: Enhance MochiContext with Queue Behavior

**Files:**
- Modify: `src/context/MochiContext.tsx`

The spec says: max 1 queued, 3rd dropped. Currently `celebrate()` has its own timer but `showMochi` does not auto-hide — we need to add auto-hide duration and queue logic.

- [ ] **Step 1: Read current MochiContext**

- [ ] **Step 2: Add auto-hide timer ref and queue state**

Add to MochiProvider:
```typescript
const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const queuedShow = useRef<{ phrase?: string; variant?: MochiProps['variant'] } | null>(null);
const [isShowing, setIsShowing] = useState(false);
```

- [ ] **Step 3: Refactor showMochi to handle queue**

Replace `showMochi`:
```typescript
const showMochi = useCallback((p?: string, v?: MochiProps['variant']) => {
  const payload = { phrase: p || null, variant: v || 'idle' };
  
  if (isShowing) {
    // Already visible — queue if nothing queued yet
    if (!queuedShow.current) {
      queuedShow.current = payload;
    }
    // else: max 1 queued, 3rd is dropped
    return;
  }
  
  setPhrase(payload.phrase);
  setVariant(payload.variant);
  setVisible(true);
  setIsShowing(true);
  
  if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
  autoHideTimer.current = setTimeout(() => {
    hideMochiInternal();
  }, 3000);
}, [isShowing]);
```

- [ ] **Step 4: Refactor hideMochi to handle queue drain**

Extract `hideMochiInternal`:
```typescript
const hideMochiInternal = useCallback(() => {
  setVisible(false);
  setPhrase(null);
  setIsShowing(false);
  if (autoHideTimer.current) {
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = null;
  }
  
  // Drain queue
  if (queuedShow.current) {
    const next = queuedShow.current;
    queuedShow.current = null;
    // Small delay before showing next
    setTimeout(() => {
      setPhrase(next.phrase);
      setVariant(next.variant);
      setVisible(true);
      setIsShowing(true);
      autoHideTimer.current = setTimeout(() => {
        hideMochiInternal();
      }, 3000);
    }, 300);
  }
}, []);
```

Expose `hideMochi` as calling `hideMochiInternal()`.

- [ ] **Step 5: Clean up on unmount**

- [ ] **Step 6: Commit**

```bash
git add src/context/MochiContext.tsx
git commit -m "feat: enhance MochiContext with auto-hide and queue behavior"
```

---

## Task 3: Add All Mochi Phrase i18n Keys

**Files:**
- Modify: `src/i18n/locales/en-AU.json`
- Modify: `src/i18n/locales/en-US.json`

- [ ] **Step 1: Add phrase arrays to mascot namespace**

In `en-AU.json`, add inside `mascot` object (after existing keys):

```json
"celebratePhrases": ["You did it!", "Amazing!", "Wonderful!", "So clever!", "Fantastic!"],
"bubblePhrases": ["You're on a roll!", "Pop pop pop!", "So satisfying!", "Keep going!", "Amazing!"],
"keepyUppyPhrases": ["Balloon friend loves you!", "Look at them fly!", "Beautiful taps!", "You're doing amazing!", "So graceful!"],
"numberPicnicPhrases": ["Delicious!", "What a feast!", "Picnic master!", "Yum yum yum!", "Perfect!"],
"patternTrainPhrases": ["All aboard!", "Pattern pro!", "Choo choo!", "You're on track!", "Brilliant!"],
"drawingWelcomePhrases": ["So happy to see you!", "Your drawing awaits!", "Missed you!"],
"glitterPhrases": ["This is beautiful!", "You're so creative!", "Sparkly!", "Magnificent!"]
```

Same for `en-US.json`.

- [ ] **Step 2: Commit**

```bash
git add src/i18n/locales/en-AU.json src/i18n/locales/en-US.json
git commit -m "feat: add Mochi phrase arrays to i18n"
```

---

## Task 4: BubbleScreen Mochi Milestones

**Files:**
- Modify: `src/screens/BubbleScreen.tsx`

**Trigger:** Cumulative pop count hits 10, 25, or 50. Resets when leaving screen.

- [ ] **Step 1: Read BubbleScreen**

- [ ] **Step 2: Add pop counter state and milestone check**

Add state:
```typescript
const popCountRef = useRef(0);
const lastPhraseIndexRef = useRef(-1);
```

Add helper to pick phrase (avoid repeat):
```typescript
const pickPhrase = (phrases: string[], lastIndex: number): { phrase: string; index: number } => {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * phrases.length);
  } while (idx === lastIndex && phrases.length > 1);
  return { phrase: phrases[idx], index: idx };
};
```

In the pop handler (where popCount increments), add:
```typescript
popCountRef.current += 1;
const MILESTONES = [10, 25, 50];
if (MILESTONES.includes(popCountRef.current) && settings.showMochiInGames) {
  const { phrase, index } = pickPhrase(t('mascot.bubblePhrases', { returnObjects: true }) as string[], lastPhraseIndexRef.current);
  lastPhraseIndexRef.current = index;
  showMochi(phrase, 'happy');
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/BubbleScreen.tsx
git commit -m "feat: add Mochi milestone celebrations to Bubble Pop"
```

---

## Task 5: KeepyUppyScreen Mochi Milestones

**Files:**
- Modify: `src/screens/KeepyUppyScreen.tsx`

**Trigger:** Cumulative tap count hits 10, 25, 50. Resets when leaving screen.

- [ ] **Step 1: Read KeepyUppyScreen and KeepyUppyBoard**

Find where balloon taps are counted/celebrated. Look for `onBalloonTap` or similar callback.

- [ ] **Step 2: Read KeepyUppyBoard to understand tap callback**

- [ ] **Step 3: Add tap counter and milestone check to KeepyUppyScreen**

Add `useMochi` hook. Track taps in KeepyUppyScreen (not in board — screen manages state).

Find where `addBalloon` is called — that's the positive action. Increment tap counter on each add. When counter hits milestone, call `showMochi`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/KeepyUppyScreen.tsx
git commit -m "feat: add Mochi milestone celebrations to Keepy Uppy"
```

## Task 6: NumberPicnicScreen Mochi Milestones

**Files:**
- Modify: `src/screens/NumberPicnicScreen.tsx`

**Trigger:** Every 5 completed picnics (cumulative across session).

- [ ] **Step 1: Read NumberPicnicScreen**

Find where picnic completion is detected (basket turns green, `onAnimationComplete` callback, or similar).

- [ ] **Step 2: Add picnic completion counter and milestone check**

Use `useMochi` hook. On each completed picnic, increment counter. Every 5, call `showMochi`.

- [ ] **Step 3: Commit**

```bash
git add src/screens/NumberPicnicScreen.tsx
git commit -m "feat: add Mochi milestone celebrations to Number Picnic"
```

---

## Task 7: PatternTrainScreen Mochi Milestones

**Files:**
- Modify: `src/screens/PatternTrainScreen.tsx`

**Trigger:** Every 5 completed patterns (cumulative across session).

- [ ] **Step 1: Read PatternTrainScreen and usePatternTrainGame**

Find where pattern completion is detected — likely when `trainPhase` transitions to `'exiting'` after correct answer.

- [ ] **Step 2: Add pattern completion counter and milestone check**

- [ ] **Step 3: Commit**

```bash
git add src/screens/PatternTrainScreen.tsx
git commit -m "feat: add Mochi milestone celebrations to Pattern Train"
```

---

## Task 8: DrawingScreen Mochi Welcome Back

**Files:**
- Modify: `src/screens/DrawingScreen.tsx`

**Trigger:** On screen load, if an existing drawing is found (has saved drawing data).

- [ ] **Step 1: Read DrawingScreen**

Find how drawings are saved/loaded. Look for AsyncStorage keys or existing drawing state.

- [ ] **Step 2: Add useEffect to check for existing drawing**

Use `useMochi` hook. On mount, check if a saved drawing exists. If so, call `showMochi` with welcome back phrase.

Important: This should fire only once on mount, not on every render.

- [ ] **Step 3: Commit**

```bash
git add src/screens/DrawingScreen.tsx
git commit -m "feat: add Mochi welcome back to Drawing"
```

---

## Task 9: GlitterScreen Mochi Check-In

**Files:**
- Modify: `src/screens/GlitterScreen.tsx`

**Trigger:** 15 seconds of continuous interaction (touch/shake without leaving screen).

- [ ] **Step 1: Read GlitterScreen**

Find the interaction handlers (touch/drag on GlitterGlobe, accelerometer shake).

- [ ] **Step 2: Add 15-second interaction timer**

Track last interaction time. Reset timer on any touch/shake. When 15 seconds elapse with no interaction pause, fire `showMochi`.

Implementation approach: On each touch/shake, record timestamp. Use a `setInterval` or check on each frame to see if 15s has passed since last interaction. If timer fires, show Mochi once and don't repeat until user interacts again (then reset).

- [ ] **Step 3: Commit**

```bash
git add src/screens/GlitterScreen.tsx
git commit -m "feat: add Mochi check-in to Glitter Globe"
```

---

## Task 10: BreathingGardenScreen Mochi as Breathing Guide

**Files:**
- Modify: `src/screens/BreathingGardenScreen.tsx`
- Modify: `src/components/Mochi.tsx`
- Note: `BreathingBall.tsx` is NOT modified — when `showMochiInGames` is OFF, the existing `<BreathingBall>` component is rendered instead (toggle handled in BreathingGardenScreen)

**This is the most complex task.** Mochi replaces the abstract expanding ball as the breathing guide. Mochi sits centered and expands/contracts with the breath cycle.

- [ ] **Step 1: Read BreathingGardenScreen and BreathingBall**

Understand how the breathing timing is controlled — the `phase` (inhale/exhale) and `progress` (0-1 through each phase) from `breathingGardenLogic.ts`.

- [ ] **Step 2: Read Mochi.tsx**

Study the existing `scaleAnim` Animated.Value (currently drives subtle idle breathing at 1.0-1.02). The breathing guide needs scale driven by external progress (0.67 contracted → 1.0 expanded).

- [ ] **Step 3: Add breathing props to Mochi**

Modify `src/components/Mochi.tsx`:

Add to `MochiProps`:
```typescript
breathingPhase?: 'inhale' | 'exhale' | null;
breathingProgress?: number; // 0.0-1.0 through current phase
```

Stop the idle breathing animation when `breathingPhase` is set. When `breathingPhase='inhale'`, drive `scaleAnim` from 0.67 (start) to 1.0 (end) as `breathingProgress` goes 0→1. When `breathingPhase='exhale'`, drive from 1.0 back to 0.67 as `breathingProgress` goes 0→1.

Implementation approach: Add a `useEffect` that listens to `breathingProgress` and calls `Animated.timing(scaleAnim, { toValue: scale, ... })` when `breathingPhase` is set. Use ` Animated.Sequence` or direct value updates.

Add open eyes to the SVG: add a `<Ellipse>` for left and right open eyes, wrapped in an `<Animated>` with opacity driven by an `eyeOpenAnim` Animated.Value (1 when inhale, 0 when exhale). Existing arc eyes stay visible (they represent closed/relaxed state for exhale).

When `breathingPhase='inhale'`: `eyeOpenAnim` → 1, arc eyes opacity → 0.
When `breathingPhase='exhale'`: `eyeOpenAnim` → 0, arc eyes opacity → 1.
When `breathingPhase` is null/undefined: show default closed-arc eyes (existing behavior).

- [ ] **Step 4: Update BreathingGardenScreen to use Mochi**

Replace the `<BreathingBall>` component with `<Mochi breathingPhase={phase} breathingProgress={progress} />` centered on screen.

Use the existing `phase` and `progress` values from the breathing logic. Center Mochi in the same position BreathingBall currently occupies.

Position all existing UI (cycle counter, phase labels, color scheme selector) around Mochi — same layout but Mochi is the focal point.

- [ ] **Step 5: Handle parent toggle**

In BreathingGardenScreen, check `settings.showMochiInGames`. If true, render `<Mochi ...>`. If false, render existing `<BreathingBall ...>`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Mochi.tsx src/screens/BreathingGardenScreen.tsx
git commit -m "feat: replace BreathingBall with Mochi as breathing guide"
```

When `breathingPhase='inhale'` and `progress` increases, scale increases (e.g., 0.67 → 1.0).
When `breathingPhase='exhale'` and `progress` increases, scale decreases (e.g., 1.0 → 0.67).

Use React Native's `Animated` API — same approach as BreathingBall's existing animation.

- [ ] **Step 4: Add eye state changes**

Inhale: eyes open (use existing 'happy' or 'idle' eye style).
Exhale: eyes closed/relaxed curves (need a new eye state in Mochi SVG).

Add `eyeState?: 'open' | 'closed'` to MochiProps. When `eyeState='closed'`, show curved path instead of ellipse eyes.

- [ ] **Step 5: Update BreathingGardenScreen to use Mochi**

Replace the `<BreathingBall>` component with `<Mochi scale={...} eyeState='open' />` centered on screen.

Pass breathing values from the existing `useBreathingExercise` or equivalent hook/logic.

Position all existing UI (cycle counter, phase labels, color scheme selector) around Mochi — same layout but Mochi is the focal point instead of the ball.

- [ ] **Step 6: Handle parent toggle**

If `!settings.showMochiInGames`, render existing `<BreathingBall>` instead of Mochi.

- [ ] **Step 7: Commit**

---

## Task 11: Final Verification

- [ ] Run `npm run lint` — must pass with 0 warnings
- [ ] Run `npm run test:ci` — all 62 suites, 491 tests must pass
- [ ] Review all changed files for accidental debug code or commented-out sections
- [ ] Push and confirm CI green

---

## File Summary

| File | Action |
|------|--------|
| `src/types/index.ts` | Modify |
| `src/context/SettingsContext.tsx` | Modify |
| `src/context/MochiContext.tsx` | Modify |
| `src/screens/SettingsScreen.tsx` | Modify |
| `src/screens/BubbleScreen.tsx` | Modify |
| `src/screens/KeepyUppyScreen.tsx` | Modify |
| `src/screens/NumberPicnicScreen.tsx` | Modify |
| `src/screens/PatternTrainScreen.tsx` | Modify |
| `src/screens/DrawingScreen.tsx` | Modify |
| `src/screens/GlitterScreen.tsx` | Modify |
| `src/screens/BreathingGardenScreen.tsx` | Modify |
| `src/components/Mochi.tsx` | Modify |
| `src/i18n/locales/en-AU.json` | Modify |
| `src/i18n/locales/en-US.json` | Modify |
