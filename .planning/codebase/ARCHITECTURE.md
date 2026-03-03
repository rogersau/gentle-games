# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** React Native / Expo SPA with Screen-Based Navigation

**Key Characteristics:**
- Stack-based navigation using React Navigation (`@react-navigation/stack`)
- Context-driven state management for global settings
- Component-based architecture with clear separation between screens, components, and utilities
- Offline-first design with AsyncStorage for persistence
- Multi-platform support (iOS, Android, Web via Expo)

## Layers

### Entry Layer:
- Location: `App.tsx`
- Responsibilities: App initialization, providers setup, navigation configuration
- Contains: `AppNavigator` component with Stack.Navigator defining all routes
- Providers: `SettingsProvider`, `ParentTimerProvider`, `SafeAreaProvider`

### Screen Layer (`src/screens/`):
- Purpose: Page-level components that represent full screens
- Contains: Game screens, Home, Settings
- Dependencies: Use contexts, UI components, game logic utilities
- Examples: `HomeScreen.tsx`, `GameScreen.tsx`, `BubbleScreen.tsx`

### Component Layer (`src/components/`):
- Purpose: Game-specific UI components and interactive elements
- Contains: `GameBoard`, `Tile`, `BreathingBall`, `GlitterGlobe`, etc.
- Subdirectory: `src/components/train/` for train-specific components

### UI Layer (`src/ui/`):
- Purpose: Core reusable UI primitives and design system
- Location: `src/ui/components/`
- Contains: `AppScreen`, `AppButton`, `AppCard`, `AppModal`, `GameCard`, etc.
- Design tokens: `src/ui/tokens.ts` (spacing, typography, shadows)

### Context Layer (`src/context/`):
- Purpose: Global state management
- Contains: `SettingsContext.tsx`, `ParentTimerContext.tsx`
- Settings persisted to AsyncStorage

### Utility Layer (`src/utils/`):
- Purpose: Game logic, theming, sounds, helpers
- Contains: `gameLogic.ts`, `bubbleLogic.ts`, `theme.ts`, `sounds.ts`

### Type Layer (`src/types/`):
- Purpose: TypeScript type definitions and constants
- Contains: `index.ts` (core types, color palettes), `i18n.ts` (language types)

### i18n Layer (`src/i18n/`):
- Purpose: Internationalization
- Setup: `index.ts` with i18next
- Locales: `src/i18n/locales/` (en-AU.json, en-US.json)

## Data Flow

**Navigation Flow:**
```
HomeScreen → Game Screens (via Stack Navigator)
           → SettingsScreen
           → Individual Game Screens (Bubble, Drawing, Glitter, etc.)
```

**Settings Flow:**
```
SettingsContext (loads from AsyncStorage on mount)
    ↓
App re-renders with new settings
    ↓
Components consume via useSettings() hook
    ↓
User changes settings → updateSettings() → saves to AsyncStorage
```

**Game Logic Flow:**
```
Screen component (e.g., BubbleScreen)
    ↓ uses
Game Board component (e.g., BubbleField)
    ↓ uses
Game Logic utility (e.g., bubbleLogic.ts)
    ↓ uses
Game Types (e.g., types/index.ts)
```

## Key Abstractions

**Screen Abstraction:**
- All screens wrapped in `AppScreen` component for consistent layout
- Screens use `AppHeader` for navigation bar with back button
- Game screens typically composed of: header, game board, stats display

**Component Abstraction:**
- Game boards handle all game state (tiles, moves, timing)
- Screens pass callbacks for navigation and completion handling
- Components consume `useThemeColors()` for theming

**Context Abstraction:**
- `SettingsContext`: All app preferences, persisted
- `ParentTimerContext`: Parent-controlled timer feature

**Design System:**
- `tokens.ts`: Spacing scale, typography, shadows, breakpoints
- `theme.ts`: Light/dark theme color resolution
- `fonts.ts`: Nunito font family loading

## Entry Points

**Primary Entry:**
- Location: `App.tsx`
- Triggers: App launch
- Responsibilities: Initialize i18n, configure navigation, setup providers, load fonts

**Screen Entry Points:**
- `HomeScreen`: Main menu with game grid
- `GameScreen`: Memory Snap game (configurable difficulty)
- Individual game screens: Each registered as Stack.Screen

**Provider Entry Points:**
- `SettingsProvider`: Initializes settings from AsyncStorage
- `ParentTimerProvider`: Timer management for parents

## Error Handling

**Strategy:** Graceful degradation with console warnings

**Patterns:**
- Async operations wrapped in try/catch with user-friendly warnings
- Settings loading failures clear corrupted data
- Sound playback failures don't crash the app
- Null checks in context consumers with descriptive errors

## Cross-Cutting Concerns

**Logging:** console.warn for recoverable errors, no structured logging

**Validation:**
- Settings sanitization on load with type coercion
- Input validation for difficulty, theme, colorMode

**Authentication:** Not applicable (no auth - child-friendly app)

**Internationalization:**
- All user-facing text uses `useTranslation()` hook
- Translation keys defined in `src/i18n/types.ts`
- Supported: en-AU (default), en-US

**Theming:**
- Theme resolution in `src/utils/theme.ts`
- Light/dark mode with system preference detection
- Color constants in `src/types/index.ts` (PASTEL_COLORS, DARK_PASTEL_COLORS)

---

*Architecture analysis: 2026-03-03*
