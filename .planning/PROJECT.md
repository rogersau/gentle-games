# Gentle Games

## What This Is

A calm, sensory-friendly mobile application designed for children with sensory sensitivities, particularly those with autism spectrum disorder (ASD). Built with accessibility and inclusion at its core — provides a distraction-free gaming environment with no paywalls, ads, or overwhelming stimuli.

## Core Value

A safe, predictable, and stress-free digital space where children can play, create, and explore at their own pace. Every interaction is designed with sensory needs in mind.

---

## Current State (v1.0 MVP)

**Shipped:** 2026-03-03

### What's Working

9 educational and sensory games available:
- ✓ Memory Snap — card matching game
- ✓ Bubble Pop — calming bubble popping
- ✓ Drawing Canvas — creative drawing space
- ✓ Glitter Globe — calming visual experience  
- ✓ Keepy Uppy — balloon game
- ✓ Breathing Garden — guided breathing exercise
- ✓ Pattern Train — pattern completion game
- ✓ Category Match — sorting/categorization game
- ✓ NumberPicnic — number learning (1-10) with visual dots

### Accessibility Features

- ✓ Full light/dark mode support
- ✓ Reduced motion preference (user toggle + system detection)
- ✓ Sound can be disabled globally
- ✓ Animations can be disabled globally
- ✓ All touch targets meet 48dp minimum

### Parent Features

- ✓ Parent Timer for session management
- ✓ Settings accessible via secret gesture

### Technical

- **Codebase:** ~12,778 lines TypeScript
- **Test Coverage:** 165 tests passing
- **Platforms:** iOS, Android, Web (PWA)

---

## Known Issues (v1.0)

⚠️ **LetterLantern** and **StarPath** games were completed but files were deleted post-completion. Currently inaccessible.

---

## Requirements

### Validated (v1.0)

- ✓ Memory Snap, Bubble Pop, Drawing Canvas, Glitter Globe, Keepy Uppy, Breathing Garden, Pattern Train, Category Match — v1.0
- ✓ NumberPicnic with visual representations — v1.0
- ✓ Settings (theme, sound, animation, reduced motion) — v1.0
- ✓ Parent Timer — v1.0
- ✓ i18n support (English) — v1.0
- ✓ 48dp touch targets — v1.0
- ✓ Light/dark mode — v1.0
- ✓ Reduced motion support — v1.0

### Active (Next Milestone)

- [ ] LetterLantern restoration or removal (files deleted)
- [ ] StarPath restoration or removal (files deleted)
- [ ] Error logging/telemetry for production monitoring
- [ ] Additional language support
- [ ] [User to specify]

### Out of Scope

- Real-time multiplayer — high complexity, not core to value
- User accounts/profiles — adds complexity, privacy considerations
- Cloud sync — offline-first is a feature, not a limitation
- Social features — not aligned with core value of calm, private play
- ~~LetterLantern/StarPath~~ — completed then deleted (decision needed)

---

## Context

- **Tech Stack:** Expo (React Native), TypeScript, React Navigation, AsyncStorage
- **Target Users:** Children ages 4-10 with sensory processing differences, parents/caregivers, therapists
- **Platforms:** iOS, Android, Web (PWA)
- **Architecture:** Design system with i18n, settings context, accessibility hooks
- **Testing:** Jest with react-testing-library, good coverage on game logic

## Constraints

- **Accessibility:** Must support light/dark mode, animation toggles, sound controls, large touch targets
- **Offline-first:** All features must work without internet
- **No monetization:** No ads, in-app purchases, or subscriptions
- **Sensory-friendly:** Soft colors, optional audio, no jarring animations, no time pressure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo/React Native | Cross-platform from single codebase | ✓ Good — works on all platforms |
| AsyncStorage for settings | Simple, offline persistence | ✓ Good — reliable, no backend needed |
| i18next for translations | Internationalization-ready | ✓ Good — extensible for more languages |
| No user accounts | Simplicity, privacy, no data collection | ✓ Good — aligns with core value |
| Games hidden behind setting | Originally "unfinished" | ✓ Lesson learned — they were already done |
| Reduced motion system detection | Respects user system preferences | ✓ Good — accessibility best practice |

---

## Current Milestone: v1.1 Error Logging

**Goal:** Add Sentry error logging using their free tier for production monitoring

**Target features:**
- Sentry SDK integration for error tracking
- Free tier configuration (limited events, proper sampling)
- Official removal of LetterLantern and StarPath (files deleted, not restoring)

---

## Requirements

### Validated (v1.0)

- ✓ Memory Snap, Bubble Pop, Drawing Canvas, Glitter Globe, Keepy Uppy, Breathing Garden, Pattern Train, Category Match — v1.0
- ✓ NumberPicnic with visual representations — v1.0
- ✓ Settings (theme, sound, animation, reduced motion) — v1.0
- ✓ Parent Timer — v1.0
- ✓ i18n support (English) — v1.0
- ✓ 48dp touch targets — v1.0
- ✓ Light/dark mode — v1.0
- ✓ Reduced motion support — v1.0

### Active (v1.1)

- [ ] Sentry error logging integration
- [ ] Free tier configuration with event limits
- [ ] Officially remove LetterLantern and StarPath references

### Out of Scope

- Real-time multiplayer — high complexity, not core to value
- User accounts/profiles — adds complexity, privacy considerations
- Cloud sync — offline-first is a feature, not a limitation
- Social features — not aligned with core value of calm, private play
- ~~LetterLantern/StarPath~~ — completed then deleted, now officially removed
- ~~Additional languages~~ — deferred to v1.2
- ~~Polish/bug fixes~~ — deferred unless blocking Sentry

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo/React Native | Cross-platform from single codebase | ✓ Good — works on all platforms |
| AsyncStorage for settings | Simple, offline persistence | ✓ Good — reliable, no backend needed |
| i18next for translations | Internationalization-ready | ✓ Good — extensible for more languages |
| No user accounts | Simplicity, privacy, no data collection | ✓ Good — aligns with core value |
| Games hidden behind setting | Originally "unfinished" | ✓ Lesson learned — they were already done |
| Reduced motion system detection | Respects user system preferences | ✓ Good — accessibility best practice |
| Sentry free tier | Cost-effective error monitoring, sufficient for current scale | — Pending |
| Remove LetterLantern/StarPath | Files deleted, not worth restoring for v1.1 scope | — Pending |

---

*Last updated: 2026-03-03 after v1.1 milestone started*
