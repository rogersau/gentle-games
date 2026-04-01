# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```text
[project-root]/
├── assets/                    # Expo app images and PWA icon source files
├── docs/                      # Static support/privacy HTML pages
├── public/                    # Web-export public shell assets
├── scripts/                   # Build/deploy helper scripts
├── src/
│   ├── assets/                # Runtime game media such as sound files
│   ├── components/            # Feature-scale reusable game components
│   │   ├── numberpicnic/      # Number Picnic subcomponents + barrel export
│   │   └── train/             # Pattern Train subcomponents + barrel export
│   ├── context/               # Global React Context providers and hooks
│   ├── i18n/                  # i18next bootstrap, types, and locale JSON
│   ├── screens/               # Navigation routes and route-level orchestration
│   ├── test-utils/            # Test-only helpers for loop/setState detection
│   ├── types/                 # Shared app/domain types and static datasets
│   ├── ui/                    # Shared design system, layout, fonts, motion
│   │   └── components/        # Reusable presentational controls and shells
│   └── utils/                 # Domain logic, runtime services, and hooks
├── .github/workflows/         # CI/CD workflows
├── App.tsx                    # Main app composition root and navigator
├── index.ts                   # Expo root registration entry point
├── app.config.js              # Expo configuration and runtime extras
├── metro.config.js            # Metro bundler overrides
├── jest.config.js             # Jest configuration
├── tsconfig.json              # TypeScript configuration
└── staticwebapp.config.json   # Azure Static Web Apps web routing config
```

## Directory Purposes

**`src/screens/`:**

- Purpose: Hold one file per navigable route plus route-scoped hooks.
- Contains: Route components such as `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/GameScreen.tsx`, `src/screens/PatternTrainScreen.tsx`, and helper hook `src/screens/usePatternTrainGame.ts`.
- Key files: `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/NumberPicnicScreen.tsx`, `src/screens/PatternTrainScreen.tsx`

**`src/components/`:**

- Purpose: Hold reusable feature widgets that sit below a screen and above basic UI controls.
- Contains: Boards, canvases, error boundary, and feature folders such as `src/components/numberpicnic/` and `src/components/train/`.
- Key files: `src/components/GameBoard.tsx`, `src/components/DrawingCanvas.tsx`, `src/components/KeepyUppyBoard.tsx`, `src/components/GentleErrorBoundary.tsx`

**`src/components/numberpicnic/`:**

- Purpose: Keep the Number Picnic feature internals colocated.
- Contains: `PicnicBlanket`, `PicnicBasket`, `PicnicItem`, tests, and the barrel `src/components/numberpicnic/index.ts`.
- Key files: `src/components/numberpicnic/PicnicBlanket.tsx`, `src/components/numberpicnic/PicnicBasket.tsx`, `src/components/numberpicnic/index.ts`

**`src/components/train/`:**

- Purpose: Keep Pattern Train visual primitives colocated.
- Contains: `TrainEngine`, `Carriage`, `TrainTrack`, tests, and the barrel `src/components/train/index.ts`.
- Key files: `src/components/train/TrainEngine.tsx`, `src/components/train/Carriage.tsx`, `src/components/train/index.ts`

**`src/context/`:**

- Purpose: Store cross-route React Context providers and hooks.
- Contains: `src/context/SettingsContext.tsx` for persisted preferences and `src/context/ParentTimerContext.tsx` for the app-wide lock timer overlay.
- Key files: `src/context/SettingsContext.tsx`, `src/context/ParentTimerContext.tsx`

**`src/utils/`:**

- Purpose: Hold non-UI helpers, feature hooks, runtime services, and pure logic modules.
- Contains: Gameplay logic such as `src/utils/gameLogic.ts`, `src/utils/patternTrainLogic.ts`, `src/utils/categoryMatchLogic.ts`; app services such as `src/utils/analytics.ts`, `src/utils/sentry.ts`, `src/utils/sounds.ts`; runtime hooks such as `src/utils/theme.ts`.
- Key files: `src/utils/theme.ts`, `src/utils/gameLogic.ts`, `src/utils/numberPicnicLogic.ts`, `src/utils/analytics.ts`, `src/utils/sentry.ts`

**`src/ui/`:**

- Purpose: Provide the shared design system and responsive layout layer.
- Contains: `src/ui/components/` presentational primitives, `src/ui/tokens.ts` design tokens, `src/ui/fonts.ts` font loading helpers, `src/ui/animations.ts`, and `src/ui/useLayout.ts`.
- Key files: `src/ui/components/index.ts`, `src/ui/tokens.ts`, `src/ui/useLayout.ts`, `src/ui/fonts.ts`

**`src/ui/components/`:**

- Purpose: Provide generic UI building blocks reused across screens and components.
- Contains: `AppScreen`, `AppHeader`, `AppButton`, `AppCard`, `AppModal`, settings controls, and barrel export `src/ui/components/index.ts`.
- Key files: `src/ui/components/AppScreen.tsx`, `src/ui/components/AppHeader.tsx`, `src/ui/components/AppButton.tsx`, `src/ui/components/index.ts`

**`src/types/`:**

- Purpose: Centralize shared TypeScript types plus app-wide static content.
- Contains: `src/types/index.ts` with settings, palettes, datasets, and game model types; `src/types/i18n.ts` with language metadata.
- Key files: `src/types/index.ts`, `src/types/i18n.ts`

**`src/i18n/`:**

- Purpose: Centralize translation bootstrapping and locale resources.
- Contains: i18next initialization in `src/i18n/index.ts`, locale JSON under `src/i18n/locales/`, and TypeScript support files such as `src/i18n/types.ts` and `src/i18n/i18next.d.ts`.
- Key files: `src/i18n/index.ts`, `src/i18n/locales/en-AU.json`, `src/i18n/locales/en-US.json`

**`src/test-utils/`:**

- Purpose: Hold helper utilities used to detect React update issues in tests.
- Contains: `src/test-utils/infiniteLoopDetection.ts`, `src/test-utils/setStateDetection.ts`
- Key files: `src/test-utils/infiniteLoopDetection.ts`, `src/test-utils/setStateDetection.ts`

**`scripts/`:**

- Purpose: Hold Node-based build and release helpers outside the runtime app bundle.
- Contains: `scripts/prepare-pwa.js`, `scripts/upload-sourcemaps.js`, test coverage for scripts in `scripts/prepare-pwa.test.js`
- Key files: `scripts/prepare-pwa.js`, `scripts/upload-sourcemaps.js`

**`docs/`:**

- Purpose: Store static website/support documents separate from the Expo runtime.
- Contains: `docs/index.html`, `docs/privacy-policy.html`, `docs/support.html`
- Key files: `docs/index.html`, `docs/privacy-policy.html`, `docs/support.html`

## Key File Locations

**Entry Points:**

- `index.ts`: Expo registration entry point that mounts `App.tsx`
- `App.tsx`: Application composition root, provider wiring, service initialization, and stack navigator
- `src/screens/HomeScreen.tsx`: Initial route and menu for all game screens

**Configuration:**

- `app.config.js`: Expo app metadata, native/web config, and runtime `extra` values for Sentry/PostHog
- `package.json`: Scripts, dependencies, and project metadata
- `metro.config.js`: Metro bundler source-map behavior
- `jest.config.js`: Test runner config
- `tsconfig.json`: TypeScript strict mode and included paths
- `staticwebapp.config.json`: Web hosting routing behavior for Azure Static Web Apps

**Core Logic:**

- `src/context/SettingsContext.tsx`: Persistent user preferences contract
- `src/context/ParentTimerContext.tsx`: Cross-app parent timer/lock overlay
- `src/utils/theme.ts`: Theme resolution from settings + system state
- `src/utils/gameLogic.ts`: Memory Snap tile generation and matching rules
- `src/utils/numberPicnicLogic.ts`: Number Picnic gameplay hook
- `src/utils/patternTrainLogic.ts`: Pattern Train sequence generation and answer helpers

**Testing:**

- `App.test.tsx`: App-level behavior test
- `src/screens/*.test.tsx`: Screen-level tests colocated with screens
- `src/components/**/*.test.tsx`: Component-level tests colocated with components
- `src/utils/*.test.ts`: Logic/service tests colocated with utilities
- `src/test-utils/`: Shared testing helpers

## Naming Conventions

**Files:**

- Route components use PascalCase + `Screen`: `src/screens/HomeScreen.tsx`, `src/screens/BubbleScreen.tsx`
- Reusable components use PascalCase nouns: `src/components/GameBoard.tsx`, `src/ui/components/AppModal.tsx`
- Context files use PascalCase + `Context`: `src/context/SettingsContext.tsx`
- Logic/helpers use lower camel or descriptive nouns in `src/utils/`: `src/utils/gameLogic.ts`, `src/utils/pwaBackGuard.ts`, `src/utils/numberPicnicLogic.ts`
- Tests are colocated and mirror the source filename with `.test.ts` or `.test.tsx`: `src/components/GameBoard.test.tsx`, `src/utils/theme.test.ts`
- Barrel exports use `index.ts`: `src/ui/components/index.ts`, `src/components/train/index.ts`, `src/components/numberpicnic/index.ts`

**Directories:**

- Top-level runtime code is grouped by responsibility, not by route: `src/screens/`, `src/components/`, `src/context/`, `src/utils/`, `src/ui/`, `src/types/`
- Multi-file features get their own lowercase subdirectory under `src/components/`: `src/components/numberpicnic/`, `src/components/train/`
- Static non-runtime site content stays outside `src/` in `docs/` and `public/`

## Where to Add New Code

**New Feature:**

- Primary code: add a route component under `src/screens/` if the feature is navigable, then register it in the stack inside `App.tsx`
- Tests: colocate route tests beside the screen as `src/screens/NewFeatureScreen.test.tsx`; colocate logic tests beside any new helper in `src/utils/`

**New Component/Module:**

- Implementation: put generic reusable controls in `src/ui/components/`; put feature-specific interactive widgets in `src/components/`
- Feature family: if the feature needs several closely related components, create a subfolder like `src/components/newfeature/` with an `index.ts` barrel

**Utilities:**

- Shared helpers: put gameplay rules, sensors, service clients, or non-visual hooks in `src/utils/`
- Shared types/constants: add app-wide contracts and static datasets to `src/types/`
- Cross-app state: only add new global providers under `src/context/` when the state truly spans many routes

## Special Directories

**`src/i18n/locales/`:**

- Purpose: Store translation JSON files consumed by `src/i18n/index.ts`
- Generated: No
- Committed: Yes

**`src/test-utils/`:**

- Purpose: Store reusable helpers for detecting render/update issues in tests
- Generated: No
- Committed: Yes

**`.github/workflows/`:**

- Purpose: Store CI, deployment, and mobile validation workflows such as `ci.yml`, `azure-prod-deploy.yml`, and `mobile-validation.yml`
- Generated: No
- Committed: Yes

**`public/`:**

- Purpose: Store static assets and HTML shell material used by web export hosting
- Generated: No
- Committed: Yes

**`dist/`:**

- Purpose: Build output target referenced by scripts in `package.json`
- Generated: Yes
- Committed: No

**`.planning/codebase/`:**

- Purpose: Store generated codebase mapping documents for planning/execution tools
- Generated: Yes
- Committed: Yes

---

_Structure analysis: 2026-03-17_
