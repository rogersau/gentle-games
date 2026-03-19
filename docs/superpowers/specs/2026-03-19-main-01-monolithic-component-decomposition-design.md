# MAIN-01: Monolithic Component Decomposition Design

## Overview

Decompose 5 monolithic components into focused hooks + presentational components. The goal is to make the largest interactive surfaces easier to modify, test, and review by separating stateful logic from rendering.

**Requirement**: MAIN-01 — Developers can modify the largest interactive surfaces through extracted hooks or child components instead of monolithic modules.

## Core Principles

- Extract stateful logic into focused hooks with clean return APIs
- Keep UI components mostly presentational
- Use composition hooks to wire core hooks together when they need to share state
- Existing tests continue to pass unchanged after each extraction
- Extract hooks one at a time, run tests after each extraction

## Decomposition Order

1. DrawingCanvas (1136 lines) — largest, highest impact
2. PatternTrainScreen (885 lines) — game orchestration logic
3. GlitterGlobe (704 lines) — animation and gesture logic
4. PicnicBasket (429 lines) — drag/drop and rendering
5. HomeScreen (372 lines) — already relatively small

## DrawingCanvas Decomposition

**Current state**: 1136 lines with history, gestures, tools, symmetry, and UI all in one component.

**Extracted hooks**:

### useDrawingHistory

Manages history state, undo, clear, and actionId tracking.

**Input**:
- `initialHistory: HistoryEntry[]`
- `onHistoryChange?: (history: HistoryEntry[]) => void`

**Returns**:
- `history: HistoryEntry[]`
- `addToHistory: (entry: HistoryEntry) => void`
- `undo: () => void`
- `clearHistory: () => void`
- `getHistorySnapshot: () => HistoryEntry[]`

**File**: `src/hooks/useDrawingHistory.ts`
**Test file**: `src/hooks/useDrawingHistory.test.ts`

### useDrawingTools

Manages tool, color, shape, and symmetry selection.

**Input**: none (uses defaults)

**Returns**:
- `tool: Tool` / `setTool: (tool: Tool) => void`
- `selectedColor: string` / `setSelectedColor: (color: string) => void`
- `shapeType: ShapeType` / `setShapeType: (type: ShapeType) => void`
- `shapeSize: number` / `setShapeSize: (size: number) => void`
- `symmetryMode: SymmetryMode` / `setSymmetryMode: (mode: SymmetryMode) => void`

**File**: `src/hooks/useDrawingTools.ts`
**Test file**: `src/hooks/useDrawingTools.test.ts`

### useSymmetry

Computes mirrored points based on symmetry mode.

**Input**:
- `symmetryMode: SymmetryMode`

**Returns**:
- `getSymmetryOffsets: () => Array<[number, number]>` — returns `[xMult, yMult]` pairs for mirroring

**File**: `src/hooks/useSymmetry.ts`
**Test file**: `src/hooks/useSymmetry.test.ts`

### useDrawingCanvas (composition hook)

Wires core hooks together and handles gesture logic.

**Input**:
- `initialHistory: HistoryEntry[]`
- `onHistoryChange?: (history: HistoryEntry[]) => void`
- `canvasWidth: number`
- `canvasHeight: number`

**Returns**:
- PanResponder
- Current strokes state
- All tool/history/symmetry state (delegated from core hooks)

**File**: `src/hooks/useDrawingCanvas.ts`
**Test file**: `src/hooks/useDrawingCanvas.test.ts`

**Result**: `DrawingCanvas.tsx` drops to ~300-400 lines of rendering + UI (toolbars, pickers, modals).

## PatternTrainScreen Decomposition

**Current state**: 885 lines with game logic, round management, and UI rendering.

**Extracted hooks**:

### usePatternTrainGame (existing, may need expansion)

Manages pattern generation, answer validation, round progression.

**File**: `src/screens/usePatternTrainGame.ts` (already exists)
**Changes**: May need expansion to own more game state currently in the screen component.

### usePatternTrainUI

Manages UI state: celebration visibility, milestone tracking, layout concerns.

**Input**: game state from `usePatternTrainGame`

**Returns**:
- `showCelebration: boolean`
- `celebrationPhrase: string`
- Milestone tracking state
- Layout helpers

**File**: `src/hooks/usePatternTrainUI.ts`
**Test file**: `src/hooks/usePatternTrainUI.test.ts`

**Result**: `PatternTrainScreen.tsx` becomes presentation of train visualization + UI controls.

## GlitterGlobe Decomposition

**Current state**: 704 lines with particle animation, gesture handling, and rendering.

**Extracted hooks**:

### useGlitterParticles

Manages particle state, animation loop, and physics.

**Input**:
- `config: ParticleConfig` (count, speed, colors)

**Returns**:
- `particles: Particle[]`
- `ripples: Ripple[]`
- `startAnimation: () => void`
- `stopAnimation: () => void`

