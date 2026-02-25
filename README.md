# Gentle Games

A collection of calm, sensory-friendly games designed for children ages 4-10 with visual and auditory sensitivities.

## Games

### Memory Snap
A calm memory matching game where players flip tiles to find matching pairs.

- **Multiple Difficulty Levels**
  - Easy: 6-10 pairs
  - Medium: 12-18 pairs  
  - Hard: 20-30 pairs

- **Three Themes**
  - Animals (bunnies, bears, cats, and more)
  - Shapes (stars, hearts, moons, and more)
  - Mixed (combination of both)

## Features (All Games)

- **Sensory-Friendly Design**
  - Soft pastel color palette (no high contrast)
  - Optional gentle sound effects
  - Toggleable animations
  - No flashing lights or jarring visuals

- **Accessibility**
  - Animation on/off toggle
  - Sound on/off with volume control
  - Matched tiles stay visible (dimmed) for progress tracking
  - Gentle completion celebration

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Audio**: Expo AV
- **Storage**: AsyncStorage

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
   ```

5. Press:
   - `i` to open iOS Simulator
   - `a` to open Android Emulator
   - Scan QR code with Expo Go app on physical device

## Building for Production

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
│   │   ├── GameBoard.tsx    # Main game logic and board
│   │   └── Tile.tsx         # Individual tile component
│   ├── screens/
│   │   ├── HomeScreen.tsx   # Main menu
│   │   ├── GameScreen.tsx   # Game play screen
│   │   └── SettingsScreen.tsx # Settings configuration
│   ├── context/
│   │   └── SettingsContext.tsx # App settings state
│   ├── utils/
│   │   ├── gameLogic.ts     # Game logic utilities
│   │   └── sounds.ts        # Audio handling
│   └── types/
│       └── index.ts         # TypeScript types
├── App.tsx                  # Main app entry
├── app.json                 # Expo configuration
└── package.json
```

## Customization

### Adding New Animals or Shapes

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

## License

This project is completely free and open source.

## Support

For issues or questions, please check the Expo documentation or React Native community resources.
