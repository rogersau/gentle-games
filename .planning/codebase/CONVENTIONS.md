# Coding Conventions

**Analysis Date:** 2026-03-03

## Naming Patterns

**Files:**
- TypeScript files: `camelCase` (e.g., `gameLogic.ts`, `theme.ts`)
- React components: `PascalCase` (e.g., `HomeScreen.tsx`, `GameCard.tsx`)
- Test files: Append `.test` before extension (e.g., `gameLogic.test.ts`, `HomeScreen.test.tsx`)

**Functions:**
- `camelCase` for all functions (e.g., `generateTiles`, `checkMatch`)
- Use descriptive, verb-based names (e.g., `updateSettings`, `loadSettings`)

**Variables:**
- `camelCase` for variables and constants
- Descriptive names that convey purpose (e.g., `availableItems`, `selectedGame`)

**Types:**
- `PascalCase` for interfaces and types (e.g., `Tile`, `Settings`, `ThemeColors`)
- Use `type` for unions and aliases (e.g., `type Difficulty = 'easy' | 'medium' | 'hard'`)

## Code Style

**Formatting:**
- No explicit formatter config detected (uses Expo defaults)
- 2-space indentation
- Single quotes for strings in TypeScript

**Linting:**
- Not detected - no ESLint or Prettier config files found

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- Type annotations required for function parameters and return types
- Generic types used for reusable components (e.g., `<T>` in `shuffle<T>`)

## Import Organization

**Order:**
1. External libraries (React, React Native, navigation, etc.)
2. Internal imports (context, types, utils, ui components)

**Examples:**
```typescript
// External
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Internal
import { useSettings } from "../context/SettingsContext";
import { Difficulty, PASTEL_COLORS, ThemeColors } from "../types";
import { ResolvedThemeMode, useThemeColors } from "../utils/theme";
import { AppScreen, AppButton, AppModal, GameCard } from "../ui/components";
```

**Path Aliases:**
- Relative paths used throughout (e.g., `../context/SettingsContext`)
- No path aliases configured in `tsconfig.json`

## Error Handling

**Patterns:**
- Use `try/catch` for async operations with `console.warn` for errors
- Input sanitization with type guards and fallback values
- Validation functions for complex data (e.g., `sanitizeSettings`, `toDifficulty`)

**Example from `src/context/SettingsContext.tsx`:**
```typescript
const loadSettings = async () => {
  try {
    const savedSettings = await AsyncStorage.getItem('gentleMatchSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      const sanitized = sanitizeSettings(parsed);
      setSettings(sanitized);
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
    await AsyncStorage.removeItem('gentleMatchSettings');
  } finally {
    setIsLoading(false);
  }
};
```

## Logging

**Framework:** `console.warn` for errors, no structured logging library

**Patterns:**
- Use `console.warn` for recoverable errors
- No debug/info logging in production code

## Comments

**When to Comment:**
- JSDoc comments for exported functions and types
- Explain complex logic or business rules
- Document the "why" behind non-obvious implementations

**Example from `src/types/index.ts`:**
```typescript
/**
 * Dedicated balloon palette for KeepyUppy with guaranteed contrast against both
 * light and dark theme backgrounds.
 */
export const BALLOON_PALETTE = [...]
```

## Function Design

**Size:** Keep functions focused and single-purpose

**Parameters:** 
- TypeScript type annotations required
- Use objects for multiple related parameters (e.g., `{ cols, rows }` destructuring)

**Return Values:**
- Explicit return type annotations
- Early returns for guard clauses

## Module Design

**Exports:**
- Named exports for utility functions (`export const generateTiles`)
- Components as named exports (`export const HomeScreen`)

**Barrel Files:**
- Index files in directories for cleaner imports (e.g., `src/types/index.ts`, `src/ui/components/index.ts`)

## Component Patterns

**Functional Components:**
- Use `React.FC` type for component typing
- Destructure props in function signature

**Example:**
```typescript
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  // ...
};
```

**Styles:**
- Use `createStyles` pattern with `StyleSheet.create`
- Accept theme colors as parameters for memoization

**Example:**
```typescript
const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: Space.xl,
    },
    // ...
  });

const styles = useMemo(
  () => createStyles(colors, resolvedMode),
  [colors, resolvedMode],
);
```

---

*Convention analysis: 2026-03-03*
