# MAIN-01: Monolithic Component Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose 5 monolithic components into focused hooks + presentational components, making the largest interactive surfaces easier to modify, test, and review.

**Architecture:** Extract stateful logic into focused hooks with clean return APIs. Use a composition hook to wire core hooks together when they need to share state. Keep UI components mostly presentational. Extract hooks one at a time, run existing tests after each extraction.

**Tech Stack:** React Native, Expo, TypeScript, Jest, React Testing Library

---

## File Structure

### DrawingCanvas (1136 lines → ~300-400 lines)

**Create:**
- `src/hooks/useDrawingHistory.ts` — History state, undo, clear, actionId tracking
- `src/hooks/useDrawingHistory.test.ts` — Tests for history hook
- `src/hooks/useDrawingTools.ts` — Tool, color, shape, symmetry selection
- `src/hooks/useDrawingTools.test.ts` — Tests for tools hook
- `src/hooks/useSymmetry.ts` — Symmetry offset computation
- `src/hooks/useSymmetry.test.ts` — Tests for symmetry hook
- `src/hooks/useDrawingCanvas.ts` — Composition hook wiring core hooks + gestures
- `src/hooks/useDrawingCanvas.test.ts` — Tests for composition hook

**Modify:**
- `src/components/DrawingCanvas.tsx` — Use extracted hooks, become mostly presentational

### PatternTrainScreen (885 lines → ~300-400 lines)

**Create:**
- `src/hooks/usePatternTrainUI.ts` — UI state, celebration, milestones
- `src/hooks/usePatternTrainUI.test.ts` — Tests for UI hook

**Modify:**
- `src/screens/usePatternTrainGame.ts` — May need expansion to own more game state
- `src/screens/PatternTrainScreen.tsx` — Use extracted hooks

### GlitterGlobe (704 lines → ~250-300 lines)

**Create:**
- `src/hooks/useGlitterParticles.ts` — Particle state, animation loop
- `src/hooks/useGlitterParticles.test.ts` — Tests for particles hook
- `src/hooks/useGlitterGestures.ts` — Shake/wake detection, touch handling
- `src/hooks/useGlitterGestures.test.ts` — Tests for gestures hook

**Modify:**
- `src/components/GlitterGlobe.tsx` — Use extracted hooks

### PicnicBasket (429 lines → ~150-200 lines)

**Create:**
- `src/hooks/usePicnicDrag.ts` — Drag state, PanResponder, drop validation
- `src/hooks/usePicnicDrag.test.ts` — Tests for drag hook

**Modify:**
- `src/components/numberpicnic/PicnicBasket.tsx` — Use extracted hooks

### HomeScreen (372 lines → ~200-250 lines)

**Create:**
- `src/hooks/useGameSelection.ts` — Difficulty modal, game selection logic
- `src/hooks/useGameSelection.test.ts` — Tests for game selection hook

**Modify:**
- `src/screens/HomeScreen.tsx` — Use extracted hooks

---

## Task 1: Extract DrawingHistory Hook

**Files:**
- Create: `src/hooks/useDrawingHistory.ts`
- Create: `src/hooks/useDrawingHistory.test.ts`
- Read: `src/components/DrawingCanvas.tsx:209-278` (history state and callbacks)

- [ ] **Step 1: Write failing tests for useDrawingHistory**

```typescript
// src/hooks/useDrawingHistory.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDrawingHistory } from './useDrawingHistory';
import type { HistoryEntry } from '../components/DrawingCanvas';

const mockEntry: HistoryEntry = {
  kind: 'stroke',
  id: 'test-1',
  actionId: 'action-1',
  points: [{ x: 0, y: 0 }],
  color: '#FF0000',
  width: 2,
};

describe('useDrawingHistory', () => {
  it('starts with initial history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [mockEntry] }));
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('starts empty when no initial history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [] }));
    expect(result.current.history).toEqual([]);
  });

  it('adds entries to history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [] }));
    act(() => {
      result.current.addToHistory(mockEntry);
    });
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('calls onHistoryChange when history changes', () => {
    const onHistoryChange = jest.fn();
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [],
      onHistoryChange,
    }));
    act(() => {
      result.current.addToHistory(mockEntry);
    });
    expect(onHistoryChange).toHaveBeenCalledWith([mockEntry]);
  });

  it('removes last entry on undo', () => {
    const entry2: HistoryEntry = { ...mockEntry, id: 'test-2' };
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry, entry2],
    }));
    act(() => {
      result.current.undo();
    });
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('removes all entries with same actionId on undo', () => {
    const entry2: HistoryEntry = { ...mockEntry, id: 'test-2', actionId: 'action-1' };
    const entry3: HistoryEntry = { ...mockEntry, id: 'test-3', actionId: 'action-2' };
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry, entry2, entry3],
    }));
    act(() => {
      result.current.undo();
    });
    expect(result.current.history).toEqual([mockEntry, entry2]);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry],
    }));
    act(() => {
      result.current.clearHistory();
    });
    expect(result.current.history).toEqual([]);
  });

  it('returns history snapshot', () => {
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry],
    }));
    const snapshot = result.current.getHistorySnapshot();
    expect(snapshot).toEqual([mockEntry]);
    // Snapshot is a copy, not the same reference
    expect(snapshot).not.toBe(result.current.history);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useDrawingHistory.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useDrawingHistory'"

- [ ] **Step 3: Implement useDrawingHistory hook**

```typescript
// src/hooks/useDrawingHistory.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../components/DrawingCanvas';

