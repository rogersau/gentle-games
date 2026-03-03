# Gentle Games

## What This Is

A calm, sensory-friendly mobile application designed for children with sensory sensitivities, particularly those with autism spectrum disorder (ASD). Built with accessibility and inclusion at its core — provides a distraction-free gaming environment with no paywalls, ads, or overwhelming stimuli.

## Core Value

A safe, predictable, and stress-free digital space where children can play, create, and explore at their own pace. Every interaction is designed with sensory needs in mind.

## Requirements

### Validated

- ✓ Memory Snap game — shipped and working
- ✓ Bubble Pop game — shipped and working
- ✓ Drawing Canvas — shipped and working
- ✓ Glitter Globe — shipped and working
- ✓ Keepy Uppy balloon game — shipped and working
- ✓ Breathing Garden — shipped and working
- ✓ Pattern Train — shipped and working
- ✓ Category Match — shipped and working
- ✓ Settings (theme, sound, animation controls) — shipped and working
- ✓ Parent Timer feature — shipped and working
- ✓ i18n support (English) — shipped and working

### Active

- [ ] NumberPicnic (number learning game) — unfinished
- [ ] LetterLantern (letter learning game) — unfinished
- [ ] StarPath (star collection) — unfinished
- [ ] [User to specify additional requirements]

### Out of Scope

- Real-time multiplayer — high complexity, not core to value
- User accounts/profiles — adds complexity, privacy considerations
- Cloud sync — offline-first is a feature, not a limitation
- Social features — not aligned with core value of calm, private play

## Context

- **Tech Stack:** Expo (React Native), TypeScript, React Navigation, AsyncStorage
- **Target Users:** Children ages 4-10 with sensory processing differences, parents/caregivers, therapists
- **Platforms:** iOS, Android, Web (PWA)
- **Existing Architecture:** Solid foundation with design system, i18n, settings context
- **Testing:** Jest with react-testing-library, good test coverage on game logic

## Constraints

- **Accessibility:** Must support light/dark mode, animation toggles, sound controls, large touch targets
- **Offline-first:** All features must work without internet
- **No monetization:** No ads, in-app purchases, or subscriptions
- **Sensory-friendly:** Soft colors, optional audio, no jarring animations, no time pressure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo/React Native | Cross-platform from single codebase | ✓ Good |
| AsyncStorage for settings | Simple, offline persistence | ✓ Good |
| i18next for translations | Internationalization-ready | ✓ Good |
| No user accounts | Simplicity, privacy, no data collection | ✓ Good |

---
*Last updated: 2026-03-03 after project initialization*
