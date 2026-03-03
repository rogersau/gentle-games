# Codebase Concerns

**Analysis Date:** 2026-03-03

## Tech Debt

### Large Component: DrawingCanvas.tsx

- **Issue:** Single file with 1017+ lines of code handling multiple concerns
- **Files:** `src/components/DrawingCanvas.tsx`
- **Impact:** Difficult to maintain, test, and extend. All drawing logic, shape tools, eraser, color picker, and history management in one file
- **Fix approach:** Extract into smaller modules: DrawingCanvas (container), DrawingToolbar (tool selection), ColorPicker, ShapeRenderer, StrokeRenderer, HistoryManager

### Incomplete Games Marked as "Unfinished"

- **Issue:** Three games are flagged as incomplete but can be enabled via settings
- **Files:** `src/types/index.ts` (line 50-54), `src/screens/HomeScreen.tsx` (line 147)
- **Impact:** Users may encounter incomplete or non-functional games when `enableUnfinishedGames` is enabled
- **Fix approach:** Either complete the games (Number Picnic, Letter Lanterns, Star Path) or remove the feature flag entirely

### Hardcoded Sound Volume Multiplier

- **Issue:** Sound volume is capped at 50% regardless of user setting (`settings.soundVolume * 0.5` in `src/utils/sounds.ts` line 62)
- **Files:** `src/utils/sounds.ts`
- **Impact:** Users cannot achieve full volume even when their system volume is at max
- **Fix approach:** Remove the `cappedUserVolume` multiplier or make it configurable

### Missing Sound Assets

- **Issue:** Sound files are loaded with warnings if not present, but not required at build time
- **Files:** `src/utils/sounds.ts` (lines 4-9)
- **Impact:** App runs without sound if MP3 files are missing, may confuse users expecting audio
- **Fix approach:** Either include placeholder sound files or document that sounds are optional

## Known Bugs

### Type Definition Import in TypeScript

- **Issue:** Circular/forward reference in type import (`language: import('./i18n').SupportedLanguage` in `src/types/index.ts` line 47)
- **Files:** `src/types/index.ts`
- **Trigger:** TypeScript compilation with strict mode
- **Workaround:** None currently - works but could cause issues with some TypeScript configurations

### Hard Difficulty Grid May Not Fit Small Screens

- **Issue:** Hard difficulty creates 5x6 grid (30 tiles) which may not fit on smaller devices
- **Files:** `src/utils/gameLogic.ts` (line 16)
- **Trigger:** Playing Memory Snap on hard difficulty with small screen width
- **Workaround:** None - no responsive tile sizing implemented

## Security Considerations

### No Authentication or Content Restrictions

- **Issue:** App has no authentication - all games and settings are accessible to anyone
- **Files:** Entire app - no auth layer
- **Current mitigation:** Parent timer feature provides time limits for children
- **Recommendations:** Consider adding parent gate (math question or similar) for settings access

### AsyncStorage Stores Settings in Plain Text

- **Issue:** User settings stored without encryption in AsyncStorage
- **Files:** `src/context/SettingsContext.tsx` (lines 111-133)
- **Current mitigation:** Settings are non-sensitive (theme, volume, difficulty)
- **Recommendations:** No action needed for current data, but avoid storing any sensitive information

## Performance Bottlenecks

### Drawing Canvas with Large History

- **Issue:** Drawing history array grows unbounded, causing memory issues with extended use
- **Files:** `src/components/DrawingCanvas.tsx`
- **Cause:** Every stroke/shape is added to history without cleanup
- **Improvement path:** Implement history limit with automatic older entry removal, or only store last N actions

### React Navigation Stack Renders All Screens

- **Issue:** All 14 screen components are imported and registered in App.tsx even if never visited
- **Files:** `App.tsx` (lines 13-24)
- **Impact:** Increased initial bundle size and memory footprint
- **Improvement path:** Implement lazy loading for screens using React.lazy() and Suspense

### Large Static Data Arrays in Types