interface UseDrawingHistoryOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
}

export function useDrawingHistory({
  initialHistory,
  onHistoryChange,
}: UseDrawingHistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const historyRef = useRef(history);
  const nextActionIdRef = useRef(0);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    onHistoryChange?.(history);
  }, [history, onHistoryChange]);

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.actionId) {
        return prev.filter((entry) => entry.actionId !== last.actionId);
      }
      return prev.slice(0, -1);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistorySnapshot = useCallback(() => {
    return [...historyRef.current];
  }, []);

  return {
    history,
    addToHistory,
    undo,
    clearHistory,
    getHistorySnapshot,
    nextActionIdRef,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useDrawingHistory.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDrawingHistory.ts src/hooks/useDrawingHistory.test.ts
git commit -m "feat: extract useDrawingHistory hook from DrawingCanvas"
```

---

## Task 2: Extract DrawingTools Hook

**Files:**
- Create: `src/hooks/useDrawingTools.ts`
- Create: `src/hooks/useDrawingTools.test.ts`
- Read: `src/components/DrawingCanvas.tsx:218-227` (tool/color/shape state)

- [ ] **Step 1: Write failing tests for useDrawingTools**

```typescript
// src/hooks/useDrawingTools.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDrawingTools } from './useDrawingTools';

describe('useDrawingTools', () => {
  it('starts with pen tool and default color', () => {
    const { result } = renderHook(() => useDrawingTools());
    expect(result.current.tool).toBe('pen');
    expect(result.current.selectedColor).toBe('#FF6B6B');
    expect(result.current.shapeType).toBe('circle');
    expect(result.current.shapeSize).toBe(50);
    expect(result.current.symmetryMode).toBe('none');
  });

  it('changes tool', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setTool('eraser');
    });
    expect(result.current.tool).toBe('eraser');
  });

  it('changes selected color', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setSelectedColor('#00FF00');
    });
    expect(result.current.selectedColor).toBe('#00FF00');
  });

  it('changes shape type', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setShapeType('square');
    });
    expect(result.current.shapeType).toBe('square');
  });

  it('changes shape size', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setShapeSize(100);
    });
    expect(result.current.shapeSize).toBe(100);
  });

  it('changes symmetry mode', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setSymmetryMode('half');
    });
    expect(result.current.symmetryMode).toBe('half');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useDrawingTools.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useDrawingTools'"

- [ ] **Step 3: Implement useDrawingTools hook**

```typescript
// src/hooks/useDrawingTools.ts
import { useState, useRef, useEffect } from 'react';

type Tool = 'pen' | 'eraser' | 'shape';
type ShapeType = 'circle' | 'square' | 'triangle';
type SymmetryMode = 'none' | 'half' | 'quarter';

export function useDrawingTools() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<Tool>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('circle');
  const [shapeSize, setShapeSize] = useState(50);
  const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');

  // Keep refs in sync for gesture handlers
  const selectedColorRef = useRef(selectedColor);
  const toolRef = useRef(tool);
  const shapeTypeRef = useRef(shapeType);
  const shapeSizeRef = useRef(shapeSize);
  const symmetryModeRef = useRef(symmetryMode);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);
  useEffect(() => {
    shapeSizeRef.current = shapeSize;
  }, [shapeSize]);
  useEffect(() => {
    symmetryModeRef.current = symmetryMode;
  }, [symmetryMode]);

  return {
    tool,
    setTool,
    toolRef,
    selectedColor,
    setSelectedColor,
    selectedColorRef,
    shapeType,
    setShapeType,
    shapeTypeRef,
    shapeSize,
    setShapeSize,
    shapeSizeRef,
    symmetryMode,
    setSymmetryMode,
    symmetryModeRef,
  };
}

export type { Tool, ShapeType, SymmetryMode };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useDrawingTools.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDrawingTools.ts src/hooks/useDrawingTools.test.ts
git commit -m "feat: extract useDrawingTools hook from DrawingCanvas"
```

