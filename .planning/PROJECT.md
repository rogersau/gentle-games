# Gentle Games

## What This Is

Gentle Games is a sensory-friendly Expo app for children ages 4-10, especially children with sensory sensitivities and ASD, plus the parents, caregivers, therapists, and educators who support them. It offers calm, pressure-free mini-games and creative activities with predictable navigation, adjustable sensory settings, and offline-friendly play across web and mobile surfaces.

## Core Value

Children can access calm, predictable, pressure-free play that parents and caregivers can trust.

## Current Milestone: v1.1 Resolve Identified Concerns

**Goal:** Resolve the known privacy, correctness, stability, performance, and release-quality concerns in the shipped app without disrupting its sensory-safe experience.

**Target features:**
- Parent-controlled telemetry consent and safer observability defaults
- Fixes for known gameplay and release-tooling bugs
- Runtime hardening for navigation, startup orchestration, timers, and hook-driven state flow
- Performance and regression-test improvements for the riskiest existing surfaces

## Requirements

### Validated

- ✓ Children can launch a collection of sensory-friendly games and activities with no ads, paywalls, or time pressure — existing shipped app baseline
- ✓ Parents and caregivers can persist sensory preferences such as sound, animations, language, color mode, and game visibility — existing shipped app baseline
- ✓ The app supports offline-friendly play and cross-platform Expo targets including web, Android, and iOS export flows — existing shipped app baseline
- ✓ Parent timer and lock-screen controls can gate continued play across the app — existing shipped app baseline
- ✓ The app already ships a shared UI shell, localization layer, and reusable game architecture that future work must preserve — existing shipped app baseline

### Active

- [ ] Resolve the identified privacy and telemetry concerns while preserving the calm default experience
- [ ] Fix the currently known gameplay and release-tooling bugs called out in the codebase concerns audit
- [ ] Harden the runtime architecture so navigation, startup, timers, and state synchronization are safer to change
- [ ] Reduce performance hotspots and close the highest-risk regression gaps in concern-prone areas

### Out of Scope

- New mini-games or major content expansion — this milestone is focused on hardening the existing app
- Backend accounts, cloud sync, or online multiplayer features — no backend architecture exists today and these do not address the current concerns inventory
- A full visual redesign — the milestone should preserve the established sensory-friendly UX rather than rework the app's identity

## Context

The current app already ships a broad gentle-play experience, including multiple mini-games, a shared settings system, localization, telemetry wiring, and PWA/native export paths. The new `.planning/codebase/CONCERNS.md` map identified concrete issues across privacy controls, gameplay correctness, navigation typing, timeout cleanup, startup side effects, animation performance, and missing regression coverage; this milestone turns that audit into actionable work.

## Constraints

- **Tech stack**: Continue using Expo, React Native, and strict TypeScript — the existing app architecture and build scripts depend on that stack.
- **Accessibility**: Preserve calm, predictable, sensory-friendly interactions — fixes must not introduce jarring UX, hidden flows, or time pressure.
- **Privacy**: Treat telemetry as parent-controlled and child-sensitive — the app targets children and must minimize default data collection risk.
- **Compatibility**: Maintain web, Android, and iOS export compatibility — release and testing changes must keep existing multi-platform validation paths working.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start formal GSD planning at milestone `v1.1` | The app is already shipped, but this repository had no prior `PROJECT.md`/`ROADMAP.md` planning scaffold | — Pending |
| Scope milestone `v1.1` to everything in `.planning/codebase/CONCERNS.md` | User explicitly chose the full concerns inventory rather than a narrower slice | — Pending |
| Skip external ecosystem research for this milestone | The concern inventory is codebase-specific and already detailed enough to define requirements directly | — Pending |

---
*Last updated: 2026-03-17 after milestone v1.1 initialization*
