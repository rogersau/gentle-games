# Roadmap: Gentle Games

## Milestones

- ✅ **v1.0 MVP** — Phases 1-2 (shipped 2026-03-03) — [Archive](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Error Logging** — Phase 3 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-2) — SHIPPED 2026-03-03</summary>

### Phase 1: Complete Learning Games ✓

**Goal:** Finish the three unfinished educational games (NumberPicnic, LetterLantern, StarPath)

**Requirements:**
- LEARN-01: NumberPicnic game
- LEARN-02: NumberPicnic visuals
- LEARN-03: LetterLantern game
- LEARN-04: LetterLantern visuals
- LEARN-05: StarPath game

**Plans:**
- [x] 01-01: Complete all three learning games with visuals

---

### Phase 2: Polish & Accessibility ✓

**Goal:** Ensure all games work for all accessibility needs

**Requirements:**
- POLISH-01: Games work without animations
- POLISH-02: Games work without sound
- POLISH-03: Consistent UI patterns
- ACCESS-01: Touch targets 48dp minimum
- ACCESS-02: Light/dark mode support
- ACCESS-03: Reduced motion support

**Plans:**
- [x] 02-01: Animation + Sound handling
- [x] 02-02: Reduced motion setting
- [x] 02-03: Touch targets + UI consistency

</details>

---

### Phase 3: Error Monitoring

**Goal:** Add Sentry error logging using free tier for production monitoring

**Requirements:**
- SENTRY-01: Sentry SDK installed and initialized in Expo app
- SENTRY-02: Error boundaries configured to catch React errors
- SENTRY-03: Free tier configured (event limits, sampling rate)
- SENTRY-04: Source maps uploaded for readable stack traces
- SENTRY-05: Privacy-respecting (no PII, child-safe data handling)
- CLEAN-01: Remove LetterLantern screen and all references
- CLEAN-02: Remove StarPath screen and all references
- CLEAN-03: Update game lists and navigation
- CLEAN-04: Remove dead imports and types

**Plans:**
- [x] 03-01: Remove LetterLantern and StarPath game references
- [x] 03-02: Install and configure Sentry SDK
- [x] 03-03: Error boundaries and privacy-safe reporting
- [x] 03-04: Source map generation and upload

**Success Criteria:**
1. Errors are automatically captured and sent to Sentry dashboard
2. Source maps provide readable stack traces for debugging
3. Free tier limits are respected (event sampling configured)
4. No personally identifiable information is collected
5. LetterLantern and StarPath references are fully removed
6. App continues to work normally after cleanup

---

### Phase 4: Internationalization (Planned)

**Goal:** Add Spanish and French language support

**Requirements:**
- I18N-01: Spanish translations
- I18N-02: French translations

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Complete Learning Games | v1.0 | 1/1 | Complete | 2026-03-03 |
| 2. Polish & Accessibility | v1.0 | 3/3 | Complete | 2026-03-03 |
| 3. Error Monitoring | v1.1 | 4/4 | Complete | 2026-03-03 |
| 4. Internationalization | v1.1 | 0/1 | Planned | - |

---

*Roadmap last updated: 2026-03-03 after 03-04 complete*