---

## Task 3: Extract Symmetry Hook

**Files:**
- Create: `src/hooks/useSymmetry.ts`
- Create: `src/hooks/useSymmetry.test.ts`
- Read: `src/components/DrawingCanvas.tsx:320-360` (symmetry offset computation)

- [ ] **Step 1: Write failing tests for useSymmetry**

```typescript
// src/hooks/useSymmetry.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useSymmetry } from './useSymmetry';

describe('useSymmetry', () => {
  it('returns single offset for none mode', () => {
    const { result } = renderHook(() => useSymmetry('none'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toEqual([[1, 1]]);
  });

  it('returns two offsets for half mode', () => {
    const { result } = renderHook(() => useSymmetry('half'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toHaveLength(2);
    expect(offsets).toContainEqual([1, 1]);
    expect(offsets).toContainEqual([-1, 1]);
  });

  it('returns four offsets for quarter mode', () => {
    const { result } = renderHook(() => useSymmetry('quarter'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toHaveLength(4);
    expect(offsets).toContainEqual([1, 1]);
    expect(offsets).toContainEqual([-1, 1]);
    expect(offsets).toContainEqual([1, -1]);
    expect(offsets).toContainEqual([-1, -1]);
  });

  it('updates offsets when symmetry mode changes', () => {
    const { result, rerender } = renderHook(
      ({ mode }) => useSymmetry(mode),
      { initialProps: { mode: 'none' as const } }
    );
    expect(result.current.getSymmetryOffsets()).toHaveLength(1);

    rerender({ mode: 'half' });
    expect(result.current.getSymmetryOffsets()).toHaveLength(2);

    rerender({ mode: 'quarter' });
    expect(result.current.getSymmetryOffsets()).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useSymmetry.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useSymmetry'"

- [ ] **Step 3: Implement useSymmetry hook**

```typescript
// src/hooks/useSymmetry.ts
import { useMemo } from 'react';

type SymmetryMode = 'none' | 'half' | 'quarter';

export function useSymmetry(symmetryMode: SymmetryMode) {
  const getSymmetryOffsets = useMemo(() => {
    return (): Array<[number, number]> => {
      switch (symmetryMode) {
        case 'half':
          return [[1, 1], [-1, 1]];
        case 'quarter':
          return [[1, 1], [-1, 1], [1, -1], [-1, -1]];
        case 'none':
        default:
          return [[1, 1]];
      }
    };
  }, [symmetryMode]);

  return { getSymmetryOffsets };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useSymmetry.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSymmetry.ts src/hooks/useSymmetry.test.ts
git commit -m "feat: extract useSymmetry hook from DrawingCanvas"
```

---

## Task 4: Extract DrawingCanvas Composition Hook

**Files:**
- Create: `src/hooks/useDrawingCanvas.ts`
- Create: `src/hooks/useDrawingCanvas.test.ts`
- Read: `src/components/DrawingCanvas.tsx:279-400` (PanResponder and gesture logic)

- [ ] **Step 1: Write failing tests for useDrawingCanvas**

```typescript
// src/hooks/useDrawingCanvas.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDrawingCanvas } from './useDrawingCanvas';

describe('useDrawingCanvas', () => {
  it('provides panResponder', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.panResponder).toBeDefined();
    expect(result.current.panResponder.panHandlers).toBeDefined();
  });

  it('provides current strokes state', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.currentStrokes).toEqual([]);
  });

  it('delegates history operations', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(typeof result.current.addToHistory).toBe('function');
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.clearHistory).toBe('function');
  });

  it('delegates tool operations', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.tool).toBe('pen');
    expect(typeof result.current.setTool).toBe('function');
    expect(result.current.selectedColor).toBe('#FF6B6B');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useDrawingCanvas.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useDrawingCanvas'"

- [ ] **Step 3: Implement useDrawingCanvas composition hook**

