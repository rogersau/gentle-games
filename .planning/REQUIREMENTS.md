# Requirements: Gentle Games

**Defined:** 2026-03-17
**Core Value:** Children can access calm, predictable, pressure-free play that parents and caregivers can trust.

## v1 Requirements

### Privacy & Observability

- [ ] **PRIV-01**: Parent can review and change a telemetry preference for analytics and crash reporting from within app settings
- [ ] **PRIV-02**: App does not send analytics or crash telemetry until the telemetry preference for that install is explicitly enabled
- [ ] **PRIV-03**: Crash and analytics events only send allowlisted diagnostic fields and exclude free-form user content
- [ ] **PRIV-04**: User receives a calm fallback message if an external support or privacy link cannot be opened

### Gameplay Correctness

- [ ] **PLAY-01**: User can undo one mirrored drawing action with a single undo step in half and quarter symmetry modes
- [ ] **PLAY-02**: User can only complete a Number Picnic basket drop when the dragged item overlaps the visible basket target
- [ ] **PLAY-03**: User sees Number Picnic basket hover feedback only when the dragged item is actually over the basket

### Runtime Stability

- [ ] **STAB-01**: Navigation between app routes is type-checked without unsafe route casts
- [ ] **STAB-02**: App startup services initialize from an explicit bootstrap flow after required settings state is available
- [ ] **STAB-03**: User does not experience delayed callbacks mutating flagged gameplay state after leaving a screen
- [ ] **STAB-04**: Concern-prone gameplay state synchronization behaves consistently without timing hacks or disabled hook dependency checks

### Performance

- [ ] **PERF-01**: High-motion screens avoid the hottest per-frame React state churn that causes dropped frames on lower-end devices
- [ ] **PERF-02**: Long drawing sessions persist changes without rewriting the full drawing history on every edit
- [ ] **PERF-03**: Match and round scheduling on flagged games uses tracked cancellable timers that do not pile up across rapid navigation or replay flows

### Release & Regression Coverage

- [ ] **RELG-01**: Release automation includes web source maps in the Sentry upload path
- [ ] **RELG-02**: App startup telemetry and bootstrap behavior has automated regression coverage
- [ ] **RELG-03**: Source-map upload tooling has automated regression coverage for web, Android, and iOS fallback paths
- [ ] **RELG-04**: Bubble Pop, Category Match, and Memory Snap route wiring have targeted regression coverage for interaction- and accessibility-sensitive behavior

## v2 Requirements

### Maintainability

- **MAIN-01**: Developers can modify the largest interactive surfaces through extracted hooks or child components instead of monolithic modules

### Scaling

- **SCAL-01**: Heavy animation surfaces scale to larger object counts through lower-level animation primitives rather than React-state frame loops
- **SCAL-02**: Drawing history uses longer-session compaction and snapshot strategies beyond the `v1.1` persistence fixes

## Out of Scope

| Feature | Reason |
|---------|--------|
| New mini-games or content packs | This milestone is for hardening existing experiences rather than expanding feature scope |
| Backend accounts, sync, or online services | No backend exists today and those additions do not resolve the audited concerns |
| Full UI redesign or design-system refresh | Stability work should preserve the current sensory-friendly interface rather than restyle it |
| Full decomposition of every large component | Some maintainability refactors may happen opportunistically, but repository-wide restructuring is deferred beyond this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after milestone v1.1 requirement scoping*
