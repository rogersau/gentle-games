# Requirements: Gentle Games v1.1

**Defined:** 2026-03-03
**Core Value:** A safe, predictable, and stress-free digital space where children can play, create, and explore at their own pace.

## v1.1 Requirements

Requirements for error monitoring and cleanup milestone.

### Error Monitoring (SENTRY)

- [ ] **SENTRY-01**: Sentry SDK installed and initialized in Expo app
- [ ] **SENTRY-02**: Error boundaries configured to catch React errors
- [ ] **SENTRY-03**: Free tier configured (event limits, sampling rate)
- [ ] **SENTRY-04**: Source maps uploaded for readable stack traces
- [ ] **SENTRY-05**: Privacy-respecting (no PII, child-safe data handling)

### Cleanup (CLEAN)

- [ ] **CLEAN-01**: Remove LetterLantern screen and all references
- [ ] **CLEAN-02**: Remove StarPath screen and all references
- [ ] **CLEAN-03**: Update game lists and navigation
- [ ] **CLEAN-04**: Remove dead imports and types

## v2 Requirements

Deferred to future release.

### Internationalization

- **I18N-01**: Spanish language support
- **I18N-02**: French language support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multiplayer | High complexity, not core to value |
| User accounts/profiles | Adds complexity, privacy considerations |
| Cloud sync | Offline-first is a feature, not a limitation |
| Social features | Not aligned with core value of calm, private play |
| LetterLantern/StarPath restoration | Files deleted, decision made to remove not restore |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SENTRY-01 | Phase 3 | Pending |
| SENTRY-02 | Phase 3 | Pending |
| SENTRY-03 | Phase 3 | Pending |
| SENTRY-04 | Phase 3 | Pending |
| SENTRY-05 | Phase 3 | Pending |
| CLEAN-01 | Phase 3 | Pending |
| CLEAN-02 | Phase 3 | Pending |
| CLEAN-03 | Phase 3 | Pending |
| CLEAN-04 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after v1.1 milestone started*
