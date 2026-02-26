# Copilot Instructions

## Project Overview

**Gentle Games** is a sensory-friendly Expo (React Native) app for children ages 4–10. It contains two games: Memory Snap (tile-matching) and Drawing Pad (freehand SVG canvas). The design philosophy is calm, pastel, non-competitive, and accessibility-first.

## Commands

```bash
npm start          # Start Expo dev server
npm run web        # Start in web browser
npm run android    # Start on Android
npm run ios        # Start on iOS

npx expo export --platform web   # Build for web
eas build --platform ios         # Build for iOS (requires EAS)
eas build --platform android     # Build for Android (requires EAS)
```

There are no test or lint scripts configured.

## Architecture

```
App.tsx                          # Entry: NavigationContainer + SettingsProvider + sound init
src/
  types/index.ts                 # All TypeScript types AND shared data constants
  context/SettingsContext.tsx    # Global settings state (React Context + AsyncStorage)
  utils/
    gameLogic.ts                 # Pure functions: tile generation, match checking, grid config
    sounds.ts                    # Module-level sound state; initialized once in App.tsx
  screens/                       # Screen components; consume useSettings() + useNavigation()
  components/                    # Game components; GameBoard owns all Memory Snap state
```

**Data flow**: `SettingsContext` is the single source of truth for user preferences. Screens read `settings` and call `updateSettings()` which persists to AsyncStorage under the key `'gentleMatchSettings'`.

**Navigation**: Stack navigator with four routes — `Home`, `Game`, `Settings`, `Drawing`. Screens navigate with `navigation.navigate('RouteName' as never)`.

**Sound**: Sounds are loaded once at app start (`initializeSounds`) and reused via `setPositionAsync(0)` before each play. Volume is capped at 50% internally; the user-facing slider maps 100% → 50% actual volume.

**Memory Snap timer**: Starts on the player's first tile flip, not on screen mount.

## Key Conventions

### Colors — always use `PASTEL_COLORS`
All UI colors should come from the `PASTEL_COLORS` constant in `src/types/index.ts`. Do not introduce high-contrast or saturated colors; the app targets children with visual sensitivities.

```typescript
import { PASTEL_COLORS } from '../types';
// background: '#FFFEF7', primary: '#A8D8EA', secondary: '#FFB6C1', ...
```

### Named exports everywhere
All screens and components use named exports (`export const Foo: React.FC = ...`), not default exports.

### Styles at the bottom
Each file ends with a `const styles = StyleSheet.create({...})` block. Inline styles are avoided.

### SafeAreaView
Always import from `react-native-safe-area-context` (not `react-native`) and pass the `edges` prop:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView style={...} edges={['top', 'bottom']}>
```

### Settings sanitization
When handling persisted settings, always go through `sanitizeSettings()` in `SettingsContext.tsx` to guard against corrupted AsyncStorage values. Adding a new setting field requires updating `sanitizeSettings`, `defaultSettings`, and the `Settings` interface in `src/types/index.ts`.

### TypeScript strict mode
`tsconfig.json` enables `"strict": true` (extends `expo/tsconfig.base`).

## Extending the App

**Add animals or shapes** (Memory Snap tile pool): append to `ANIMALS` or `SHAPES` arrays in `src/types/index.ts`:
```typescript
{ emoji: '🦁', name: 'lion', color: '#F0E68C' }
```

**Add a new game**:
1. Create `src/screens/MyGameScreen.tsx`
2. Add an entry to the `GAMES` array in `src/screens/HomeScreen.tsx`
3. Add the route to the `Stack.Navigator` in `App.tsx`

**Add sound effects**: Place MP3 files as `src/assets/sounds/{name}.mp3` and register them in `soundAssets` in `src/utils/sounds.ts`.
