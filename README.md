# Gentle Games

A collection of calm, sensory-friendly games designed for children ages 4-10 with visual and auditory sensitivities.

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
  - Mixed (combination of both)

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
  - White background
  - Maximum screen space utilization

## Features (All Games)

- **Sensory-Friendly Design**
  - Soft pastel color palette (no high contrast)
  - Optional gentle sound effects
  - Toggleable animations
  - No flashing lights or jarring visuals
  - Calm, non-competitive gameplay

- **Accessibility**
  - Animation on/off toggle
  - Sound on/off with volume control
  - Large touch targets for small fingers
  - Clear visual feedback
  - Gentle completion celebration

- **Memory Snap Specific**
  - Matched tiles stay visible (dimmed) for progress tracking
  - Last played pair count remembered
  - Dynamic grid sizing based on screen size

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Audio**: Expo AV
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

## Building for Production

### Web

```bash
# Export for web deployment
npx expo export --platform web

# Or serve locally
npx expo start --web
```

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
│   │   └── DrawingCanvas.tsx   # Drawing canvas with tools
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Game selection menu
│   │   ├── GameScreen.tsx      # Memory Snap screen
│   │   ├── DrawingScreen.tsx   # Drawing Pad screen
│   │   └── SettingsScreen.tsx  # App settings
│   ├── context/
│   │   └── SettingsContext.tsx # Global settings state
│   ├── utils/
│   │   ├── gameLogic.ts        # Memory game logic
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

This project is completely free and open source.

## Support

For issues or questions:
- Check the [Expo documentation](https://docs.expo.dev)
- Visit [React Native community resources](https://reactnative.dev/help)
- Review the project code for examples

---

Made with 💜 for calm, sensory-friendly gaming
