# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**
- TypeScript ~5.9.2 - All application source code, tests, and configuration

**Secondary:**
- JavaScript (via React Native/React Native Web) - Transpiled output for web platform

## Runtime

**Environment:**
- Node.js 20.x - Development and build tooling

**Package Manager:**
- npm - Package management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.1.0 - UI framework
- React Native 0.81.5 - Mobile framework
- Expo SDK 54.0.33 - Native module abstraction and build tooling
- React Navigation 7.x - Navigation framework (@react-navigation/native ^7.1.28, @react-navigation/stack ^7.7.2)

**Testing:**
- Jest 29.7.0 - Test runner
- jest-expo 54.0.12 - Expo preset for Jest
- @testing-library/react-native 13.3.3 - Component testing

**Build/Dev:**
- Expo CLI - Development server and builds
- TypeScript 5.9.2 - Type checking
- Metro - JavaScript bundler for React Native

## Key Dependencies

**Critical:**
- expo ~54.0.33 - Core Expo framework
- react 19.1.0 - React core
- react-native 0.81.5 - React Native core

**Navigation:**
- @react-navigation/native ^7.1.28 - Navigation container
- @react-navigation/stack ^7.7.2 - Stack navigator

**Native Modules (expo-*):**
- expo-audio ~1.1.1 - Audio playback
- expo-font ~14.0.11 - Custom fonts
- expo-localization ^55.0.8 - Device localization
- expo-sensors ~15.0.8 - Device sensors (for glitter motion)
- expo-splash-screen ~31.0.13 - Splash screen management
- expo-status-bar ~3.0.9 - Status bar control

**UI Components:**
- react-native-svg 15.12.1 - SVG rendering
- react-native-screens ~4.16.0 - Native navigation screens
- react-native-safe-area-context ^5.6.2 - Safe area handling
- react-native-gesture-handler ~2.28.0 - Gesture handling

**Data & Storage:**
- @react-native-async-storage/async-storage 2.2.0 - Local settings storage
- i18next ^25.8.13 - Internationalization
- react-i18next ^16.5.4 - React bindings for i18next

**Fonts:**
- @expo-google-fonts/nunito ^0.4.2 - Nunito font family

**Other:**
- react-native-web ^0.21.2 - Web platform rendering
- react-native-color-picker 0.6.0 - Color picker component

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Extends: expo/tsconfig.base
- Strict mode enabled

**Jest:**
- Config: `jest.config.js`
- Preset: jest-expo
- Setup file: `jest.setup.ts`

**App Configuration:**
- `app.json` - Expo/React Native app configuration
- `staticwebapp.config.json` - Azure Static Web Apps configuration

**Build Outputs:**
- Web: Expo export to `dist/` directory
- PWA: Generated via `scripts/prepare-pwa.js`
- Android: Exported via `expo export --platform android`
- iOS: Exported via `expo export --platform ios`

## Platform Requirements

**Development:**
- Node.js 20.x
- npm
- Expo CLI
- For native builds: Xcode (iOS) / Android Studio (Android)

**Production:**
- Web: Azure Static Web Apps (PWA deployment)
- Mobile: Expo/React Native build outputs (Android APK/AAB, iOS IPA)

---

*Stack analysis: 2026-03-03*
