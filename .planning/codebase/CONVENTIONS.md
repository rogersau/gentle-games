# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- Use `PascalCase.tsx` for React components and screens in `src/components/`, `src/screens/`, and `src/ui/components/` such as `src/screens/HomeScreen.tsx`, `src/components/GentleErrorBoundary.tsx`, and `src/ui/components/AppButton.tsx`.
- Use `camelCase.ts` for hooks and utilities in `src/utils/`, `src/ui/`, and `src/screens/` such as `src/utils/gameLogic.ts`, `src/utils/theme.ts`, `src/ui/useLayout.ts`, and `src/screens/usePatternTrainGame.ts`.
- Use `*Context.tsx` for React context modules in `src/context/` such as `src/context/SettingsContext.tsx` and `src/context/ParentTimerContext.tsx`.
- Keep tests co-located with the source file using `.test.ts` or `.test.tsx`, for example `src/screens/HomeScreen.test.tsx` and `src/utils/theme.test.ts`.
- Use `index.ts` barrel files only for grouping exports, as in `src/ui/components/index.ts`, `src/components/train/index.ts`, and `src/components/numberpicnic/index.ts`.

**Functions:**
- Use `camelCase` for functions and event handlers, especially `handle*`, `get*`, `set*`, `load*`, `init*`, and `install*`, as seen in `src/screens/HomeScreen.tsx`, `src/context/SettingsContext.tsx`, and `App.tsx`.
- Use verb-first names for imperative helpers such as `generateTiles` in `src/utils/gameLogic.ts`, `changeLanguage` in `src/i18n/index.ts`, and `installPwaInteractionGuards` in `src/utils/pwaInteractionGuards.ts`.
- Name style factories `createStyles` and memoize them from the component, as in `src/screens/SettingsScreen.tsx`, `src/ui/components/AppButton.tsx`, and `src/components/GentleErrorBoundary.tsx`.

**Variables:**
- Use descriptive `camelCase` state names with boolean prefixes like `isLoading`, `isLocked`, `showDifficultySelector`, and `fontsLoaded` in `src/context/SettingsContext.tsx`, `src/context/ParentTimerContext.tsx`, and `App.tsx`.
- Use uppercase constants for static collections and route maps such as `GAMES` and `ROUTE_MAP` in `src/screens/HomeScreen.tsx`, `ALL_GAMES` in `src/screens/SettingsScreen.tsx`, and `PASTEL_COLORS` in `src/types/index.ts`.

**Types:**
- Use `PascalCase` for interfaces, context types, and exported type aliases such as `SettingsContextType` in `src/context/SettingsContext.tsx`, `LayoutInfo` in `src/ui/useLayout.ts`, and `TranslationKey` in `src/i18n/types.ts`.
- Keep prop interfaces adjacent to the component that uses them, as in `src/ui/components/AppButton.tsx`, `src/ui/components/GameCard.tsx`, and `src/ui/components/AppScreen.tsx`.

## Code Style

**Formatting:**
- Dedicated formatter config is not detected. No `.prettierrc`, `biome.json`, or equivalent formatter config is present at the repository root.
- Follow the dominant in-file style used across `App.tsx`, `src/context/SettingsContext.tsx`, and `src/ui/components/AppButton.tsx`: semicolons enabled, trailing commas in multiline objects, and explicit type annotations where they improve readability.
- Use `StyleSheet.create(...)` for non-trivial style objects instead of inline styles. Inline styles are reserved for small computed overrides, as in `src/screens/HomeScreen.tsx` and `src/ui/components/AppButton.tsx`.
- Prefer memoized style factories when styles depend on theme values:

```typescript
const { colors, resolvedMode } = useThemeColors();
const styles = useMemo(
  () => createStyles(colors, resolvedMode),
  [colors, resolvedMode],
);
```

- Quote style is not fully uniform. Most files such as `App.tsx`, `src/context/SettingsContext.tsx`, and `src/ui/components/AppButton.tsx` use single quotes, while `src/screens/HomeScreen.tsx` uses double quotes. Match the surrounding file instead of reformatting unrelated lines.

