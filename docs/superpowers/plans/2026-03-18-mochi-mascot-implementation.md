# Mochi Mascot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Mochi, a soft lavender blob mascot, integrated into the Home screen and Memory Snap game (Phase 1 rollout per spec).

**Architecture:** Single SVG `Mochi` component with animation variants, a `MochiPresence` wrapper that reads `reducedMotionEnabled` and theme mode, and a `useMochi` hook for triggering reactions. All Mochi text goes through i18n under the `mascot.*` namespace.

**Tech Stack:** React Native SVG (already in use), react-i18next, React Native Animated API, existing `useSettings` / `useThemeColors` / `useReducedMotion` hooks.

---

## File Structure

```
src/components/Mochi.tsx              # New — SVG component, animation variants
src/components/MochiPresence.tsx      # New — wrapper, reads settings, renders Mochi
src/hooks/useMochi.ts                 # New — hook for triggering Mochi states
src/ui/components/index.ts            # Modify — export Mochi components
src/i18n/locales/en-AU.json           # Modify — add mascot.* keys
src/i18n/locales/en-US.json           # Modify — add mascot.* keys
src/screens/HomeScreen.tsx            # Modify — integrate MochiPresence (lg, floating)
src/screens/GameScreen.tsx           # Modify — integrate MochiPresence (intro, completion)
```

---

## Task 1: Mochi SVG Component

**Files:**
- Create: `src/components/Mochi.tsx`
- Test: `src/components/Mochi.test.tsx`

- [ ] **Step 1: Write the Mochi component test**

```tsx
// src/components/Mochi.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Mochi } from './Mochi';

describe('Mochi', () => {
  it('renders with sm size', () => {
    render(<Mochi variant="idle" size="sm" animate={false} />);
    expect(screen.getByTestId('mochi-body')).toBeTruthy();
  });

  it('renders floating variant', () => {
    render(<Mochi variant="floating" size="md" animate={false} />);
    expect(screen.getByTestId('mochi-body')).toBeTruthy();
  });

  it('renders happy variant', () => {
    render(<Mochi variant="happy" size="lg" animate={false} />);
    expect(screen.getByTestId('mochi-body')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:single -- src/components/Mochi.test.tsx`
Expected: FAIL — `Mochi` not found

- [ ] **Step 3: Write the Mochi SVG component**

```tsx
// src/components/Mochi.tsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';

export type MochiVariant = 'floating' | 'idle' | 'happy';
export type MochiSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<MochiSize, { width: number; height: number }> = {
  sm: { width: 44, height: 50 },
  md: { width: 64, height: 72 },
  lg: { width: 100, height: 112 },
};

interface MochiProps {
  variant?: MochiVariant;
  size?: MochiSize;
  color?: string;
  highlightColor?: string;
  shadowColor?: string;
  blushColor?: string;
  animate?: boolean;
  className?: string;
  testID?: string;
}

export const Mochi: React.FC<MochiProps> = ({
  variant = 'idle',
  size = 'md',
  color = '#D4A5E8',
  highlightColor = '#EDE0F5',
  shadowColor = '#C496D8',
  blushColor = '#F0C0D8',
  animate = true,
  testID = 'mochi',
}) => {
  const { width, height } = SIZE_MAP[size];
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const sparkles = [sparkle1, sparkle2, sparkle3];

  useEffect(() => {
    if (!animate) return;

    if (variant === 'floating') {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -3,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      float.start();
      return () => float.stop();
    }

    if (variant === 'idle') {
      const breathe = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      breathe.start();
      return () => breathe.stop();
    }

    if (variant === 'happy') {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
      // Sparkle burst — 3 small circles radiating outward
      if (animate) {
        sparkles.forEach((sparkle, i) => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(sparkle, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();
        });
      }
    }
  }, [variant, animate, floatAnim, scaleAnim, bounceAnim, sparkles]);

  const animatedStyle = {
    transform: [
      { translateY: floatAnim },
      { scale: scaleAnim },
      { translateY: bounceAnim },
    ],
  };

  return (
    <Animated.View style={[styles.container, { width, height }, animatedStyle]} testID={testID}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Shadow */}
        <Ellipse
          cx={width / 2}
          cy={height - 8}
          rx={width * 0.35}
          ry={6}
          fill={shadowColor}
          opacity={0.3}
        />
        {/* Body */}
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 4}
          ry={height / 2 - 10}
          fill={color}
        />
        {/* Highlight */}
        <Ellipse
          cx={width * 0.35}
          cy={height * 0.3}
          rx={width * 0.12}
          ry={height * 0.08}
          fill={highlightColor}
          opacity={0.6}
        />
        {/* Left leg */}
        <Ellipse
          cx={width * 0.35}
          cy={height - 12}
          rx={8}
          ry={10}
          fill={color}
        />
        {/* Right leg */}
        <Ellipse
          cx={width * 0.65}
          cy={height - 12}
          rx={8}
          ry={10}
          fill={color}
        />
        {/* Left eye arc (happy closed-eye smile) */}
        <Path
          d={`M ${width * 0.32} ${height * 0.45} Q ${width * 0.37} ${height * 0.5} ${width * 0.42} ${height * 0.45}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Right eye arc */}
        <Path
          d={`M ${width * 0.58} ${height * 0.45} Q ${width * 0.63} ${height * 0.5} ${width * 0.68} ${height * 0.45}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Left blush */}
        <Circle cx={width * 0.25} cy={height * 0.52} r={4} fill={blushColor} opacity={0.5} />
        {/* Right blush */}
        <Circle cx={width * 0.75} cy={height * 0.52} r={4} fill={blushColor} opacity={0.5} />
        {/* Smile */}
        <Path
          d={`M ${width * 0.38} ${height * 0.58} Q ${width / 2} ${height * 0.66} ${width * 0.62} ${height * 0.58}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Sparkles — only visible during happy variant */}
        <Circle cx={width * 0.1} cy={height * 0.2} r={3} fill={highlightColor} opacity={sparkle1} />
        <Circle cx={width * 0.9} cy={height * 0.25} r={2.5} fill={highlightColor} opacity={sparkle2} />
        <Circle cx={width * 0.15} cy={height * 0.75} r={2} fill={highlightColor} opacity={sparkle3} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:single -- src/components/Mochi.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Mochi.tsx src/components/Mochi.test.tsx
