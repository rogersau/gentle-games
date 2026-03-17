# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Component-driven Expo app with a single React Navigation stack, shared React Context providers, and per-feature screen/component/logic slices.

**Key Characteristics:**
- `App.tsx` is the composition root: it initializes i18n, fonts, analytics, Sentry, audio, PWA guards, providers, and the navigation tree before any screen renders.
- Screen modules in `src/screens/` own feature orchestration, while reusable presentation and interaction primitives live in `src/components/` and `src/ui/components/`.
- Persistent cross-screen state is intentionally small and centralized in `src/context/SettingsContext.tsx` and `src/context/ParentTimerContext.tsx`; most game state stays local to a screen or feature hook such as `src/utils/numberPicnicLogic.ts` or `src/screens/usePatternTrainGame.ts`.

## Layers

**Bootstrap / Application Shell:**
- Purpose: Start the Expo app, register the root component, initialize cross-cutting services, and compose top-level providers.
- Location: `index.ts`, `App.tsx`
- Contains: Expo root registration, splash screen handling, `SafeAreaProvider`, `SettingsProvider`, `ParentTimerProvider`, `NavigationContainer`, stack screen definitions, analytics screen tracking, PWA guards.
- Depends on: `src/context/SettingsContext.tsx`, `src/context/ParentTimerContext.tsx`, `src/utils/analytics.ts`, `src/utils/sentry.ts`, `src/utils/sounds.ts`, `src/utils/pwaBackGuard.ts`, `src/utils/pwaInteractionGuards.ts`, `src/i18n/index.ts`, `src/ui/fonts.ts`
- Used by: The entire runtime; `index.ts` registers `App.tsx` with Expo.

**Navigation / Screen Layer:**
- Purpose: Map route names to user-visible activities and compose each feature page from shared UI plus game-specific logic.
- Location: `App.tsx`, `src/screens/*.tsx`
- Contains: `HomeScreen`, `SettingsScreen`, `GameScreen`, and one screen per game such as `src/screens/GlitterScreen.tsx`, `src/screens/BubbleScreen.tsx`, `src/screens/PatternTrainScreen.tsx`, `src/screens/NumberPicnicScreen.tsx`.
- Depends on: Shared UI from `src/ui/components/`, state from `src/context/`, hooks/helpers from `src/utils/`, and feature components from `src/components/`.
- Used by: React Navigation stack declared in `App.tsx`.

**Feature Component Layer:**
- Purpose: Encapsulate game-specific rendering and interaction primitives that are larger than a generic UI control but narrower than a whole screen.
- Location: `src/components/`, `src/components/numberpicnic/`, `src/components/train/`
- Contains: Boards, canvases, animated objects, error boundary, draggable feature pieces, and feature subcomponent barrels such as `src/components/numberpicnic/index.ts` and `src/components/train/index.ts`.
- Depends on: `src/utils/` logic hooks/functions, `src/context/SettingsContext.tsx`, `src/utils/theme.ts`, `src/ui/tokens.ts`, `src/ui/components/`
- Used by: Screen modules in `src/screens/`.

**Shared UI System Layer:**
- Purpose: Provide layout shells, headers, buttons, cards, controls, motion helpers, fonts, and design tokens that keep screens visually consistent.
- Location: `src/ui/components/`, `src/ui/tokens.ts`, `src/ui/fonts.ts`, `src/ui/animations.ts`, `src/ui/useLayout.ts`
- Contains: `AppScreen`, `AppHeader`, `AppButton`, `AppCard`, `AppModal`, setting controls, responsive layout hook, and token definitions.
- Depends on: `src/utils/theme.ts`, `src/types/index.ts`
- Used by: All screen modules and some feature components.

