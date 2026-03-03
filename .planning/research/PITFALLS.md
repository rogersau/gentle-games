# Pitfalls Research: Sensory-Friendly Kids Apps

**Analysis Date:** 2026-03-03

## Common Mistakes in Kids Apps

### 1. Over-Stimulating Design

**Warning Signs:**
- Too many colors on screen
- Loud sounds without mute option
- Flashing or rapid animations
- Cluttered interfaces

**Prevention:**
- Default to "calm" settings
- Every sound/visual has off toggle
- Test with all effects disabled

### 2. Unintended Pressure

**Warning Signs:**
- Countdown timers
- Score displays
- "Wrong" feedback
- Completion requirements

**Prevention:**
- No time pressure ever
- No scoring (or private only)
- Positive reinforcement only
- Allow partial participation

### 3. Accessibility Oversights

**Warning Signs:**
- Small touch targets
- Low contrast text
- No keyboard navigation (web)
- Missing alt text

**Prevention:**
- 48dp minimum touch targets
- Test with accessibility inspector
- Support prefers-reduced-motion
- Support screen readers

### 4. Data Privacy Issues

**Warning Signs:**
- Collecting personal data
- Requiring accounts
- Tracking behavior
- Cloud sync without consent

**Prevention:**
- No accounts required
- All data local only
- Clear privacy policy
- No analytics

### 5. Incomplete Features Shipped

**Warning Signs:**
- Unfinished games in production
- Placeholder content
- Broken flows

**Prevention:**
- Complete before deploying
- Feature flags for unfinished
- Clear "coming soon" if needed

## Phase Mapping

| Pitfall | Relevant Phase |
|---------|---------------|
| Over-stimulation | All phases |
| Unintended pressure | Game development |
| Accessibility | Each feature |
| Privacy | Settings, data |
| Incomplete features | Any new feature |

---
*Research: 2026-03-03*