```typescript
// src/hooks/useDrawingCanvas.ts
import { useState, useRef, useEffect, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { useDrawingHistory } from './useDrawingHistory';
import { useDrawingTools } from './useDrawingTools';
import { useSymmetry } from './useSymmetry';
import type { HistoryEntry, Stroke, Point } from '../components/DrawingCanvas';

interface UseDrawingCanvasOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function useDrawingCanvas({
  initialHistory,
  onHistoryChange,
  canvasWidth,
  canvasHeight,
}: UseDrawingCanvasOptions) {
  const historyHook = useDrawingHistory({ initialHistory, onHistoryChange });
  const toolsHook = useDrawingTools();
  const symmetryHook = useSymmetry(toolsHook.symmetryMode);

  const [currentStrokes, setCurrentStrokes] = useState<Array<Omit<Stroke, 'kind' | 'id'>>>([]);
  const currentStrokesRef = useRef(currentStrokes);
  useEffect(() => {
    currentStrokesRef.current = currentStrokes;
  }, [currentStrokes]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        if (toolsHook.toolRef.current === 'pen') {
          const actionId = String(historyHook.nextActionIdRef.current++);
          const offsets = symmetryHook.getSymmetryOffsets();

          const strokes = offsets.map(([xMult, yMult]) => ({
            points: [{ x: xMult === 1 ? point.x : canvasWidth - point.x, y: yMult === 1 ? point.y : canvasHeight - point.y }],
            color: toolsHook.selectedColorRef.current,
            width: 2,
            actionId,
          }));

          setCurrentStrokes(strokes);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        if (toolsHook.toolRef.current === 'pen') {
          setCurrentStrokes((prev) =>
            prev.map((stroke, idx) => {
              const offsets = symmetryHook.getSymmetryOffsets();
              const [xMult, yMult] = offsets[idx] || [1, 1];
              return {
                ...stroke,
                points: [...stroke.points, { x: xMult === 1 ? point.x : canvasWidth - point.x, y: yMult === 1 ? point.y : canvasHeight - point.y }],
              };
            })
          );
        }
      },
      onPanResponderRelease: () => {
        if (toolsHook.toolRef.current === 'pen') {
          currentStrokesRef.current.forEach((stroke, idx) => {
            historyHook.addToHistory({
              kind: 'stroke',
              id: `stroke-${Date.now()}-${idx}`,
              ...stroke,
            });
          });
          setCurrentStrokes([]);
        }
      },
    });
  }, [canvasWidth, canvasHeight, symmetryHook, historyHook, toolsHook]);

  return {
    panResponder,
    currentStrokes,
    ...historyHook,
    ...toolsHook,
    ...symmetryHook,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useDrawingCanvas.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDrawingCanvas.ts src/hooks/useDrawingCanvas.test.ts
git commit -m "feat: extract useDrawingCanvas composition hook"
```

---

## Task 5: Update DrawingCanvas to Use Extracted Hooks

**Files:**
- Modify: `src/components/DrawingCanvas.tsx`

- [ ] **Step 1: Run existing DrawingCanvas tests to establish baseline**

Run: `npx jest src/components/DrawingCanvas.test.tsx --no-coverage`
Expected: PASS (all existing tests pass)

- [ ] **Step 2: Refactor DrawingCanvas to use extracted hooks**

Replace inline state and logic with hook calls:

```typescript
// src/components/DrawingCanvas.tsx (simplified structure)
import { useDrawingCanvas } from '../hooks/useDrawingCanvas';

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ initialHistory, onHistoryChange, canvasWidth, canvasHeight }, ref) => {
    const {
      panResponder,
      currentStrokes,
      history,
      undo,
      clearHistory,
      tool,
      setTool,
      selectedColor,
      setSelectedColor,
      // ... other hook values
    } = useDrawingCanvas({
      initialHistory,
      onHistoryChange,
      canvasWidth,
      canvasHeight,
    });

    // Keep existing UI: toolbars, pickers, modals
    // ... (rendering code)
  }
);
```

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npx jest src/components/DrawingCanvas.test.tsx --no-coverage`
Expected: PASS (all existing tests still pass)

- [ ] **Step 4: Run all DrawingCanvas-related tests**

Run: `npx jest src/hooks/useDrawing*.test.ts src/components/DrawingCanvas.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DrawingCanvas.tsx
git commit -m "refactor: use extracted hooks in DrawingCanvas"
```

---

## Task 6: Extract GlitterParticles Hook

**Files:**
- Create: `src/hooks/useGlitterParticles.ts`
- Create: `src/hooks/useGlitterParticles.test.ts`
- Read: `src/components/GlitterGlobe.tsx` (particle state and animation loop)

- [ ] **Step 1: Write failing tests for useGlitterParticles**

```typescript
// src/hooks/useGlitterParticles.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGlitterParticles } from './useGlitterParticles';