- **Issue:** ANIMALS array (50 items) and SHAPES array (40 items) are loaded entirely for every game
- **Files:** `src/types/index.ts` (lines 120-212)
- **Cause:** Data is imported at module level
- **Improvement path:** Consider lazy loading or tree-shaking if not all items are needed

## Fragile Areas

### Game Logic Depends on Hardcoded Emojis

- **Issue:** Pattern train and other games use hardcoded emoji arrays that may render differently across platforms
- **Files:** `src/types/index.ts` (line 265), `src/utils/patternTrainLogic.ts`
- **Why fragile:** Emoji rendering varies by OS - same emoji may appear differently on iOS vs Android
- **Safe modification:** Add fallback rendering or use platform-specific icons
- **Test coverage:** Limited cross-platform testing mentioned

### Settings Context Has Race Condition Risk

- **Issue:** `updateSettings` reads current settings and merges, but multiple rapid updates could overwrite each other
- **Files:** `src/context/SettingsContext.tsx` (lines 128-141)
- **Why fragile:** No optimistic locking or atomic updates
- **Safe modification:** Use functional state updates or add debouncing

### Navigation Type Safety Issues

- **Issue:** Multiple `as never` type casts in navigation calls throughout screens
- **Files:** `src/screens/HomeScreen.tsx` (lines 159, 167, 251), `src/screens/SettingsScreen.tsx` (lines 69, 75, 220)
- **Why fragile:** Silences TypeScript errors but could cause runtime crashes if routes change
- **Safe modification:** Use proper navigation type definitions with React Navigation's typed navigation

## Scaling Limits

### AsyncStorage as Single Data Store

- **Current capacity:** Settings only (minimal data)
- **Limit:** No complex queries, synchronous access blocks UI
- **Scaling path:** If adding more data (progress tracking, achievements), migrate to SQLite or Realm

### Single Language Support

- **Current capacity:** 2 locales (en-AU, en-US) with identical content
- **Limit:** Adding more languages requires duplicate JSON files
- **Scaling path:** Consider using translation management system if i18n scales

## Dependencies at Risk

### Expo SDK Version

- **Risk:** Using Expo SDK 54 with React Native 0.81.5 - relatively recent but needs updates
- **Impact:** Security patches, breaking changes in future updates
- **Migration plan:** Keep updated with Expo release schedule, test thoroughly before upgrading

### react-native-color-picker

- **Risk:** Third-party component (`react-native-color-picker` v0.6.0) with limited maintenance
- **Impact:** May break with future React Native versions
- **Migration plan:** Consider building custom color picker or finding maintained alternative

### No Test Coverage Enforcement

- **Risk:** Tests exist but no coverage thresholds enforced in CI
- **Impact:** Easy to introduce regressions
- **Migration plan:** Add coverage reporting and consider minimum coverage gates

## Missing Critical Features

### No Progress Tracking

- **Problem:** Children cannot track their achievements or game progress
- **Blocks:** Motivation features, parent dashboard, personalized experience

### No Save/Resume for Games

- **Problem:** Games must be completed in one session
- **Blocks:** Longer activities, interrupted play support

### No Accessibility for Screen Readers

- **Problem:** Limited ARIA-like labels on interactive elements
- **Blocks:** Use by visually impaired children

## Test Coverage Gaps

### Context Providers Not Fully Tested

- **What's not tested:** SettingsContext persistence edge cases, ParentTimerContext countdown accuracy
- **Files:** `src/context/SettingsContext.tsx`, `src/context/ParentTimerContext.tsx`
- **Risk:** Settings could be lost on app crash, timer could drift
- **Priority:** Medium

### Game Logic Edge Cases

- **What's not tested:** Empty tile generation, shuffle algorithm edge cases with minimum pairs
- **Files:** `src/utils/gameLogic.ts`
- **Risk:** Memory snap could fail to generate tiles
- **Priority:** Low

### Sound System Error Paths

- **What's not tested:** What happens when audio session fails or device has no audio
- **Files:** `src/utils/sounds.ts`
- **Risk:** App could crash on audio failure
- **Priority:** Medium

---

*Concerns audit: 2026-03-03*
