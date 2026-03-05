# Gentle Games

A calm, sensory-friendly mobile application designed for children with sensory sensitivities, particularly those with autism spectrum disorder (ASD). Built with accessibility and inclusion at its core.

## Mission

To provide a safe, predictable, and stress-free digital space where children can play, create, and explore at their own pace. Every interaction is designed with sensory needs in mind—no ads, no time pressure, no overwhelming stimuli, and no hidden paywalls.

## Core Principles

- **Sensory-Friendly**: Soft color palettes, optional audio, smooth animations, and zero flashing lights or jarring visuals
- **Predictable & Calm**: Consistent UI patterns, clear navigation, and gameplay that never rushes the player
- **Fully Accessible**: Light/dark mode support, animation toggles, sound controls, large touch targets, and internationalization-ready design
- **Offline-First**: Works without an internet connection so play is always available
- **Truly Free**: No ads, no in-app purchases, no subscriptions—just gentle games

## What You'll Find

The app offers a collection of calm, creative activities including memory games, creative drawing tools, sensory experiences, and simple interactive toys. Each activity is designed to be:

- Non-competitive and pressure-free
- Adjustable to individual comfort levels
- Immediately accessible without tutorials or gates
- Safe for independent play

## Who It's For

- Children ages 4-10 with sensory processing differences
- Parents and caregivers seeking calm, appropriate screen time
- Therapists and educators supporting neurodivergent children
- Anyone who benefits from gentle, predictable digital experiences

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Audio**: Expo Audio
- **Motion Sensors**: Expo Sensors (Accelerometer)
- **Storage**: AsyncStorage
- **Graphics**: React Native SVG
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd gentle-games
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   npm run web  # For web browser
   ```

5. Press:
   - `i` to open iOS Simulator
   - `a` to open Android Emulator
   - Scan QR code with Expo Go app on physical device
   - `w` to open in web browser

## Testing and Quality Checks

```bash
# Full local CI pass (shared + cross-platform export checks)
npm run ci:all

# Shared checks used in PR CI gate
npm run ci:shared

# Cross-platform export validation (web + android + ios)
npm run ci:platform

# TypeScript regression check
npm run typecheck

# Run all tests
npm test

# CI-mode test run
npm run test:ci

# Watch mode during development
npm run test:watch

# Run one test file
npm run test:single -- src/utils/gameLogic.test.ts
```

## Android and iOS Validation

```bash
# Launch app on emulator/simulator from Expo
npm run android
npm run ios

# CI-friendly bundle validation for each platform
npm run validate:android
npm run validate:ios

# Android runtime smoke test pieces (requires emulator + Maestro CLI)
npm run smoke:android:build
npm run smoke:android:install
npm run smoke:android:test
```

For GitHub Actions, use:
- `CI` workflow on pull requests/pushes for:
  - shared checks (`npm run ci:shared`)
  - platform export validation (web, android, ios)
  - Android emulator smoke test via Maestro
- `Mobile Validation` workflow (manual trigger) for on-demand Android/iOS export checks

## Building for Production

### Web

```bash
# Export for web deployment
npx expo export --platform web

# Or serve locally
npx expo start --web
```

## PWA Publish (GitHub Actions)

This repo includes a workflow at [.github/workflows/pwa-deploy.yml](.github/workflows/pwa-deploy.yml) that builds and deploys the Expo web export to GitHub Pages.

### One-time GitHub setup

1. Go to **Settings → Pages** in your GitHub repo.
2. Set **Source** to **GitHub Actions**.
3. Push to `master` (or run the workflow manually from the **Actions** tab).

### Workflow behavior

- Installs dependencies with `npm ci`
- Runs `npm run build:pwa` (exports web + prepares PWA assets)
- Uses `expo.experiments.baseUrl` (`/gentle-games`) so assets resolve on GitHub Pages
- Generates:
  - `dist/manifest.webmanifest`
  - `dist/sw.js`
  - `dist/icons/*`
- Adds cache-busted manifest/service-worker URLs per deploy while keeping an offline app-shell fallback
- Publishes `dist` to GitHub Pages

### Local PWA build

```bash
npm run build:pwa
```

### PWA placeholder icons (replace these)

The workflow and app config use files in `assets/pwa/`:

- `assets/pwa/icon-32x32.png` (favicon)
- `assets/pwa/icon-180x180.png` (apple touch icon)
- `assets/pwa/icon-192x192.png`
- `assets/pwa/icon-384x384.png`
- `assets/pwa/icon-512x512.png`
- `assets/pwa/icon-192x192-maskable.png`
- `assets/pwa/icon-512x512-maskable.png`

Replace these files with your final brand assets using the same file names.

### iOS

```bash
# Build for App Store
expo build:ios

# Or use EAS Build
eas build --platform ios
```

### Android

```bash
# Build for Play Store
expo build:android

# Or use EAS Build
eas build --platform android
```

## Project Structure

```
gentle-games/
├── src/
│   ├── components/        # Reusable game components
│   ├── screens/           # Screen components
│   ├── context/           # Global state (settings, etc.)
│   ├── utils/             # Game logic and helpers
│   └── types/             # TypeScript definitions
├── App.tsx                # Main app entry
├── app.json               # Expo configuration
└── package.json
```

## Customization

### Changing Colors

Edit color constants in `src/types/index.ts`:

```typescript
export const PASTEL_COLORS = {
  background: '#FFFEF7',
  // ... other colors
};
```

### Adding New Games

1. Create a new screen component in `src/screens/`
2. Add the game to the `GAMES` array in `src/screens/HomeScreen.tsx`
3. Add the route to navigation in `App.tsx`

## Development Tips

- All text must go through the translation function for internationalization
- Use soft pastel colors—avoid high contrast and bright colors
- Keep interactions predictable and feedback gentle
- Test with animation and sound toggled off
- Support both light and dark mode

## License

This project is free and open source, released under the
[GNU General Public License v3 (GPLv3)](LICENSE).

You are free to use, modify, and distribute this software under the terms of
that license. See the [LICENSE](LICENSE) file for the full text.

## Website & App Store Pages

The GitHub Pages docs site for this project lives in the [`docs/`](docs/) folder
and is published at **https://rogersau.github.io/gentle-games/docs/**. It includes:

- [Home page](https://rogersau.github.io/gentle-games/docs/)
- [Privacy Policy](https://rogersau.github.io/gentle-games/docs/privacy-policy.html)
- [Support](https://rogersau.github.io/gentle-games/docs/support.html)

> **Note:** To enable GitHub Pages for this repository, go to
> **Settings → Pages**, set **Source** to **GitHub Actions**.

## Support

For issues or questions:
- Open an issue on the [GitHub issue tracker](https://github.com/rogersau/gentle-games/issues)
- Visit the [Support page](https://rogersau.github.io/gentle-games/docs/support.html)
- Check the [Expo documentation](https://docs.expo.dev)
- Visit [React Native community resources](https://reactnative.dev/help)

---

Made with 💜 for calm, sensory-friendly gaming
