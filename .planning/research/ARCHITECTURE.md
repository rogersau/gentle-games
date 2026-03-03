# Architecture Research: Sensory-Friendly Kids Apps

**Analysis Date:** 2026-03-03

## Current Architecture

### Components
- **Screens** — Full-page game views (`src/screens/`)
- **Game Boards** — Game logic and interaction (`src/components/`)
- **UI Components** — Design system (`src/ui/components/`)
- **Contexts** — Global state (Settings, Parent Timer)
- **Utils** — Game logic, helpers

### Data Flow
```
App.tsx → Navigation → Screen → Components → Utils
                ↓
         SettingsContext (global state)
```

### Entry Points
- `App.tsx` — Bootstrap, navigation, providers
- Each screen is independently accessible

## Recommended Structure for Growth

### For Educational Games (Numbers, Letters)

```
src/
├── screens/
│   ├── NumberPicnicScreen.tsx    # Numbers game
│   └── LetterLanternScreen.tsx   # Letters game
├── components/
│   ├── numberGame/               # Number game components
│   └── letterGame/               # Letter game components
└── utils/
    ├── numberGameLogic.ts        # Number game logic
    └── letterGameLogic.ts        # Letter game logic
```

### Build Order

1. **Phase 1:** Complete unfinished games (NumberPicnic, LetterLantern, StarPath)
2. **Phase 2:** Enhance accessibility controls
3. **Phase 3:** Parent features (dashboard, timer improvements)
4. **Phase 4:** Additional content (if needed)

### Component Boundaries

- **Screens:** Handle navigation, screen-level state
- **Components:** Handle interaction, rendering
- **Utils:** Pure game logic, testable
- **Contexts:** Cross-cutting concerns only

## Key Patterns

- Co-located tests (`*.test.ts` next to `*.ts`)
- Design tokens in `src/ui/tokens.ts`
- Translations via i18next hook
- Settings persisted in AsyncStorage

---
*Research: 2026-03-03*
