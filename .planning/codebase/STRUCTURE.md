# Codebase Structure

**Analysis Date:** 2026-03-03

## Directory Layout

```
gentle-match/
├── App.tsx                    # Main app entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Test configuration
├── staticwebapp.config.json   # Azure Static Web Apps config
├── app.json                   # Expo configuration
├── app.azure.json             # Azure deployment config
├── AGENTS.md                  # Agent instructions
├── .vscode/settings.json      # VS Code settings
├── src/
│   ├── assets/                # Static assets
│   │   └── sounds/             # Audio files
│   │       └── music/         # Background music tracks
│   ├── components/            # Game-specific components
│   │   └── train/              # Train game components
│   ├── context/               # React contexts
│   ├── i18n/                  # Internationalization
│   │   ├── locales/           # Translation files
│   │   ├── index.ts           # i18n setup
│   │   ├── types.ts           # Translation key types
│   │   └── i18next.d.ts       # Type declarations
│   ├── screens/               # Screen components
│   ├── types/                 # TypeScript types
│   ├── ui/                    # Design system
│   │   ├── components/        # Reusable UI components
│   │   ├── animations.ts      # Animation definitions
│   │   ├── fonts.ts           # Font loading
│   │   ├── tokens.ts          # Design tokens
│   │   └── useLayout.ts       # Layout hooks
│   └── utils/                 # Utility functions
└── .planning/codebase/        # Generated documentation
```

## Directory Purposes

### `src/screens/`:
- Purpose: Full-screen page components
- Contains: 13 screen components
- Key files:
  - `HomeScreen.tsx` - Main menu with game selection grid
  - `GameScreen.tsx` - Memory Snap game
  - `SettingsScreen.tsx` - App settings
  - `BubbleScreen.tsx` - Bubble pop game
  - `DrawingScreen.tsx` - Drawing canvas
  - `GlitterScreen.tsx` - Glitter globe game
  - `KeepyUppyScreen.tsx` - Balloon keepy-uppy game
  - `BreathingGardenScreen.tsx` - Breathing exercise
  - `PatternTrainScreen.tsx` - Pattern recognition
  - `CategoryMatchScreen.tsx` - Category matching
  - `NumberPicnicScreen.tsx` - Number learning (unfinished)
  - `LetterLanternScreen.tsx` - Letter learning (unfinished)
  - `StarPathScreen.tsx` - Star collection (unfinished)

### `src/components/`:
- Purpose: Game-specific interactive components
- Contains: Game boards, tiles, game elements
- Key files:
  - `GameBoard.tsx` - Memory Snap board logic
  - `Tile.tsx` - Flip card component
  - `BubbleField.tsx` - Bubble popping area
  - `BreathingBall.tsx` - Animated breathing circle
  - `GlitterGlobe.tsx` - Glitter particle container
  - `KeepyUppyBoard.tsx` - Balloon physics area
  - `CategoryMatchBoard.tsx` - Category matching board
  - `DrawingCanvas.tsx` - Touch drawing canvas

### `src/components/train/`:
- Purpose: Pattern Train game components
- Contains: `TrainEngine.tsx`, `TrainTrack.tsx`, `Carriage.tsx`

### `src/ui/components/`:
- Purpose: Core reusable UI primitives (design system)
- Contains: 12 UI components
- Key files:
  - `AppScreen.tsx` - Base screen wrapper
  - `AppHeader.tsx` - Navigation header
  - `AppButton.tsx` - Primary button component
  - `AppCard.tsx` - Card container
  - `AppModal.tsx` - Modal dialog
  - `GameCard.tsx` - Game selection card
  - `SettingToggle.tsx` - Toggle switch
  - `SegmentedControl.tsx` - Segmented picker
  - `VolumeControl.tsx` - Volume slider
  - `SelectBox.tsx` - Dropdown selector

### `src/ui/`:
- Purpose: Design system infrastructure
- Files:
  - `tokens.ts` - Spacing, typography, shadows, breakpoints
  - `fonts.ts` - Nunito font loading hook
  - `animations.ts` - Reusable animation configs
  - `useLayout.ts` - Responsive layout hook

