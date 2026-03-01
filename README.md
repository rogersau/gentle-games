# Gentle Games

A collection of six calm, sensory-friendly games designed for children ages 4-10 with visual and auditory sensitivities.

## Games

### 🧩 Memory Snap
A calm memory matching game where players flip tiles to find matching pairs.

**Features:**
- **Multiple Difficulty Levels**
  - Easy: 6-10 pairs
  - Medium: 12-18 pairs  
  - Hard: 20-30 pairs

- **Three Themes**
  - Animals (bunnies, bears, cats, and more)
  - Shapes (stars, hearts, moons, and more)
  - Mixed (animal-first with a few shapes/places like houses and castles)

- **Game Features**
  - Live timer showing elapsed time
  - Move counter
  - Back button to return to menu
  - Gentle completion celebration
  - Even grid layouts for all pair counts

### 🎨 Drawing Pad
A simple drawing canvas where kids can draw, add shapes, and be creative.

**Features:**
- **Drawing Tools**
  - Pen tool for freehand drawing
  - Eraser tool to remove drawings
  - Shape tool to add geometric shapes

- **9 Preset Colors**
  - Red, teal, blue, green, yellow
  - Plum, mint, pink, gray
  - Plus 30 additional preset colors
  - Custom color picker

- **3 Shape Types**
  - Circle 🔴
  - Square 🟦
  - Triangle 🔺
  - Resizable (20px - 100px)

- **Canvas Features**
  - Undo (removes last stroke or shape)
  - Clear all
  - Theme-aware canvas background (white in light mode, soft grey in dark mode)
  - Maximum screen space utilization

### ✨ Glitter Fall
A calming snow globe where kids can sprinkle glitter and watch it drift.

**Features:**
- Add glitter with simple tap controls
- Shake device on mobile to create playful motion bursts
- Touch and swirl through the globe to move nearby glitter
- Touch-only fallback on web when motion sensors are unavailable

### 🫧 Bubble Pop
A calm tapping game where bubbles drift down from the top of the screen.

**Features:**
- Endless mode with continuous bubble spawning
- Mixed bubble sizes and gentle falling motion
- Tap to pop bubbles and track a simple pop count
- Active bubble guard that keeps at least 2 bubbles on screen

### 🗂️ Category Match
A calm sorting game where kids drag each emoji into the right category.

**Features:**
- Endless rounds with one emoji at a time
- Three friendly categories in a fixed row: Sky, Land, Ocean
- Gentle correct/try-again feedback with a running correct counter

### 🎈 Keepy Uppy
A gentle balloon-tapping game where players try to keep a balloon afloat by tapping it repeatedly.

**Features:**
- Balloons drift slowly downward and are kept aloft with taps
- Tap anywhere on the balloon to register a hit
- Easy mode toggle in settings reduces gravity for younger players
- Endless play with soft background motion and simple pop counter

## Features (All Games)

- **Sensory-Friendly Design**
  - Soft pastel color palette (no high contrast)
  - Optional gentle sound effects
  - Toggleable animations
  - No flashing lights or jarring visuals
  - Calm, non-competitive gameplay

- **Accessibility**
  - Light / Dark / System appearance modes with pastel palettes
  - Animation on/off toggle
  - Sound on/off with volume control
  - Large touch targets for small fingers
  - Clear visual feedback
  - Gentle completion celebration

- **Memory Snap Specific**
  - Matched tiles stay visible (dimmed) for progress tracking
  - Last played pair count remembered
  - Dynamic grid sizing based on screen size
- **Keepy Uppy Specific**
  - Easy mode toggle can be enabled in Settings for slower-falling balloons

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
```

For GitHub Actions, use:
- `CI` workflow for typecheck + regression tests on PRs
- `Mobile Validation` workflow (manual trigger) to validate Android/iOS bundles

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
│   ├── components/
│   │   ├── GameBoard.tsx       # Memory Snap game board
│   │   ├── Tile.tsx            # Memory tile component
│   │   ├── DrawingCanvas.tsx   # Drawing canvas with tools
│   │   ├── GlitterGlobe.tsx    # Glitter Fall particle globe
│   │   ├── BubbleField.tsx     # Bubble Pop falling bubble field
│   │   └── CategoryMatchBoard.tsx # Category Match drag/drop board
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Game selection menu
│   │   ├── GameScreen.tsx      # Memory Snap screen
│   │   ├── DrawingScreen.tsx   # Drawing Pad screen
│   │   ├── GlitterScreen.tsx   # Glitter Fall screen
│   │   ├── BubbleScreen.tsx    # Bubble Pop screen
│   │   ├── CategoryMatchScreen.tsx # Category Match screen
│   │   └── SettingsScreen.tsx  # App settings
│   ├── context/
│   │   └── SettingsContext.tsx # Global settings state
│   ├── utils/
│   │   ├── gameLogic.ts        # Memory game logic
│   │   ├── bubbleLogic.ts      # Bubble Pop spawn + movement logic
│   │   ├── glitterMotion.ts    # Shake and motion helpers
│   │   ├── categoryMatchLogic.ts # Category Match round logic
│   │   └── sounds.ts           # Audio management
│   └── types/
│       └── index.ts            # TypeScript types & data
├── App.tsx                     # Main app entry
├── app.json                    # Expo configuration
└── package.json
```

## Customization

### Adding New Animals or Shapes (Memory Snap)

Edit `src/types/index.ts` and add to `ANIMALS` or `SHAPES` arrays:

```typescript
{ emoji: '🦁', name: 'lion', color: '#F0E68C' }
```

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

- **Grid Layout**: Memory Snap automatically calculates even grid dimensions based on pair count and screen size
- **Sound Files**: Place MP3 files in `assets/sounds/` for custom sounds (flip.mp3, match.mp3, complete.mp3)
- **Canvas**: Drawing Pad uses SVG for smooth rendering and supports both strokes and shapes

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
