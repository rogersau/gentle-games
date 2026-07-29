# Gentle Games

A free, open-source collection of adjustable, pressure-free games for children. Sound, motion, visual presentation, and game-specific controls can be changed to suit the player.

## Mission

To provide predictable activities where children can play, create, practise an in-game rule, or stop at their own pace. There are no ads, hidden paywalls, required scores, or forced timers.

Gentle Games is not therapy, medical care, diagnosis, or a promise of educational or developmental improvement. Sensory preferences differ between children, so caregivers should use the available controls and the child's own communication to decide what is comfortable.

## Core Principles

- **Adjustable Presentation**: Soft color palettes, optional audio, reduced-motion controls, and no flashing effects
- **Predictable Navigation**: Consistent UI patterns, clear controls, and gameplay that never rushes the player
- **Fully Accessible**: Light/dark mode support, animation toggles, sound controls, large touch targets, and internationalization-ready design
- **Offline-First**: Works without an internet connection so play is always available
- **Truly Free**: No ads, no in-app purchases, no subscriptions—just gentle games

## What You'll Find

The catalogue distinguishes sensory/regulation activities, creative play, and guided practice. Sensory and creative activities do not assign a correct performance outcome. Guided activities state the current in-game rule and use optional hints or models.

- Non-competitive and pressure-free
- Adjustable to individual comfort levels
- Available without paid or progression gates
- Easy to pause, stop, skip where relevant, or leave

## Released Game Catalogue

- **Memory Snap - guided practice**: Remember and find matching pictures on the current board.
- **Drawing Pad - creative play**: Make free-form marks or choose an optional structured drawing mode; there is no creative score.
- **Glitter Fall - sensory/regulation activity**: Add, move, and clear visual particles with adjustable motion and sound.
- **Bubble Pop - sensory/regulation activity**: Explore cause and effect in free play or choose an optional exact-count activity.
- **Category Match - guided practice**: Sort an item using the stated Food, Toys, or Clothes rule.
- **Keepy Uppy - sensory/regulation activity**: Track a balloon and choose when and how to lift it.
- **Breathing Garden - sensory/regulation activity**: Use, watch, pause, or leave an optional visual pacing rhythm; there is no breathing requirement.
- **Pattern Train - guided practice**: Recognise and continue the current repeating rule.

Number Picnic remains an unfinished preview and is hidden from the released catalogue until its child-centred validation gate is completed.

## Who It's For

- Children ages 4-10 with sensory processing differences
- Parents and caregivers seeking adjustable, pressure-free activities
- Educators or practitioners reviewing accessible interaction design, without treating the app as therapy
- Anyone who prefers predictable digital experiences

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
2. Define its mode, exact immediate target, claim boundaries, and accessibility assumptions in `src/games/outcomes.ts`
3. Add it to `GAME_REGISTRY` in `src/games/registry.ts`
4. Add its typed route in `src/types/navigation.ts` and register the screen in `App.tsx`
5. Add translated copy and update the public catalogue only when the game is released
6. Complete the relevant checks in `docs/validation/`

### Claims And Data Checklist

- State only the immediate in-game experience or target supported by the implementation.
- Do not call a game therapy, treatment, diagnosis, or evidence of developmental improvement.
- Do not describe sensory or creative play through scores, correctness, compliance, or guaranteed comfort.
- Keep guided feedback neutral and do not claim automatic transfer beyond the current in-game example.
- Explain pressure-free defaults, stop/leave controls, and optional caregiver settings where relevant.
- Never send guided answers, attempts, support classifications, scores, or session duration to remote analytics or crash reporting.
- Keep registry, translations, website, privacy policy, and store metadata consistent.
- Identify the evidence and scope for any new outcome claim in the pull request.

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

Made for adjustable, pressure-free play
