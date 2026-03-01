# Copilot Instructions

## Project Overview

**Gentle Games** is a sensory-friendly Expo (React Native) app for children ages 4–10. It includes six mini-games — Memory Snap (tile-matching), Drawing Pad (freehand SVG canvas), Glitter Fall (snow-globe glitter), Bubble Pop (tap floating bubbles), Category Match (drag-to-sort), and Keepy Uppy (balloon tap) — all built with calm pastels, gentle audio, and optional animations.

> **Note to the agent:** always consult the source code in the workspace first when implementing or explaining features. The instructions in this document are secondary and may lag behind the actual code.

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

Gentle Games is a React Native app built with Expo. It uses a collection of screens and reusable components, supported by utility modules for game logic, animations, and audio. Most configuration and shared constants live in a central types file, while persistent user preferences are handled by a context/provider.

**Data flow**: A single `SettingsContext` holds user preferences (sound, animations, pair count, easy mode). Screens read from it and update it; settings are stored in AsyncStorage under `'gentleMatchSettings'`.

**Navigation**: A stack navigator defines routes for home, each of the mini–games, and settings. Components navigate using `navigation.navigate` with the route name string.

**Sound**: Audio assets are initialized once and reused; volume is limited to a safe maximum.

**Timing**: Game timers typically start on the first user interaction rather than on mount.

## Key Conventions

### Colors — always use `PASTEL_COLORS`
All UI colors should come from a shared pastel color constant rather than hard‑coding values. The palette avoids high‑contrast or saturated hues to suit visually sensitive users.

```typescript
import { PASTEL_COLORS } from '../types';
// background: '#FFFEF7', primary: '#A8D8EA', secondary: '#FFB6C1', ...
```

### Named exports everywhere
All screens and components use named exports (`export const Foo: React.FC = ...`), not default exports.

### Styles at the bottom
Each file ends with a `const styles = StyleSheet.create({...})` block. Inline styles are avoided.

### SafeAreaView
Use the `SafeAreaView` component from `react-native-safe-area-context` with appropriate edge props to handle notch/sensor areas.
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
