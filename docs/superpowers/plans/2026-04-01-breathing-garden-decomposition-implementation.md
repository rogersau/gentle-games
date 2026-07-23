# Breathing Garden Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose `src/screens/BreathingGardenScreen.tsx` into a thin screen coordinator plus a focused breathing-session hook while preserving current breathing, motion, Mochi, and music behavior.

**Architecture:** Keep `src/screens/BreathingGardenScreen.tsx` responsible for app-shell concerns such as navigation, translation, theme, layout, music wiring, and Mochi rendering. Move breathing-session state, transition guards, color cycling, and label/count animation orchestration into a new `src/screens/useBreathingGardenSession.ts` hook with direct tests. Use TDD so the extracted hook is locked to the current screen behavior before the screen is slimmed down.

**Tech Stack:** React Native, TypeScript, Jest, React Native Testing Library, Animated, React Navigation

---

## File Structure

**Create:**
- `src/screens/useBreathingGardenSession.ts` - Breathing Garden-specific session state, phase/count animation orchestration, color cycling, and cleanup
- `src/screens/useBreathingGardenSession.test.ts` - direct tests for breathing-session state transitions and animation-disabled behavior

**Modify:**
- `src/screens/BreathingGardenScreen.tsx` - reduce to screen composition, `useBackgroundMusic()` wiring, and hook composition
- `src/screens/BreathingGardenScreen.test.tsx` - preserve behavior-focused screen coverage while moving session assertions to the new hook tests

**Keep unchanged unless tests prove a bug:**
- `src/components/BreathingBall.tsx` - source of phase/progress/cycle events

---

### Task 1: Lock The Current Breathing Garden Behavior With Better Tests

**Files:**
- Modify: `src/screens/BreathingGardenScreen.test.tsx`

- [ ] **Step 1: Add a failing test for the current count progression contract**

```ts
// Add to src/screens/BreathingGardenScreen.test.tsx
it('maps breathing progress to the displayed count labels', () => {
  const screen = render(React.createElement(BreathingGardenScreen));

  expect(screen.getByText('1')).toBeTruthy();

  fireEvent.press(screen.getByTestId('progress-75'));

  expect(screen.getByText('3')).toBeTruthy();
});
```

- [ ] **Step 2: Run the new screen test to verify the current baseline**

Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx`
Expected: PASS

- [ ] **Step 3: Add a failing test for focus cleanup and music stop-on-blur**

```ts
// Replace the navigation mock in src/screens/BreathingGardenScreen.test.tsx with:
const focusCleanupCallbacks: Array<() => void> = [];

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const cleanup = callback();
    if (typeof cleanup === 'function') {
      focusCleanupCallbacks.push(cleanup);
    }
  },
}));

