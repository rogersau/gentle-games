# Stack Research: Sensory-Friendly Kids Apps

**Analysis Date:** 2026-03-03

## Recommended Stack

### Current Stack (Good)
- **Expo SDK 54** — Excellent choice for cross-platform mobile
- **React Native 0.81** — Solid, well-supported
- **TypeScript** — Essential for maintainability
- **React Navigation 7** — Industry standard
- **AsyncStorage** — Simple, sufficient for settings
- **i18next** — Robust i18n solution

### Recommended Additions for Educational Games

**For Learning Games (Numbers, Letters):**
- Consider `expo-av` for richer audio/video
- For more complex games, consider `react-native-reanimated` for smooth animations
- For data persistence beyond settings: `expo-file-system` or `AsyncStorage` is sufficient

### What NOT to Use and Why

| Library | Reason |
|---------|--------|
| Redux | Overkill — Context API is sufficient |
| Firebase/Backend | Contradicts offline-first principle |
|社交SDK | Not aligned with core value |
|复杂动画库 | Can cause sensory overload |

## Version Recommendations

- Keep Expo SDK current (54 is recent)
- React Native 0.81+ recommended
- TypeScript 5.9+ for latest features

## Confidence

**High confidence** — Stack is appropriate for the project goals.

---
*Research: 2026-03-03*