git commit -m "feat: add Mochi SVG component with idle/floating/happy variants"
```

---

## Task 2: MochiPresence Wrapper + useMochi Hook

**Files:**
- Create: `src/components/MochiPresence.tsx`
- Create: `src/hooks/useMochi.ts`
- Modify: `src/ui/components/index.ts`

- [ ] **Step 1: Write the useMochi hook (spec-aligned interface)**

The spec defines: `{ mochiProps, showMochi, hideMochi, celebrate }`.
`mochiProps` is of type `MochiProps` (variant, size, color, etc.) and drives what `MochiPresence` renders.
`showMochi(phrase?, variant?)` sets visible=true, stores the phrase, and sets the variant (defaults to `idle`).
`hideMochi()` sets visible=false.
`celebrate()` sets variant to `happy` (for 1.5s then returns to idle).

```typescript
// src/hooks/useMochi.ts
import { useState, useCallback, useRef } from 'react';
import { MochiProps } from '../components/Mochi';

export interface UseMochiResult {
  mochiProps: MochiProps & { visible: boolean; phrase: string | null };
  showMochi: (phrase?: string, variant?: MochiProps['variant']) => void;
  hideMochi: () => void;
  celebrate: () => void;
}

export const useMochi = (): UseMochiResult => {
  const [visible, setVisible] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [variant, setVariant] = useState<MochiProps['variant']>('idle');
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMochi = useCallback((p?: string, v?: MochiProps['variant']) => {
    setPhrase(p || null);
    setVariant(v || 'idle');
    setVisible(true);
  }, []);

  const hideMochi = useCallback(() => {
    setVisible(false);
    setPhrase(null);
    if (celebrateTimer.current) {
      clearTimeout(celebrateTimer.current);
      celebrateTimer.current = null;
    }
  }, []);

  const celebrate = useCallback(() => {
    setVariant('happy');
    setVisible(true);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => {
      setVariant('idle');
      celebrateTimer.current = null;
    }, 1500);
  }, []);

  return {
    mochiProps: { variant, visible, phrase },
    showMochi,
    hideMochi,
    celebrate,
  };
};
```

- [ ] **Step 2: Write the MochiPresence component (uses hook state)**

`MochiPresence` calls `useMochi()` internally and renders `Mochi` + optional phrase bubble. It does NOT accept variant/phrase as props — it drives them from the hook. Screens that want to control Mochi call the hook and pass `mochiProps` down.

```tsx
// src/components/MochiPresence.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mochi, MochiVariant, MochiSize } from './Mochi';
import { useThemeColors, useReducedMotion } from '../utils/theme';
import { Space, TypeStyle } from '../ui/tokens';