**State and Cross-Cutting Services Layer:**
- Purpose: Store persistent settings, parent-lock state, theme resolution, localization state, audio helpers, telemetry, and runtime guards.
- Location: `src/context/`, `src/utils/`, `src/i18n/`
- Contains: Persistent settings in `src/context/SettingsContext.tsx`, lock overlay in `src/context/ParentTimerContext.tsx`, theme hooks in `src/utils/theme.ts`, analytics in `src/utils/analytics.ts`, Sentry in `src/utils/sentry.ts`, sound/music helpers in `src/utils/sounds.ts` and `src/utils/music.ts`, localization bootstrap in `src/i18n/index.ts`.
- Depends on: AsyncStorage, Expo APIs, React hooks, static constants from `src/types/index.ts`
- Used by: `App.tsx`, screens, components, and UI primitives.

**Domain Logic / Static Data Layer:**
- Purpose: Keep reusable game rules, timing, generation, and static content out of render components.
- Location: `src/utils/*.ts`, `src/types/index.ts`, `src/types/i18n.ts`, `src/i18n/locales/*.json`
- Contains: Memory-game tile generation in `src/utils/gameLogic.ts`, pattern generation in `src/utils/patternTrainLogic.ts`, Number Picnic hook logic in `src/utils/numberPicnicLogic.ts`, Keepy Uppy helpers in `src/utils/keepyUppyLogic.ts`, theme palettes and content datasets in `src/types/index.ts`.
- Depends on: Primitive React hooks when implemented as hooks, otherwise only app types/constants.
- Used by: Screen and feature component layers.

## Data Flow

**App Startup Flow:**

1. `index.ts` registers `App.tsx` with Expo via `registerRootComponent`.
2. `App.tsx` imports `./src/i18n`, kicks off `initSentry()` and `initAnalytics()`, prevents splash auto-hide, loads custom fonts with `useFonts()`, and initializes shared sounds through `initializeSounds()`.
3. `App.tsx` wraps the tree in `SafeAreaProvider`, `SettingsProvider`, and `ParentTimerProvider`, then mounts `NavigationContainer` and the stack navigator.
4. `ParentTimerProvider` in `src/context/ParentTimerContext.tsx` renders its modal overlay alongside children, so the lock screen can interrupt any route without route-specific code.

**Navigation and Screen Selection Flow:**

1. `HomeScreen` in `src/screens/HomeScreen.tsx` filters visible games from local `GAMES` metadata using `settings.hiddenGames` and `settings.enableUnfinishedGames` from `useSettings()`.
2. `HomeScreen` maps a selected game ID through `ROUTE_MAP` and calls `navigation.navigate(...)`; Memory Snap is the only route that gates navigation behind a difficulty modal in the screen itself.
3. `App.tsx` receives navigation state changes through `NavigationContainer.onStateChange`, extracts the active route name with `getActiveRouteName()`, and forwards that route to `trackScreenView()` in `src/utils/analytics.ts`.
4. Each non-home screen uses `AppHeader` from `src/ui/components/AppHeader.tsx` and usually returns with `navigation.goBack()`, keeping route transitions simple and stack-based.

**Persistent Settings Flow:**

1. `SettingsProvider` in `src/context/SettingsContext.tsx` loads serialized settings from AsyncStorage key `gentleMatchSettings`, sanitizes every field, and exposes `{ settings, updateSettings, isLoading }`.
2. UI consumers such as `src/screens/SettingsScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/components/GameBoard.tsx`, and `src/utils/theme.ts` read `settings` through `useSettings()`.
3. `updateSettings()` merges partial updates, sanitizes them again, persists them back to AsyncStorage, and applies side effects such as `changeLanguage(...)` when the language changes.
4. Derived hooks such as `useThemeColors()` in `src/utils/theme.ts` translate raw settings into render-ready values for the UI and feature layers.

**Feature Gameplay Flow:**