**Linting:**
- Dedicated lint config is not detected. No `.eslintrc*` or `eslint.config.*` file is present at the repository root.
- `tsconfig.json` enforces `strict: true`; treat TypeScript strictness as the main static quality gate.
- Use `unknown` for caught errors and narrow before use, as in `App.tsx`, `src/utils/theme.ts`, and `src/context/SettingsContext.tsx`.

## Import Organization

**Order:**
1. Framework and third-party imports first, such as `react`, `react-native`, `expo-*`, and library packages in `App.tsx` and `src/screens/SettingsScreen.tsx`
2. Local application imports second, grouped by area such as context, screens, utilities, and UI modules in `App.tsx`
3. Side-effect imports last or clearly separated near the top when initialization is required, such as `import './src/i18n';` in `App.tsx`

**Path Aliases:**
- Path aliases are not configured in `tsconfig.json`.
- Use relative imports consistently, for example `../utils/theme` in `src/screens/SettingsScreen.tsx` and `../../utils/theme` in `src/ui/components/AppButton.tsx`.

## Error Handling

**Patterns:**
- Wrap storage, startup, and integration code in `try`/`catch`, then degrade gracefully with `console.warn(...)` rather than crashing, as in `src/context/SettingsContext.tsx`, `src/utils/theme.ts`, and `src/screens/DrawingScreen.tsx`.
- Fire startup async work with `void promiseReturningCall().catch(...)` at module or effect level, as in `App.tsx` for Sentry, PostHog, and splash screen setup.
- Clear or reset corrupted persisted state when parsing fails instead of keeping partial data, as in `src/context/SettingsContext.tsx` and `src/screens/DrawingScreen.tsx`.
- Use a screen-level error boundary for user-facing fallback UI in `src/components/GentleErrorBoundary.tsx`; prefer child-friendly recovery text over raw stack traces.

## Logging

**Framework:** console plus Sentry/PostHog wrappers

**Patterns:**
- Use `console.warn(...)` for recoverable runtime issues in `App.tsx`, `src/context/SettingsContext.tsx`, `src/utils/theme.ts`, and `src/screens/DrawingScreen.tsx`.
- Use `console.log(...)` only inside instrumentation wrappers when a service is disabled, as in `src/components/GentleErrorBoundary.tsx` and `src/utils/sentry.ts`.
- Send production error details to Sentry through helper modules and the error boundary rather than logging exception details everywhere, as in `src/components/GentleErrorBoundary.tsx` and `src/utils/sentry.ts`.

## Comments

**When to Comment:**
- Comment non-obvious platform behavior, initialization order, and UX intent. Good examples appear in `App.tsx`, `src/components/GentleErrorBoundary.tsx`, and `src/test-utils/infiniteLoopDetection.ts`.
- Do not add comments for straightforward JSX or simple state setters; most component files such as `src/ui/components/AppButton.tsx` and `src/ui/components/GameCard.tsx` rely on clear naming instead.

**JSDoc/TSDoc:**
- Use short TSDoc blocks for exported utilities and reusable hooks when behavior is subtle, as in `src/test-utils/infiniteLoopDetection.ts` and `src/ui/useLayout.ts`.
- Inline prop comments are used selectively inside interfaces, for example `src/context/ParentTimerContext.tsx` and `src/ui/components/GameCard.tsx`.

## Function Design

**Size:** Keep transformation helpers small and pure where possible. `src/context/SettingsContext.tsx` splits persistence sanitization into `toBoolean`, `toVolume`, `toDifficulty`, and related helpers instead of one monolith.

**Parameters:** Prefer typed object parameters when a hook or helper has multiple related inputs, as in `src/screens/usePatternTrainGame.ts`. Use simple primitives for focused utilities such as `resolveThemeMode` in `src/utils/theme.ts`.

**Return Values:** Return normalized values instead of leaking invalid input downstream. `sanitizeSettings` in `src/context/SettingsContext.tsx`, `getThemeColors` in `src/utils/theme.ts`, and `getContentWidth` in `src/ui/useLayout.ts` are the pattern to follow.

## Module Design

**Exports:**
- Prefer named exports for components, hooks, and helpers, as in `src/screens/HomeScreen.tsx`, `src/ui/components/AppButton.tsx`, and `src/utils/theme.ts`.
- Use default exports sparingly for entry points or singleton-style modules, such as `App.tsx` and `src/i18n/index.ts`.