interface MochiPresenceProps {
  size?: MochiSize;
  style?: object;
  testID?: string;
}

export const MochiPresence: React.FC<MochiPresenceProps> = ({
  size = 'md',
  style,
  testID = 'mochi-presence',
}) => {
  const { resolvedMode } = useThemeColors();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const { mochiProps } = useMochi();

  const { variant = 'idle', visible, phrase } = mochiProps;

  const mochiColor = resolvedMode === 'dark' ? '#9B7BB0' : '#D4A5E8';
  const highlightColor = resolvedMode === 'dark' ? '#B89CC8' : '#EDE0F5';
  const shadowColor = resolvedMode === 'dark' ? '#7A5E94' : '#C496D8';
  const blushColor = resolvedMode === 'dark' ? '#C890B0' : '#F0C0D8';

  if (!visible) return null;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {phrase && (
        <View style={styles.phraseContainer}>
          <Text style={styles.phraseText}>{t(phrase)}</Text>
        </View>
      )}
      <Mochi
        variant={variant}
        size={size}
        color={mochiColor}
        highlightColor={highlightColor}
        shadowColor={shadowColor}
        blushColor={blushColor}
        animate={!reducedMotion}
        testID={`${testID}-mochi`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
    marginBottom: Space.xs,
  },
  phraseText: {
    ...TypeStyle.bodySm,
    color: '#5A5A5A',
    textAlign: 'center',
  },
});
```

**Note:** `phraseText` uses a neutral dark gray (`#5A5A5A`) — this is the same `text` token value used in `PASTEL_COLORS.text` for light mode, so it is context-appropriate and does not need dynamic theming for the short-lived phrase bubble.

- [ ] **Step 3: Update ui/components/index.ts**

Add exports:
```ts
export { Mochi, MochiVariant, MochiSize } from './Mochi';
export { MochiPresence } from './MochiPresence';
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMochi.ts src/components/MochiPresence.tsx src/ui/components/index.ts
git commit -m "feat: add MochiPresence wrapper and useMochi hook"
```

---

## Task 3: i18n Mascot Keys

**Files:**
- Modify: `src/i18n/locales/en-AU.json`
- Modify: `src/i18n/locales/en-US.json`

- [ ] **Step 1: Add mascot namespace to en-AU.json**

Add to the root of the JSON (before the closing `}`), merge with existing keys:

```json
,
"mascot": {
  "greeting": "Hello, friend!",
  "letsPlay": "Let's play!",
  "letsMatch": "Let's find the matches!",
  "letsDraw": "Let's draw something beautiful!",
  "letsPop": "Let's pop some bubbles!",
  "letsKeepUp": "Let's keep them aloft!",
  "letsCategorize": "Let's sort these things!",
  "letsBreathe": "Let's breathe together.",
  "letsPattern": "Let's find the pattern!",
  "letsCount": "Let's count together!",
  "beautiful": "Beautiful!",
  "wonderful": "Wonderful!",
  "greatJob": "Amazing job!",
  "amazing": "You're amazing!",
  "takingTime": "You're doing great!",
  "settingsHelper": "Here's where you can change things."
}
```

- [ ] **Step 2: Add same keys to en-US.json**

Same content as en-AU.json for now (both use the same values).

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en-AU.json src/i18n/locales/en-US.json
git commit -m "feat: add mascot i18n namespace"
```

---

## Task 4: Home Screen Integration

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add Mochi to HomeScreen**

In `HomeScreen.tsx`:

Add to imports:
```tsx
import { MochiPresence } from '../ui/components';
import { useMochi } from '../hooks/useMochi';
```

Add inside the component (after `const { t } = useTranslation();`):
```tsx
const { celebrate, showMochi, hideMochi } = useMochi();
```

In `handleGameSelect` — call `celebrate()` before navigating (Mochi fires happy bounce, auto-returns to idle after 1.5s):
```tsx
const handleGameSelect = (game: Game) => {
  setSelectedGame(game);
  if (game.id === "memory-snap") {
    setShowDifficultySelector(true);
  } else {
    celebrate();
    setTimeout(() => {
      navigation.navigate(HOME_GAME_ROUTES[game.id]);
      setSelectedGame(null);
    }, 200);
  }
};
```

Add `MochiPresence` to the titleArea — Home screen Mochi is always visible (call `showMochi()` on mount so the presence is shown):
```tsx
// Inside component — call once on mount
React.useEffect(() => {
  showMochi('mascot.greeting', 'floating');
}, [showMochi]);
```

```tsx
<View style={styles.titleArea}>
  <MochiPresence
    size="lg"
    style={styles.mochiInTitle}
  />
  <Text style={styles.title} accessibilityRole="header">
    {t("home.title")}
  </Text>
  <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