describe('useGlitterParticles', () => {
  it('starts with empty particles', () => {
    const { result } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(result.current.particles).toEqual([]);
    expect(result.current.ripples).toEqual([]);
  });

  it('provides start and stop animation', () => {
    const { result } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(typeof result.current.startAnimation).toBe('function');
    expect(typeof result.current.stopAnimation).toBe('function');
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(() => unmount()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useGlitterParticles.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useGlitterParticles'"

- [ ] **Step 3: Implement useGlitterParticles hook**

```typescript
// src/hooks/useGlitterParticles.ts
import { useState, useRef, useEffect, useCallback } from 'react';

interface GlitterParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shape: 'circle' | 'square' | 'diamond' | 'star';
  color: string;
  opacity: number;
}

interface WakeRipple {
  id: string;
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

interface UseGlitterParticlesOptions {
  particleCount: number;
  canvasWidth: number;
  canvasHeight: number;
}

const DRAG = 0.988;
const MAX_SPEED = 65;
const GLOBE_PADDING = 10;
const BOUNCE = 0.4;

export function useGlitterParticles({
  particleCount,
  canvasWidth,
  canvasHeight,
}: UseGlitterParticlesOptions) {
  const [particles, setParticles] = useState<GlitterParticle[]>([]);
  const [ripples, setRipples] = useState<WakeRipple[]>([]);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<GlitterParticle[]>([]);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const globeRadius = Math.min(canvasWidth, canvasHeight) / 2 - GLOBE_PADDING;

  const stepParticles = useCallback((
    currentParticles: GlitterParticle[],
    dt: number,
  ): GlitterParticle[] => {
    const damping = Math.pow(DRAG, dt * 60);
    return currentParticles.map((p) => {
      const vx = p.vx * damping;
      const vy = p.vy * damping;
      const clampedVx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx));
      const clampedVy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy));
      const x = p.x + clampedVx * dt;
      const y = p.y + clampedVy * dt;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxDist = globeRadius - p.radius;
      if (dist > maxDist && maxDist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const outwardVel = vx * nx + vy * ny;
        if (outwardVel > 0) {
          return {
            ...p,
            x: centerX + nx * maxDist,
            y: centerY + ny * maxDist,
            vx: vx - (1 + BOUNCE) * outwardVel * nx,
            vy: vy - (1 + BOUNCE) * outwardVel * ny,
          };
        }
      }
      return { ...p, x, y, vx: clampedVx, vy: clampedVy };
    });
  }, [centerX, centerY, globeRadius]);

  const startAnimation = useCallback(() => {
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: centerX + Math.random() * 50 - 25,
      y: centerY + Math.random() * 50 - 25,
      vx: Math.random() * 20 - 10,
      vy: Math.random() * 10,
      radius: Math.random() * 6 + 4,
      shape: 'circle' as const,
      color: '#FF5D8F',
      opacity: Math.random() * 0.3 + 0.7,
    }));
    setParticles([...particlesRef.current]);

    const animate = () => {
      setParticles((prev) => {
        const updated = stepParticles(prev, 1 / 60);
        particlesRef.current = updated;
        return updated;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [particleCount, centerX, centerY, stepParticles]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    particles,
    ripples,
    startAnimation,
    stopAnimation,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useGlitterParticles.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGlitterParticles.ts src/hooks/useGlitterParticles.test.ts
git commit -m "feat: extract useGlitterParticles hook from GlitterGlobe"
```

---

## Task 7: Extract GlitterGestures Hook

**Files:**
- Create: `src/hooks/useGlitterGestures.ts`
- Create: `src/hooks/useGlitterGestures.test.ts`
- Read: `src/components/GlitterGlobe.tsx` (shake/wake detection)

- [ ] **Step 1: Write failing tests for useGlitterGestures**

```typescript
// src/hooks/useGlitterGestures.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useGlitterGestures } from './useGlitterGestures';

describe('useGlitterGestures', () => {
  it('provides gesture handlers', () => {
    const onShake = jest.fn();
    const onWake = jest.fn();
    const { result } = renderHook(() => useGlitterGestures({ onShake, onWake }));
    expect(typeof result.current.handleShake).toBe('function');
    expect(typeof result.current.handleWake).toBe('function');
  });

  it('cleans up listeners on unmount', () => {
    const onShake = jest.fn();
    const onWake = jest.fn();
    const { unmount } = renderHook(() => useGlitterGestures({ onShake, onWake }));
    expect(() => unmount()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useGlitterGestures.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useGlitterGestures'"

- [ ] **Step 3: Implement useGlitterGestures hook**

```typescript
// src/hooks/useGlitterGestures.ts
import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Subscription } from 'expo-modules-core';
import { getMotionForce, shouldTriggerShake } from '../utils/glitterMotion';

interface UseGlitterGesturesOptions {
  onShake: () => void;
  onWake: () => void;
  enabled?: boolean;
}

export function useGlitterGestures({
  onShake,
  onWake,
  enabled = true,
}: UseGlitterGesturesOptions) {
  const lastShakeTime = useRef(0);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current > 500) {
      lastShakeTime.current = now;
      onShake();
    }
  }, [onShake]);

  const handleWake = useCallback(() => {
    onWake();
  }, [onWake]);

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const force = getMotionForce(x, y, z);
      if (shouldTriggerShake(force)) {
        handleShake();
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      subscription.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, handleShake]);

  return {
    handleShake,
    handleWake,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useGlitterGestures.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGlitterGestures.ts src/hooks/useGlitterGestures.test.ts
git commit -m "feat: extract useGlitterGestures hook from GlitterGlobe"
```

---

## Task 8: Update GlitterGlobe to Use Extracted Hooks

**Files:**
- Modify: `src/components/GlitterGlobe.tsx`

- [ ] **Step 1: Run existing GlitterGlobe tests to establish baseline**

Run: `npx jest src/components/GlitterGlobe.test.tsx --no-coverage`
Expected: PASS (or may not have tests - check first)

- [ ] **Step 2: Refactor GlitterGlobe to use extracted hooks**

Replace inline particle and gesture logic with hook calls.

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npx jest src/components/GlitterGlobe.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/GlitterGlobe.tsx
git commit -m "refactor: use extracted hooks in GlitterGlobe"
```

---

## Task 9: Extract PicnicDrag Hook

**Files:**
- Create: `src/hooks/usePicnicDrag.ts`
- Create: `src/hooks/usePicnicDrag.test.ts`
- Read: `src/components/numberpicnic/PicnicBasket.tsx` (drag/drop logic)

- [ ] **Step 1: Write failing tests for usePicnicDrag**

```typescript
// src/hooks/usePicnicDrag.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { usePicnicDrag } from './usePicnicDrag';

describe('usePicnicDrag', () => {
  it('starts with no active drag', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.activeDrag).toBeNull();
    expect(result.current.isOverBasket).toBe(false);
  });

  it('provides panResponder', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.panResponder).toBeDefined();
    expect(result.current.panResponder.panHandlers).toBeDefined();
  });

  it('provides drag position', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.dragPosition).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/usePicnicDrag.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './usePicnicDrag'"

- [ ] **Step 3: Implement usePicnicDrag hook**

```typescript
// src/hooks/usePicnicDrag.ts
import { useState, useRef, useMemo } from 'react';
import { PanResponder } from 'react-native';

interface UsePicnicDragOptions {
  onDrop: (itemId: string, valid: boolean) => void;
  dropZoneBounds?: { x: number; y: number; width: number; height: number } | null;
}

export function usePicnicDrag({ onDrop, dropZoneBounds }: UsePicnicDragOptions) {
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isOverBasket, setIsOverBasket] = useState(false);

  const dragItemIdRef = useRef<string | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          // Gesture started - caller should set activeDrag via the returned setter
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          setDragPosition({ x: pageX, y: pageY });

          if (dropZoneBounds) {
            const over =
              pageX >= dropZoneBounds.x &&
              pageX <= dropZoneBounds.x + dropZoneBounds.width &&
              pageY >= dropZoneBounds.y &&
              pageY <= dropZoneBounds.y + dropZoneBounds.height;
            setIsOverBasket(over);
          }
        },
        onPanResponderRelease: () => {
          if (dragItemIdRef.current) {
            const valid = isOverBasket;
            onDrop(dragItemIdRef.current, valid);
          }
          setActiveDrag(null);
          setDragPosition({ x: 0, y: 0 });
          setIsOverBasket(false);
          dragItemIdRef.current = null;
        },
        onPanResponderTerminate: () => {
          setActiveDrag(null);
          setDragPosition({ x: 0, y: 0 });
          setIsOverBasket(false);
          dragItemIdRef.current = null;
        },
      }),
    [dropZoneBounds, onDrop],
  );

  return {
    activeDrag,
    setActiveDrag: (id: string | null) => {
      setActiveDrag(id);
      dragItemIdRef.current = id;
    },
    dragPosition,
    isOverBasket,
    panResponder,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/usePicnicDrag.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePicnicDrag.ts src/hooks/usePicnicDrag.test.ts
git commit -m "feat: extract usePicnicDrag hook from PicnicBasket"
```

---

## Task 10: Update PicnicBasket to Use Extracted Hooks

**Files:**
- Modify: `src/components/numberpicnic/PicnicBasket.tsx`

- [ ] **Step 1: Run existing PicnicBasket tests to establish baseline**

Run: `npx jest src/components/numberpicnic/PicnicBasket.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 2: Refactor PicnicBasket to use extracted hooks**

Replace inline drag/drop logic with hook calls.

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npx jest src/components/numberpicnic/PicnicBasket.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/numberpicnic/PicnicBasket.tsx
git commit -m "refactor: use extracted hooks in PicnicBasket"
```

---

## Task 11: Expand usePatternTrainGame Hook

**Files:**
- Modify: `src/screens/usePatternTrainGame.ts`
- Read: `src/screens/PatternTrainScreen.tsx` (identify game state currently in screen)

- [ ] **Step 1: Read current usePatternTrainGame to understand existing API**

Run: `cat src/screens/usePatternTrainGame.ts`

- [ ] **Step 2: Identify state that should move from PatternTrainScreen into usePatternTrainGame**

The following state from PatternTrainScreen lines 68-90 should move into the hook:
- `pattern` (TrainPattern | null) — current pattern being displayed
- `completedRounds` (number) — count of completed rounds
- `wrongAttempts` (number) — incorrect attempts this round
- `isProcessing` (boolean) — round transition lock
- `selectedChoice` (string | null) — user's current selection
- `attachedCarriage` (string | null) — attached carriage ID
- `draggableCarriages` (DraggableCarriage[]) — available carriages
- `feedback` (string) — feedback message
- `feedbackType` ('initial' | 'correct' | 'incorrect' | 'reveal') — feedback variant

UI-only state (showMilestoneModal, showDifficultySelector) stays in the screen.

- [ ] **Step 3: Expand usePatternTrainGame to own additional game state**

```typescript
// src/screens/usePatternTrainGame.ts (expanded)
// Add to the hook's return value:
interface UsePatternTrainGameReturn {
  // ... existing fields ...
  // Add new fields from PatternTrainScreen:
  pattern: TrainPattern | null;
  completedRounds: number;
  wrongAttempts: number;
  isProcessing: boolean;
  selectedChoice: string | null;
  attachedCarriage: string | null;
  draggableCarriages: DraggableCarriage[];
  feedback: string;
  feedbackType: 'initial' | 'correct' | 'incorrect' | 'reveal';
  // Add setters for each:
  setPattern: (pattern: TrainPattern | null) => void;
  setCompletedRounds: (rounds: number) => void;
  setWrongAttempts: (attempts: number) => void;
  setIsProcessing: (processing: boolean) => void;
  setSelectedChoice: (choice: string | null) => void;
  setAttachedCarriage: (id: string | null) => void;
  setDraggableCarriages: (carriages: DraggableCarriage[]) => void;
  setFeedback: (feedback: string) => void;
  setFeedbackType: (type: 'initial' | 'correct' | 'incorrect' | 'reveal') => void;
}
```

- [ ] **Step 4: Update PatternTrainScreen to consume expanded hook**

- [ ] **Step 5: Run existing tests to verify no regressions**

Run: `npx jest src/screens/PatternTrainScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/screens/usePatternTrainGame.ts src/screens/PatternTrainScreen.tsx
git commit -m "feat: expand usePatternTrainGame with additional game state"
```

---

## Task 12: Extract PatternTrainUI Hook

**Files:**
- Create: `src/hooks/usePatternTrainUI.ts`
- Create: `src/hooks/usePatternTrainUI.test.ts`
- Read: `src/screens/PatternTrainScreen.tsx` (UI state and celebrations)

- [ ] **Step 1: Write failing tests for usePatternTrainUI**

```typescript
// src/hooks/usePatternTrainUI.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { usePatternTrainUI } from './usePatternTrainUI';

describe('usePatternTrainUI', () => {
  it('starts with no celebration', () => {
    const { result } = renderHook(() => usePatternTrainUI());
    expect(result.current.showCelebration).toBe(false);
    expect(result.current.celebrationPhrase).toBe('');
  });

  it('tracks milestone count', () => {
    const { result } = renderHook(() => usePatternTrainUI());
    expect(result.current.milestoneCount).toBe(0);
  });

  it('resets on unmount', () => {
    const { unmount } = renderHook(() => usePatternTrainUI());
    expect(() => unmount()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/usePatternTrainUI.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './usePatternTrainUI'"

- [ ] **Step 3: Implement usePatternTrainUI hook**

```typescript
// src/hooks/usePatternTrainUI.ts
import { useState, useCallback, useRef } from 'react';

const CELEBRATION_PHRASES = [
  'games.patternTrain.celebration.phrase1',
  'games.patternTrain.celebration.phrase2',
  'games.patternTrain.celebration.phrase3',
  'games.patternTrain.celebration.phrase4',
  'games.patternTrain.celebration.phrase5',
];

interface UsePatternTrainUIOptions {
  milestoneInterval?: number;
}

export function usePatternTrainUI(options: UsePatternTrainUIOptions = {}) {
  const { milestoneInterval = 5 } = options;
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [milestoneCount, setMilestoneCount] = useState(0);
  const phraseIndexRef = useRef(0);

  const triggerCelebration = useCallback(() => {
    const phrase = CELEBRATION_PHRASES[phraseIndexRef.current % CELEBRATION_PHRASES.length];
    phraseIndexRef.current += 1;
    setCelebrationPhrase(phrase);
    setShowCelebration(true);

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  }, []);

  const onPatternComplete = useCallback(() => {
    setMilestoneCount((prev) => {
      const next = prev + 1;
      if (next % milestoneInterval === 0) {
        triggerCelebration();
      }
      return next;
    });
  }, [milestoneInterval, triggerCelebration]);

  return {
    showCelebration,
    celebrationPhrase,
    milestoneCount,
    onPatternComplete,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/usePatternTrainUI.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePatternTrainUI.ts src/hooks/usePatternTrainUI.test.ts
git commit -m "feat: extract usePatternTrainUI hook from PatternTrainScreen"
```

---

## Task 13: Update PatternTrainScreen to Use Extracted Hooks

**Files:**
- Modify: `src/screens/PatternTrainScreen.tsx`
- (usePatternTrainGame expanded in Task 11)

- [ ] **Step 1: Run existing PatternTrainScreen tests to establish baseline**

Run: `npx jest src/screens/PatternTrainScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 2: Refactor PatternTrainScreen to use extracted hooks**

Replace inline UI state with hook calls.

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npx jest src/screens/PatternTrainScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/screens/PatternTrainScreen.tsx
git commit -m "refactor: use extracted hooks in PatternTrainScreen"
```

---

## Task 14: Extract GameSelection Hook

**Files:**
- Create: `src/hooks/useGameSelection.ts`
- Create: `src/hooks/useGameSelection.test.ts`
- Read: `src/screens/HomeScreen.tsx` (game selection logic)

- [ ] **Step 1: Write failing tests for useGameSelection**

```typescript
// src/hooks/useGameSelection.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameSelection } from './useGameSelection';

describe('useGameSelection', () => {
  it('starts with no selected game', () => {
    const { result } = renderHook(() => useGameSelection());
    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDifficultySelector).toBe(false);
  });

  it('provides game selection handlers', () => {
    const { result } = renderHook(() => useGameSelection());
    expect(typeof result.current.handleGameSelect).toBe('function');
    expect(typeof result.current.handleDifficultySelect).toBe('function');
    expect(typeof result.current.handleCloseModal).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/useGameSelection.test.ts --no-coverage`
Expected: FAIL with "Cannot find module './useGameSelection'"

- [ ] **Step 3: Implement useGameSelection hook**

```typescript
// src/hooks/useGameSelection.ts
import { useState, useCallback } from 'react';
import type { Game } from '../screens/HomeScreen';

interface UseGameSelectionReturn {
  selectedGame: Game | null;
  showDifficultySelector: boolean;
  handleGameSelect: (game: Game) => void;
  handleDifficultySelect: (difficulty: Difficulty) => Promise<void>;
  handleCloseModal: () => void;
}

export function useGameSelection(): UseGameSelectionReturn {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const handleGameSelect = useCallback((game: Game) => {
    setSelectedGame(game);
    if (game.id === 'memory-snap') {
      setShowDifficultySelector(true);
    }
  }, []);

  const handleDifficultySelect = useCallback((difficulty: Difficulty) => {
    // The screen will call updateSettings and navigation before or after this
    // This callback signals the modal should close and difficulty is selected
    setShowDifficultySelector(false);
    setSelectedGame(null);
    return difficulty; // Return value for screen to use
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDifficultySelector(false);
    setSelectedGame(null);
  }, []);

  return {
    selectedGame,
    showDifficultySelector,
    handleGameSelect,
    handleDifficultySelect,
    handleCloseModal,
  };
}

type Difficulty = 'easy' | 'medium' | 'hard';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/useGameSelection.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameSelection.ts src/hooks/useGameSelection.test.ts
git commit -m "feat: extract useGameSelection hook from HomeScreen"
```

---

## Task 15: Update HomeScreen to Use Extracted Hooks

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Run existing HomeScreen tests to establish baseline**

Run: `npx jest src/screens/HomeScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 2: Refactor HomeScreen to use extracted hooks**

Replace inline game selection logic with hook calls.

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npx jest src/screens/HomeScreen.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS (all tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "refactor: use extracted hooks in HomeScreen"
```

---

## Task 16: Final Verification

**Files:**
- All modified component and hook files

- [ ] **Step 1: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 3: Verify component line counts**

```bash
wc -l src/components/DrawingCanvas.tsx \
      src/components/GlitterGlobe.tsx \
      src/screens/PatternTrainScreen.tsx \
      src/components/numberpicnic/PicnicBasket.tsx \
      src/screens/HomeScreen.tsx
```

Expected: All components significantly smaller than original sizes.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete MAIN-01 monolithic component decomposition"
```
