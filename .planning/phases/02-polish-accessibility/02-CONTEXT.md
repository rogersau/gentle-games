# Phase 2: Polish & Accessibility - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure all games work for all accessibility needs. This includes making games work without animations, without sound, ensuring consistent UI patterns, fixing touch targets to meet 48dp minimum, implementing light/dark mode support, and adding reduced motion support.

</domain>

<decisions>
## Implementation Decisions

### Animation Handling
- When `animationsEnabled` is false: **Disable entirely** - instant state changes, no animations at all
- Apply to **every screen** (not just games) - home, settings, parent timer, etc.
- **Navigation transitions OK** - screen navigation can keep transitions, only disable game animations
- **Skip animated elements** - loaders, spinners, activity indicators should be hidden/skipped when disabled
- **Audit each game** - investigate which games have integral animations that need handling
- **Game-specific for Glitter Globe** - particles are essential to gameplay, note for planning to find alternative interactions

### Sound Handling
- When `soundEnabled` is false: **Silent is fine** - no visual replacements needed
- Apply to **every screen** (menus, navigation sounds)
- **Audit each game** - check each game's audio dependencies
- **Remove sound files** - remove bundled sounds from app when disabled to keep app lightweight
- **No special handling for StarPath** - same as other games

### Reduced Motion
- **Add separate setting** - new reduced motion toggle, not linked to animationsEnabled
- **Separate options in Settings UI** - show alongside light/dark/system theme options
- **Use React Native API** - detect system `prefers-reduced-motion` via React Native accessibility API
- **Lighter animation** - reduced motion = fewer/simpler animations (not instant/off like disabled)
- **Show in Settings UI** - visible toggle for users

### UI Consistency
- **Full design system** - include fonts, spacing, colors, not just core patterns
- **Audit existing patterns** - check if design system exists, document current patterns
- **Flexible consistency** - similar look and feel, some flexibility allowed (not strict matching)
- **Verify games** - ensure games follow existing patterns
- **New games first** - focus on NumberPicnic, LetterLantern, StarPath for consistency fixes

### Touch Targets
- **Scope: All screens** - every interactive element everywhere in the app
- **Minimum size: 48dp** - follow Android accessibility guidelines
- **Fix by adjusting spacing** - increase padding/margins to meet minimum
- **Audit everything** - all buttons, game elements, navigation, inputs
- **Fix all issues** - don't just document, actually fix all touch target problems found

### Light/Dark Mode
- Already implemented via `colorMode` setting: light/dark/system
- Already using React Native's `useColorScheme` for system detection
- Theme colors already defined: PASTEL_COLORS and DARK_PASTEL_COLORS
- No changes needed - this is already complete

### Claude's Discretion
- Which games to prioritize for animation audit
- Exact implementation of reduced motion detection (React Native API approach)
- How to handle specific games with integral animations
- Exact spacing adjustments for touch targets

</decisions>

<specifics>
## Specific Ideas

- "Skip animated elements when disabled - don't show static versions"
- "Reduced motion should be lighter animation, not disabled"
- "Flexible consistency - games can have some variation"
- "48dp minimum - follow standard accessibility guidelines"
- Note for planning: Glitter Globe and StarPath may need alternative interactions when animations disabled

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- SettingsContext already has `animationsEnabled`, `soundEnabled`, `colorMode` settings
- useThemeColors hook already implements light/dark mode
- Theme colors already defined in types (PASTEL_COLORS, DARK_PASTEL_COLORS)
- expo-av handles audio playback (check how it handles disabled state)

### Established Patterns
- Settings via SettingsContext with AsyncStorage persistence
- Theme resolution via resolveThemeMode() function
- Color palettes defined in src/types/
- Existing 10+ games with varying animation/sound implementations

### Integration Points
- SettingsScreen.tsx - where settings toggles are rendered
- SettingsContext.tsx - where settings state is managed
- theme.ts - where color resolution happens
- Each game screen - needs to check settings before animating/playing sound

</code_context>

<deferred>
## Deferred Ideas

- Light/dark mode already implemented - no work needed (ACCESS-02 complete)
- Navigation transitions will stay animated even when animations disabled

</deferred>

---

*Phase: 02-polish-accessibility*
*Context gathered: 2026-03-03*