### `src/context/`:
- Purpose: Global React contexts
- Files:
  - `SettingsContext.tsx` - App settings (persisted)
  - `ParentTimerContext.tsx` - Parent timer feature

### `src/utils/`:
- Purpose: Game logic and helpers
- Pattern: One logic file per game with matching test file
- Key files:
  - `gameLogic.ts` - Memory Snap logic
  - `bubbleLogic.ts` - Bubble game logic
  - `glitterMotion.ts` - Glitter physics
  - `keepyUppyLogic.ts` - Balloon physics
  - `breathingGardenLogic.ts` - Breathing exercise
  - `patternTrainLogic.ts` - Pattern recognition
  - `categoryMatchLogic.ts` - Category matching
  - `theme.ts` - Theme resolution hook
  - `sounds.ts` - Audio playback
  - `music.ts` - Background music
  - `pwaBackGuard.ts` - PWA navigation guard

### `src/types/`:
- Purpose: TypeScript type definitions
- Files:
  - `index.ts` - Core types, interfaces, color constants
  - `i18n.ts` - Language type definitions

### `src/i18n/`:
- Purpose: Internationalization setup
- Files:
  - `index.ts` - i18next configuration
  - `types.ts` - Translation key types
- Locales:
  - `locales/en-AU.json` - Australian English
  - `locales/en-US.json` - US English

### `src/assets/`:
- Purpose: Static resources
- Contains:
  - `sounds/music/track1-4.mp3` - Background music
  - `sounds/pop.mp3` - Bubble pop sound
  - `sounds/match.mp3` - Match sound

## Key File Locations

**Entry Points:**
- `App.tsx` - Main app bootstrap, navigation setup

**Configuration:**
- `package.json` - Dependencies, scripts
- `tsconfig.json` - TypeScript config
- `jest.config.js` - Test runner config
- `app.json` - Expo config

**Core Logic:**
- `src/utils/gameLogic.ts` - Memory Snap tile generation, matching
- `src/utils/theme.ts` - Theme resolution
- `src/context/SettingsContext.tsx` - Settings management

**Testing:**
- Test files co-located with source: `*.test.ts`, `*.test.tsx`

## Naming Conventions

**Files:**
- Screens: `*Screen.tsx` (e.g., `HomeScreen.tsx`)
- Components: PascalCase (e.g., `GameBoard.tsx`)
- Utils: camelCase with descriptive names (e.g., `gameLogic.ts`)
- Tests: Original name + `.test` suffix (e.g., `gameLogic.test.ts`)
- Index files: `index.ts` for barrel exports

**Directories:**
- PascalCase for components: `src/components/train/`
- camelCase for utilities: `src/utils/`
- Plural for collections: `src/screens/`, `src/components/`

**Types:**
- Interfaces: PascalCase (e.g., `Tile`, `Settings`)
- Type aliases: PascalCase (e.g., `Difficulty`, `ColorMode`)
- Enums: PascalCase with PascalCase values

## Where to Add New Code

**New Game Feature:**
1. Screen: `src/screens/GameNameScreen.tsx`
2. Board/Components: `src/components/GameNameBoard.tsx`
3. Logic: `src/utils/gameNameLogic.ts`
4. Tests: `src/screens/GameNameScreen.test.tsx`, `src/utils/gameNameLogic.test.ts`
5. Translations: Add keys to `src/i18n/locales/en-AU.json`

**New UI Component:**
1. Implementation: `src/ui/components/NewComponent.tsx`
2. Export: Add to `src/ui/components/index.ts`
3. Tests: `src/ui/components/NewComponent.test.tsx`

**New Utility:**
1. Implementation: `src/utils/utilityName.ts`
2. Tests: `src/utils/utilityName.test.ts`

**New Context:**
1. Implementation: `src/context/NewContext.tsx`
2. Provider setup in `App.tsx`

**New Translation:**
1. Add key to `src/i18n/types.ts`
2. Add translations to `src/i18n/locales/en-AU.json`
3. Use via `t('key.path')` hook

## Special Directories

**`.vscode/`:**
- Purpose: Editor configuration
- Contains: VS Code settings

**`.planning/codebase/`:**
- Purpose: Generated documentation
- Contains: Architecture and structure docs

---

*Structure analysis: 2026-03-03*