</View>
```

Add to `createStyles`:
```tsx
mochiInTitle: {
  marginBottom: Space.md,
},
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: integrate Mochi on Home screen with floating animation"
```

---

## Task 5: Memory Snap (GameScreen) Integration

**Files:**
- Modify: `src/screens/GameScreen.tsx`
- Modify: `src/components/GameBoard.tsx`

This integrates Mochi into Memory Snap at three points:
1. **Intro modal** — shown briefly when the game screen first renders
2. **In-game corner** — small Mochi sits quietly during gameplay
3. **Completion modal** — Mochi celebrates when the game ends

- [ ] **Step 1: Update GameBoard to fire `onPositiveEvent` on match**

In `GameBoard.tsx`:

**Add to `GameBoardProps` interface** (near line 14-19):
```tsx
onPositiveEvent?: () => void;  // fires when a match is found
```

**Fire it inside `handleTilePress`** — after `playMatchSound(settings);` inside the `if (isMatch)` block (around line 134):
```tsx
onPositiveEvent?.();
```

**Pass `celebrate` from GameScreen** — in `GameScreen.tsx`, add to the `GameBoard` JSX:
```tsx
<GameBoard
  onGameComplete={handleGameComplete}
  onBackPress={handleBackPress}
  bottomInset={insets.bottom}
  onPositiveEvent={celebrate}
  renderStats={({ time, moves }) => (
    <Text ...>Time: {time} · Moves: {moves}</Text>
  )}
/>
```

- [ ] **Step 2: Add Mochi to GameScreen**

In `GameScreen.tsx`:

Add to imports:
```tsx
import { MochiPresence } from '../ui/components';
import { useMochi } from '../hooks/useMochi';
```

Add state inside `GameScreen`:
```tsx
const { mochiProps, showMochi, hideMochi, celebrate } = useMochi();
const [showIntro, setShowIntro] = useState(true);
```

On mount, show Mochi with the game intro phrase:
```tsx
React.useEffect(() => {
  showMochi('mascot.letsMatch');
}, [showMochi]);
```

In `handleGameComplete`, call `celebrate()`.
In `handleBackPress`, call `hideMochi()`.

Add to the JSX inside `content` View:
```tsx
{/* In-game Mochi (small, bottom-right corner) */}
<MochiPresence
  size="sm"
  style={styles.mochiInGame}
/>
```

Add intro modal (separate from GameBoard's completion modal):
```tsx
<AppModal
  visible={showIntro}
  onClose={() => { setShowIntro(false); hideMochi(); }}
  showClose={false}
>
  <MochiPresence size="md" />
  <AppButton
    label={t("common.play")}
    variant="primary"
    onPress={() => { setShowIntro(false); }}
  />
</AppModal>
```

Add to `createStyles`:
```tsx
mochiInGame: {
  position: 'absolute',
  bottom: Space.lg,
  right: Space.lg,
},
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/screens/GameScreen.tsx src/components/GameBoard.tsx
git commit -m "feat: integrate Mochi in Memory Snap (intro modal, in-game, completion)"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run ci:all` (or at minimum `npm run ci:shared`)
Expected: All checks pass

- [ ] **Step 2: Review the spec one more time**

Verify the implementation covers:
- [ ] `Mochi.tsx` — SVG blob with legs, face, blush, sparkle burst on happy variant ✓
- [ ] `MochiPresence.tsx` — reads reducedMotion, resolves theme colors, uses `useMochi` hook internally ✓
- [ ] `useMochi.ts` — `{ mochiProps, showMochi, hideMochi, celebrate }` matching spec interface ✓
- [ ] Home screen — lg Mochi visible on mount via `showMochi()`, `celebrate()` on game select ✓
- [ ] Memory Snap — intro modal + in-game corner + match celebration + completion celebration ✓
- [ ] i18n keys under `mascot.*` — all 14 keys from spec ✓
- [ ] All animations disabled when `reducedMotionEnabled` ✓
- [ ] `className` prop on `MochiProps` as specified in spec ✓