// Add to the test block:
it('stops music when the screen focus cleanup runs', () => {
  render(React.createElement(BreathingGardenScreen));

  expect(focusCleanupCallbacks).not.toHaveLength(0);

  act(() => {
    focusCleanupCallbacks.forEach((cleanup) => cleanup());
  });

  expect(mockStopMusic).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: Run the screen tests again**

Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the stronger baseline tests**

```bash
git add src/screens/BreathingGardenScreen.test.tsx
git commit -m "test: lock breathing garden screen behavior"
```

---

### Task 2: Add Direct Tests For The Extracted Session Hook

**Files:**
- Create: `src/screens/useBreathingGardenSession.test.ts`

- [ ] **Step 1: Write the failing hook tests for the session contract**

```ts
// src/screens/useBreathingGardenSession.test.ts
import { Animated } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useBreathingGardenSession } from './useBreathingGardenSession';

describe('useBreathingGardenSession', () => {
  let animatedTimingSpy: jest.SpyInstance;
  const queuedAnimations: Array<{ toValue: number; run: () => void }> = [];

  beforeEach(() => {
    queuedAnimations.length = 0;
    animatedTimingSpy = jest.spyOn(Animated, 'timing').mockImplementation(
      (value: Animated.Value | Animated.ValueXY, config: Animated.TimingAnimationConfig) =>
        ({
          start: (callback?: Animated.EndCallback) => {
            queuedAnimations.push({
              toValue: typeof config.toValue === 'number' ? config.toValue : 0,
              run: () => callback?.({ finished: true }),
            });
            return value;
          },
          stop: jest.fn(),
          reset: jest.fn(),
          _startNativeLoop: jest.fn(),
          _isUsingNativeDriver: () => config.useNativeDriver ?? false,
        }) as unknown as Animated.CompositeAnimation,
    );
  });

  afterEach(() => {
    animatedTimingSpy.mockRestore();
  });

  it('starts with inhale, one count, zero breaths, and the Ocean color scheme', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: true }));

    expect(result.current.state.phase).toBe('inhale');
    expect(result.current.state.displayedPhase).toBe('inhale');
    expect(result.current.state.currentCount).toBe(1);
    expect(result.current.state.breaths).toBe(0);
    expect(result.current.state.ballColors.name).toBe('Ocean');
  });

  it('updates displayedPhase immediately when animations are disabled', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: false }));

    act(() => {
      result.current.actions.handlePhaseChange('exhale');
    });

    expect(result.current.state.phase).toBe('exhale');
    expect(result.current.state.displayedPhase).toBe('exhale');
    expect(animatedTimingSpy).not.toHaveBeenCalled();
  });

  it('ignores stale phase transitions when a newer phase arrives before animation completion', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: true }));

    act(() => {
      result.current.actions.handlePhaseChange('exhale');
    });

    const fadeOut = queuedAnimations.find((animation) => animation.toValue === 0);

    act(() => {
      result.current.actions.handlePhaseChange('inhale');
      fadeOut?.run();
    });

    expect(result.current.state.displayedPhase).toBe('inhale');
  });

  it('derives the current count from breathing progress', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: true }));

    act(() => {
      result.current.actions.handleProgress(0.75);
    });

    expect(result.current.state.progress).toBe(0.75);
    expect(result.current.state.currentCount).toBe(3);
  });

  it('stores completed breath cycles', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: true }));

    act(() => {
      result.current.actions.handleCycleComplete(3);
    });

    expect(result.current.state.breaths).toBe(3);
  });

  it('cycles through color schemes and wraps back to the start', () => {
    const { result } = renderHook(() => useBreathingGardenSession({ animationsEnabled: true }));

    act(() => {
      result.current.actions.cycleColors();
      result.current.actions.cycleColors();
      result.current.actions.cycleColors();
      result.current.actions.cycleColors();
      result.current.actions.cycleColors();
    });

    expect(result.current.state.ballColors.name).toBe('Ocean');
  });
});
```

- [ ] **Step 2: Run the hook tests to confirm failure**

Run: `npm run test:single -- src/screens/useBreathingGardenSession.test.ts`
Expected: FAIL because `src/screens/useBreathingGardenSession.ts` does not exist yet

- [ ] **Step 3: Commit the failing test scaffold if your workflow requires it locally, otherwise continue without committing**

```bash
git status --short
```

Expected: shows `src/screens/useBreathingGardenSession.test.ts` as a new file and no production implementation yet

---

### Task 3: Implement `useBreathingGardenSession`

**Files:**
- Create: `src/screens/useBreathingGardenSession.ts`
- Modify: `src/screens/useBreathingGardenSession.test.ts`

- [ ] **Step 1: Create the hook with the extracted session contract**

```ts
// src/screens/useBreathingGardenSession.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import type { BallColorScheme } from '../components/BreathingBall';

const getColorSchemes = (): BallColorScheme[] => [
  { primary: '#B4D7E8', accent: '#7FB3D5', name: 'Ocean' },
  { primary: '#F5C6D6', accent: '#E8A4C9', name: 'Rose' },
  { primary: '#C8E6C9', accent: '#A5D6A7', name: 'Mint' },
  { primary: '#FFE0B2', accent: '#FFCC80', name: 'Sunset' },
  { primary: '#E1BEE7', accent: '#CE93D8', name: 'Lavender' },
];

export type BreathingPhase = 'inhale' | 'exhale';

interface UseBreathingGardenSessionOptions {
  animationsEnabled: boolean;
}

export function useBreathingGardenSession({
  animationsEnabled,
}: UseBreathingGardenSessionOptions) {
  const colorSchemes = useMemo(() => getColorSchemes(), []);
  const [colorIndex, setColorIndex] = useState(0);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [displayedPhase, setDisplayedPhase] = useState<BreathingPhase>('inhale');
  const [breaths, setBreaths] = useState(0);
  const [progress, setProgress] = useState(0);

  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;
  const phaseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const countAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const phaseTransitionRef = useRef(0);
  const latestPhaseRef = useRef<BreathingPhase>('inhale');

  latestPhaseRef.current = phase;

  const currentCount = useMemo(
    () => Math.min(4, Math.max(1, Math.ceil(progress * 4))),
    [progress],
  );

  useEffect(() => {
    phaseAnimationRef.current?.stop();

    if (phase === displayedPhase) {
      phaseOpacity.setValue(1);
      return;
    }

    if (!animationsEnabled) {
      setDisplayedPhase(phase);
      phaseOpacity.setValue(1);
      return;
    }

    const transitionId = phaseTransitionRef.current + 1;
    phaseTransitionRef.current = transitionId;

    const fadeOut = Animated.timing(phaseOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    });

    phaseAnimationRef.current = fadeOut;
    fadeOut.start(({ finished }) => {
      if (
        !finished ||
        phaseTransitionRef.current !== transitionId ||
        latestPhaseRef.current !== phase
      ) {
        return;
      }

      setDisplayedPhase(phase);

      const fadeIn = Animated.timing(phaseOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      });

      phaseAnimationRef.current = fadeIn;
      fadeIn.start();
    });

    return () => {
      fadeOut.stop();
    };
  }, [animationsEnabled, displayedPhase, phase, phaseOpacity]);

  useEffect(() => {
    countAnimationRef.current?.stop();

    if (!animationsEnabled) {
      countOpacity.setValue(1);
      return;
    }

    const fadeCountIn = Animated.timing(countOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    });

    countAnimationRef.current = fadeCountIn;
    fadeCountIn.start();

    return () => {
      fadeCountIn.stop();
    };
  }, [animationsEnabled, countOpacity, currentCount]);

  useEffect(
    () => () => {
      countAnimationRef.current?.stop();
      phaseAnimationRef.current?.stop();
    },
    [],
  );

  const cycleColors = useCallback(() => {
    setColorIndex((prev) => (prev + 1) % colorSchemes.length);
  }, [colorSchemes.length]);

  const handlePhaseChange = useCallback((nextPhase: BreathingPhase) => {
    setPhase(nextPhase);
  }, []);

  const handleCycleComplete = useCallback((count: number) => {
    setBreaths(count);
  }, []);

  const handleProgress = useCallback((nextProgress: number) => {
    setProgress(nextProgress);
  }, []);

  return {
    state: {
      phase,
      displayedPhase,
      breaths,
      progress,
      currentCount,
      ballColors: colorSchemes[colorIndex],
      phaseOpacity,
      countOpacity,
    },
    actions: {
      cycleColors,
      handlePhaseChange,
      handleCycleComplete,
      handleProgress,
    },
  };
}
```

- [ ] **Step 2: Run the hook tests and fix any signature mismatches in the test file only if needed**

Run: `npm run test:single -- src/screens/useBreathingGardenSession.test.ts`
Expected: PASS

- [ ] **Step 3: Commit the extracted session hook**

```bash
git add src/screens/useBreathingGardenSession.ts src/screens/useBreathingGardenSession.test.ts
git commit -m "feat: extract breathing garden session hook"
```

---

### Task 4: Switch `BreathingGardenScreen` To The Extracted Hook

**Files:**
- Modify: `src/screens/BreathingGardenScreen.tsx`
- Modify: `src/screens/BreathingGardenScreen.test.tsx`

- [ ] **Step 1: Replace the inline session state and animation orchestration with the new hook**

```ts
// Key edits in src/screens/BreathingGardenScreen.tsx
import { useBreathingGardenSession } from './useBreathingGardenSession';

const {
  state: {
    phase,
    displayedPhase,
    breaths,
    progress,
    currentCount,
    ballColors,
    phaseOpacity,
    countOpacity,
  },
  actions: {
    cycleColors,
    handlePhaseChange,
    handleCycleComplete,
    handleProgress,
  },
} = useBreathingGardenSession({ animationsEnabled: settings.animationsEnabled });

// Remove these inline pieces from the screen:
// - getColorSchemes()
// - colorIndex state
// - phase/displayedPhase/breaths/progress state
// - phaseOpacityRef/countOpacityRef
// - phaseAnimationRef/countAnimationRef
// - phaseTransitionRef/latestPhaseRef
// - useEffect blocks that manage phase/count animations
// - inline cycleColors callback

// Update render usage:
<Animated.Text style={[styles.phaseLabel, { opacity: phaseOpacity }]}> 
  {displayedPhase === 'inhale'
    ? t('games.breathingGarden.inhale')
    : t('games.breathingGarden.exhale')}
</Animated.Text>

<BreathingBall
  size={BALL_SIZE}
  colorScheme={ballColors}
  autoStart={true}
  onPhaseChange={handlePhaseChange}
  onCycleComplete={handleCycleComplete}
  onProgress={handleProgress}
/>

<Animated.Text style={[styles.countText, { opacity: countOpacity }]}>
  {currentCount > 0 ? currentCount : ''}
</Animated.Text>
```

- [ ] **Step 2: Run the screen test suite to verify the coordinator still works**

Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx`
Expected: PASS

- [ ] **Step 3: Add one coordinator-focused assertion to the screen tests**

```ts
// Add to src/screens/BreathingGardenScreen.test.tsx
it('still renders the music toggle and color button through the decomposed screen coordinator', () => {
  const screen = render(React.createElement(BreathingGardenScreen));

  expect(screen.getByText('Change color')).toBeTruthy();
  expect(screen.getByText('Music on')).toBeTruthy();
});
```

- [ ] **Step 4: Run the screen tests again**

Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the screen cleanup**

```bash
git add src/screens/BreathingGardenScreen.tsx src/screens/BreathingGardenScreen.test.tsx
git commit -m "refactor: slim breathing garden screen"
```

---

### Task 5: Final Verification And Cleanup

**Files:**
- Modify as needed: `src/screens/BreathingGardenScreen.tsx`
- Modify as needed: `src/screens/useBreathingGardenSession.ts`
- Modify as needed: `src/screens/BreathingGardenScreen.test.tsx`
- Modify as needed: `src/screens/useBreathingGardenSession.test.ts`

- [ ] **Step 1: Run the focused Breathing Garden test suite**

Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx src/screens/useBreathingGardenSession.test.ts src/components/BreathingBall.test.tsx`
Expected: PASS

- [ ] **Step 2: Run full Jest verification**

Run: `npm test -- --runInBand`
Expected: PASS

- [ ] **Step 3: Run TypeScript verification**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: If verification reveals regressions, make the smallest fix in the owning file and rerun the failing command before continuing**

```ts
// Likely fix areas only if tests fail:
// - src/screens/useBreathingGardenSession.ts for animation timing/state contract mismatches
// - src/screens/BreathingGardenScreen.tsx for wiring mistakes
// - src/screens/BreathingGardenScreen.test.tsx for stale expectations after extraction
```

- [ ] **Step 5: Commit the verified decomposition**

```bash
git add src/screens/BreathingGardenScreen.tsx src/screens/BreathingGardenScreen.test.tsx src/screens/useBreathingGardenSession.ts src/screens/useBreathingGardenSession.test.ts
git commit -m "refactor: decompose breathing garden screen"
```

---

## Final Verification

- [ ] Run: `npm run test:single -- src/screens/BreathingGardenScreen.test.tsx src/screens/useBreathingGardenSession.test.ts src/components/BreathingBall.test.tsx`
- [ ] Run: `npm test -- --runInBand`
- [ ] Run: `npm run typecheck`

If `src/screens/BreathingGardenScreen.tsx` still feels hard to explain in one pass after this extraction, stop and do one more small cleanup before moving to the next architectural friction point.