**File**: `src/hooks/useGlitterParticles.ts`
**Test file**: `src/hooks/useGlitterParticles.test.ts`

### useGlitterGestures

Manages shake detection, wake handling, and touch interactions.

**Input**: callbacks for shake/wake events

**Returns**:
- `onShake: () => void`
- `onWake: () => void`
- Gesture handlers

**File**: `src/hooks/useGlitterGestures.ts`
**Test file**: `src/hooks/useGlitterGestures.test.ts`

**Result**: `GlitterGlobe.tsx` becomes SVG/canvas rendering of particles and effects.

## PicnicBasket Decomposition

**Current state**: 429 lines with drag/drop logic and visual rendering.

**Extracted hooks**:

### usePicnicDrag

Manages drag state, PanResponder, and drop validation.

**Input**:
- `onDrop: (itemId: string, valid: boolean) => void`

**Returns**:
- `activeDrag: string | null`
- `dragPosition: { x: number, y: number }`
- `isOverBasket: boolean`
- `panResponder: PanResponderInstance`

**File**: `src/hooks/usePicnicDrag.ts`
**Test file**: `src/hooks/usePicnicDrag.test.ts`

**Result**: `PicnicBasket.tsx` becomes visual rendering of basket + items.

## HomeScreen Decomposition

**Current state**: 372 lines — already relatively small.

**Extracted hooks**:

### useGameSelection

Manages difficulty modal, game selection logic, and navigation.

**Input**: none

**Returns**:
- `selectedGame: Game | null`
- `showDifficultySelector: boolean`
- `handleGameSelect: (game: Game) => void`
- `handleDifficultySelect: (difficulty: Difficulty) => void`
- `handleCloseModal: () => void`

**File**: `src/hooks/useGameSelection.ts`
**Test file**: `src/hooks/useGameSelection.test.ts`

**Result**: `HomeScreen.tsx` becomes layout + rendering of game grid.

## Testing Strategy

### For each extracted hook

- Unit tests colocated with the hook file
- Test the hook's public API in isolation
- Mock only external dependencies (e.g., AsyncStorage for history persistence)

### For updated components

- Existing screen/component tests validate the same behavior
- No new tests needed for the component itself (behavior unchanged)

### Regression safety

- Extract hooks one at a time, run existing tests after each extraction
- If a test breaks, the extraction exposed a hidden coupling — fix before proceeding

## Files to Create

### DrawingCanvas hooks
- `src/hooks/useDrawingHistory.ts`
- `src/hooks/useDrawingHistory.test.ts`
- `src/hooks/useDrawingTools.ts`
- `src/hooks/useDrawingTools.test.ts`
- `src/hooks/useSymmetry.ts`
- `src/hooks/useSymmetry.test.ts`
- `src/hooks/useDrawingCanvas.ts`
- `src/hooks/useDrawingCanvas.test.ts`

### PatternTrainScreen hooks
- `src/hooks/usePatternTrainUI.ts`
- `src/hooks/usePatternTrainUI.test.ts`

### GlitterGlobe hooks
- `src/hooks/useGlitterParticles.ts`
- `src/hooks/useGlitterParticles.test.ts`
- `src/hooks/useGlitterGestures.ts`
- `src/hooks/useGlitterGestures.test.ts`

### PicnicBasket hooks
- `src/hooks/usePicnicDrag.ts`
- `src/hooks/usePicnicDrag.test.ts`

### HomeScreen hooks
- `src/hooks/useGameSelection.ts`
- `src/hooks/useGameSelection.test.ts`

## Files to Modify

- `src/components/DrawingCanvas.tsx` — use extracted hooks
- `src/screens/PatternTrainScreen.tsx` — use extracted hooks
- `src/components/GlitterGlobe.tsx` — use extracted hooks
- `src/components/numberpicnic/PicnicBasket.tsx` — use extracted hooks
- `src/screens/HomeScreen.tsx` — use extracted hooks

## Success Criteria

1. **DrawingCanvas**: Developers can change drawing history behavior by editing `useDrawingHistory` without touching gesture or rendering code
2. **GlitterGlobe**: Developers can change particle animation by editing `useGlitterParticles` without touching gesture or rendering code
3. **PatternTrainScreen**: Developers can change game logic by editing `usePatternTrainGame` without touching UI rendering
4. **PicnicBasket**: Developers can change drag behavior by editing `usePicnicDrag` without touching visual rendering
5. **HomeScreen**: Developers can change game selection flow by editing `useGameSelection` without touching layout code
6. **All components**: Existing tests pass unchanged after decomposition
7. **All hooks**: Each extracted hook has colocated unit tests covering its public API

## Out of Scope

- Extracting child components (hooks-first approach only)
- Changing component APIs or props
- Adding new features or changing behavior
- Refactoring beyond the 5 identified monolithic components