**Barrel Files:**
- Barrel files are used for stable UI and feature submodule entry points in `src/ui/components/index.ts`, `src/components/train/index.ts`, and `src/components/numberpicnic/index.ts`.
- Import from a barrel when consuming a curated UI set, as in `src/screens/HomeScreen.tsx` and `src/screens/SettingsScreen.tsx`.

## Architectural Patterns

**Component layering:**
- Keep screens in `src/screens/` responsible for composition, navigation, and local orchestration. Examples: `src/screens/HomeScreen.tsx` and `src/screens/SettingsScreen.tsx`.
- Keep reusable presentation primitives in `src/ui/components/` and shared design tokens in `src/ui/tokens.ts`.
- Keep game rules and side-effect wrappers in `src/utils/`, as in `src/utils/gameLogic.ts`, `src/utils/patternTrainLogic.ts`, `src/utils/analytics.ts`, and `src/utils/sentry.ts`.

**Reusable styling:**
- Pull spacing, typography, radii, shadows, and hit target values from `src/ui/tokens.ts`.
- Derive all user-facing colors from `useThemeColors()` in `src/utils/theme.ts` rather than hard-coding palette values inside screens.

**Exceptions:**
- Use function components by default. `src/components/GentleErrorBoundary.tsx` is the intentional class-component exception because React error boundaries still require a class.

## State Management Patterns

**App-wide state:**
- Use React Context for cross-screen state. `src/context/SettingsContext.tsx` stores persisted settings, and `src/context/ParentTimerContext.tsx` manages the parent gate timer.
- Register providers at the top level in `App.tsx` so screens and UI primitives can read shared state without prop drilling.

**Screen and component state:**
- Use local `useState` for transient UI state such as modals, selected options, and animation state in `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, and `src/context/ParentTimerContext.tsx`.
- Use `useMemo` for derived collections and theme-bound styles, such as `visibleGames` in `src/screens/HomeScreen.tsx` and memoized style objects across most UI components.
- Use `useRef` for mutable handles that should not trigger renders, as in navigation tracking in `App.tsx` and interval management in `src/context/ParentTimerContext.tsx`.

**Reusable state logic:**
- Extract non-trivial interaction state into custom hooks when a screen would otherwise become too stateful. `src/screens/usePatternTrainGame.ts` is the reference pattern.

## UX, i18n, and Accessibility Conventions

**UX tone:**
- Keep copy calm, child-friendly, and non-threatening. `src/components/GentleErrorBoundary.tsx`, `src/screens/HomeScreen.tsx`, and the translation keys in `src/i18n/locales/en-AU.json` establish the tone.
- Favor forgiving defaults and graceful fallback behavior, such as continuing without analytics in `App.tsx` and clearing corrupt persisted state in `src/context/SettingsContext.tsx`.

**i18n:**
- Use `useTranslation()` and call `t('...')` for visible strings instead of inline English text in app code. See `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, and `src/context/ParentTimerContext.tsx`.
- Use typed translation keys where the module benefits from compile-time safety, as in `TranslationKey` usage in `src/screens/HomeScreen.tsx` and `src/screens/SettingsScreen.tsx`.
- Keep supported languages and defaults centralized in `src/types/i18n.ts`, and initialize i18n once in `src/i18n/index.ts`.
- Validate tricky translation keys with `validateTranslation(...)` from `src/i18n/types.ts` and maintain focused validation coverage in `src/utils/translationValidation.test.ts`.

**Accessibility:**
- Provide `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` on interactive UI, as in `src/screens/HomeScreen.tsx`, `src/ui/components/AppButton.tsx`, `src/ui/components/GameCard.tsx`, and `src/components/GentleErrorBoundary.tsx`.
- Respect touch target minimums via `HitTarget.min` from `src/ui/tokens.ts` and `hitSlop`/`pressRetentionOffset` in `src/ui/components/AppButton.tsx`.
- Honor reduced-motion preferences via `useReducedMotion()` in `src/utils/theme.ts` and the persisted `reducedMotionEnabled` setting in `src/context/SettingsContext.tsx`.
- Preserve testability and accessibility together by assigning stable `testID` values to important controls, such as `home-screen` in `src/screens/HomeScreen.tsx` and parent timer controls in `src/context/ParentTimerContext.tsx`.

---

*Convention analysis: 2026-03-17*