1. A screen owns route-level chrome and usually chooses the difficulty/theme context. Example: `src/screens/GameScreen.tsx` renders `GameBoard`; `src/screens/NumberPicnicScreen.tsx` renders `PicnicBasket` and `PicnicBlanket`; `src/screens/PatternTrainScreen.tsx` directly orchestrates train state and draggable choices.
2. Feature logic comes from helpers or hooks in `src/utils/`. `src/components/GameBoard.tsx` calls `generateTiles()`, `checkMatch()`, and `checkGameComplete()` from `src/utils/gameLogic.ts`; `src/screens/NumberPicnicScreen.tsx` calls `useNumberPicnicGame()` from `src/utils/numberPicnicLogic.ts`.
3. User actions update local React state inside the screen/component, trigger optional sound helpers from `src/utils/sounds.ts`, and then re-render the feature UI.
4. Success/failure feedback typically stays local to the feature screen or board and may open `AppModal`, play sounds, or schedule timers for the next round.

**Theme and Layout Resolution Flow:**

1. `useThemeColors()` in `src/utils/theme.ts` reads `settings.colorMode` from `SettingsContext` and system appearance from `useColorScheme()`.
2. It resolves a concrete mode and returns palette values from `PASTEL_COLORS` or `DARK_PASTEL_COLORS` in `src/types/index.ts`.
3. Shared UI primitives such as `src/ui/components/AppScreen.tsx`, `src/ui/components/AppHeader.tsx`, and `src/ui/components/AppButton.tsx` consume that hook directly.
4. Responsive screens such as `src/screens/HomeScreen.tsx` and `src/screens/SettingsScreen.tsx` additionally use `useLayout()` from `src/ui/useLayout.ts` to choose content widths and grid columns.

**State Management:**
- App-wide persistent state: `src/context/SettingsContext.tsx`
- App-wide transient overlay state: `src/context/ParentTimerContext.tsx`
- Route state: React Navigation stack in `App.tsx`
- Feature-local state: `useState`, `useRef`, `useEffect`, and specialized hooks such as `src/utils/numberPicnicLogic.ts` and `src/screens/usePatternTrainGame.ts`
- Static domain data: constants and types in `src/types/index.ts` plus translation JSON in `src/i18n/locales/`

## Key Abstractions

**Screen Shell Pattern:**
- Purpose: Give every route the same safe-area handling, background color, and header pattern.
- Examples: `src/screens/GameScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/BubbleScreen.tsx`, `src/screens/NumberPicnicScreen.tsx`
- Pattern: `AppScreen` + `AppHeader` + feature body. Use `AppScreen` from `src/ui/components/AppScreen.tsx` as the route container and `AppHeader` from `src/ui/components/AppHeader.tsx` for title/back behavior.

**Feature Board / Feature Object Components:**
- Purpose: Encapsulate interaction-heavy game surfaces behind focused props.
- Examples: `src/components/GameBoard.tsx`, `src/components/DrawingCanvas.tsx`, `src/components/KeepyUppyBoard.tsx`, `src/components/BubbleField.tsx`, `src/components/CategoryMatchBoard.tsx`
- Pattern: Screens pass callbacks and a few top-level settings; the component owns animation state, timers, and gesture handling internally.

**Feature-Specific Subpackages:**
- Purpose: Group multi-file feature components under one folder with a barrel export.
- Examples: `src/components/numberpicnic/`, `src/components/train/`
- Pattern: Keep internal pieces colocated and import them through `src/components/numberpicnic/index.ts` or `src/components/train/index.ts` from the consuming screen.

**Context Hooks as App Contracts:**
- Purpose: Expose the only supported path for cross-screen state access.
- Examples: `useSettings()` in `src/context/SettingsContext.tsx`, `useParentTimer()` in `src/context/ParentTimerContext.tsx`
- Pattern: Create a provider at the app root and export a hook that throws when accessed outside the provider.

**Theme Hook + Tokens:**
- Purpose: Separate semantic colors and spacing/typography tokens from component implementation.
- Examples: `src/utils/theme.ts`, `src/ui/tokens.ts`, `src/ui/components/AppButton.tsx`
- Pattern: Resolve runtime palette through `useThemeColors()`, then compose styles from semantic colors plus static token constants.

