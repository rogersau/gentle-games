# Phase 1: Complete Learning Games - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the three hidden learning games (NumberPicnic, LetterLantern, StarPath) fully available to users. This includes enabling them by default, adding visual representations, and ensuring they meet accessibility standards.

</domain>

<decisions>
## Implementation Decisions

### Game Visibility
- All games (including NumberPicnic, LetterLantern, StarPath) visible on home screen by default
- Remove or disable the `enableUnfinishedGames` setting
- These games are complete and ready for all users

### NumberPicnic Visual Representations
- Show dot representations for numbers (e.g., 3 shows 🟢🟢🟢)
- Display in the prompt card area where items are shown
- Works with all difficulty levels (1-5, 1-10, etc.)

### LetterLantern Visual Representations  
- Show item images/emojis that start with the target letter
- Display items alongside the letter choice
- Example: Letter "A" shows 🍎🐱✈️ options

### Accessibility/Polish
- All games must work with animations disabled
- All games must work with sound disabled
- All touch targets must be minimum 48dp

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- NumberPicnicScreen.tsx already exists with basket counting UI
- LetterLanternScreen.tsx already exists with letter grid
- StarPathScreen.tsx already exists with tilt controls
- All games have corresponding logic files (numberPicnicLogic.ts, letterLanternLogic.ts, starPathLogic.ts)

### Established Patterns
- Game components use AppCard, AppButton from design system
- Settings controlled via SettingsContext
- Translations via i18next
- Difficulty levels: easy (1-5), medium (1-10), hard (1-20)

### Integration Points
- Games already registered in HomeScreen.tsx GAMES array
- Routes already in ROUTE_MAP
- Only needs: enable by default, add visuals, verify accessibility

</code_context>

<specifics>
## Specific Ideas

- "Show dots like Montessori materials - simple, clear representations"
- "Letter items should be recognizable - apple for A, ball for B, cat for C"
- "These games work the same as others - same UI patterns, same accessibility"

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 01-complete-learning-games*
*Context gathered: 2026-03-03*