**Observability Guardrails:**
- Purpose: Contain telemetry and crash behavior without leaking into every feature.
- Examples: `src/utils/analytics.ts`, `src/utils/sentry.ts`, `src/components/GentleErrorBoundary.tsx`
- Pattern: Initialize once in `App.tsx`, wrap each stack screen in `GentleErrorBoundary`, and use navigation state changes for screen analytics instead of ad hoc tracking in screens.

## Entry Points

**Expo Root Registration:**
- Location: `index.ts`
- Triggers: Expo runtime bootstrapping the app on native or web.
- Responsibilities: Import `App` from `App.tsx` and call `registerRootComponent(App)`.

**Application Composition Root:**
- Location: `App.tsx`
- Triggers: `index.ts` registration and initial React mount.
- Responsibilities: Initialize i18n side-effect import, start Sentry/analytics, manage splash visibility, initialize/unload audio, install web-specific navigation/interaction guards, define the stack navigator, wrap screens with providers and `GentleErrorBoundary`.

**Navigation Entry Screen:**
- Location: `src/screens/HomeScreen.tsx`
- Triggers: Initial route named `Home` in the `Stack.Navigator` inside `App.tsx`.
- Responsibilities: Present available activities, apply visibility settings, choose Memory Snap difficulty, and navigate to the selected route.

**Settings Persistence Entry:**
- Location: `src/context/SettingsContext.tsx`
- Triggers: Provider mount and any `updateSettings()` call from consuming screens/components.
- Responsibilities: Load, sanitize, persist, and expose user preferences used across gameplay and UI.

**Cross-App Lock Overlay:**
- Location: `src/context/ParentTimerContext.tsx`
- Triggers: The `ParentTimerProvider` mounted in `App.tsx` and timer expiration from `settings.parentTimerMinutes`.
- Responsibilities: Count down in the background, lock the app with a modal challenge, and reset the timer after a correct answer.

## Error Handling

**Strategy:** Prefer local fallbacks and non-blocking startup failures. Core app bootstrap catches service initialization failures, while route rendering failures are isolated per screen with an error boundary.

**Patterns:**
- Startup side effects in `App.tsx` use `void someAsync().catch(...)` and continue rendering when analytics, Sentry, or splash management fails.
- `SettingsProvider` in `src/context/SettingsContext.tsx` sanitizes loaded data, removes corrupted persisted state, and falls back to in-memory defaults.
- `GentleErrorBoundary` in `src/components/GentleErrorBoundary.tsx` wraps every screen registration in `App.tsx`, reports crashes to Sentry when enabled, and navigates the user back to `Home`.
- Utility helpers such as `src/utils/theme.ts`, `src/utils/analytics.ts`, and `src/utils/sentry.ts` default to warnings and disabled behavior instead of throwing into the UI.

## Cross-Cutting Concerns

**Logging:** Lightweight console warnings and debug logs in `App.tsx`, `src/context/SettingsContext.tsx`, `src/utils/theme.ts`, `src/utils/analytics.ts`, and `src/utils/sentry.ts`. There is no dedicated logging abstraction beyond telemetry helpers.

**Validation:** Runtime sanitization happens mainly in `src/context/SettingsContext.tsx`; translation structure is typed and bootstrapped through `src/i18n/index.ts` plus `src/i18n/types.ts`; gameplay helpers rely on typed inputs from `src/types/index.ts`.

**Authentication:** Not applicable. No user account, auth provider, or permissioned backend layer is present in the app architecture.

**Navigation/State Relationships:** The stack navigator in `App.tsx` owns route transitions; `HomeScreen` selects routes; `SettingsContext` influences both what `HomeScreen` shows and how downstream screens render; `ParentTimerProvider` overlays every route without participating in navigation; `useThemeColors()` and `useTranslation()` let the same route tree re-render under different color mode and language settings.

---

*Architecture analysis: 2026-03-17*
