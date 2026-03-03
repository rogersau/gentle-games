# Phase 3: Error Monitoring - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Sentry error logging using free tier for production monitoring. Configure SDK, error boundaries, source maps, and privacy settings. Also officially remove LetterLantern and StarPath games from the codebase (files were deleted post-v1.0, now cleaning up all references).

</domain>

<decisions>
## Implementation Decisions

### Sentry Configuration
- **Cloud hosted** (sentry.io) - managed service with generous free tier
- **Production only** - dev/staging errors stay local, respects free tier limits
- **100% sampling** - capture all errors (not sampling, rely on low volume)
- **Early initialization** - before React mounts, catches startup errors
- **Automatic source maps** - upload on every build via CI/build scripts

### Error Boundaries
- **Per-screen boundaries** - each screen isolated, one crash doesn't take down others
- **Gentle error screen** - child-friendly fallback UI consistent with app tone
- **Home button only** - simple recovery action, navigate back to safety
- **All errors** - report both crashes (error boundaries) and non-fatal async errors

### Privacy & Data Handling
- **Random ID per install** - allows session correlation without PII
- **Game name + difficulty** - include current game and difficulty level in context
- **All actions breadcrumbs** - detailed action history for debugging
- **Strip PII patterns** - auto-remove emails, phone numbers, credit cards

### Cleanup Approach (LetterLantern/StarPath)
- **Delete entirely** - remove all game files (screens, logic, assets)
- **Remove routes** - delete from navigation stack definitions
- **Remove types** - delete all game-specific TypeScript interfaces
- **Remove all** - constants, translations, images - complete removal

### Claude's Discretion
- Exact error boundary implementation pattern
- Specific PII regex patterns for sanitization
- How to handle games list filtering (remove vs filter)
- Build script integration for source maps

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ErrorBoundary pattern** - React's componentDidCatch, can wrap existing patterns
- **SettingsContext** - for any opt-out preferences (not needed per decisions)
- **Navigation structure** - Stack.Navigator in App.tsx, easy to modify routes
- **HomeScreen games list** - GAMES array, filter or remove entries

### Established Patterns
- **Expo/React Native** - Sentry has @sentry/react-native package
- **TypeScript strict** - type-safe error handling
- **Offline-first** - errors queue when offline, send when connected
- **i18next** - translation keys exist for the games being removed

### Integration Points
- **App.tsx** - Sentry initialization happens here, before App component
- **Stack.Navigator** - route definitions for games to remove
- **types/index.ts** - game state types to clean up
- **constants/games.ts** or similar - game configuration arrays
- **locales/en.json** - translation keys for removed games
- **src/screens/** - screen files to delete

### Technical Notes
- No existing error monitoring in codebase
- LetterLanternScreen.tsx and StarPathScreen.tsx have import errors (dependencies already deleted)
- Games currently referenced in home screen and navigation
- AsyncStorage already used - could store random ID there

</code_context>

<specifics>
## Specific Ideas

- "Gentle error screen" - keep the app's calm, child-friendly tone even when things go wrong
- Error screen should not be scary or alarming for children
- Complete removal of games - don't leave dead code or references
- Privacy is critical - this app serves children, zero PII tolerance

</specifics>

<deferred>
## Deferred Ideas

- **Internationalization** - Phase 4 will add Spanish/French translations
- **Smart sampling** - if we hit free tier limits later, implement intelligent sampling
- **User opt-out** - currently auto-opt-in for production, could add setting later
- **Performance monitoring** - transactions/tracing not in scope, focus on errors only
- **LetterLantern/StarPath restoration** - explicitly decided against restoring

</deferred>

---

*Phase: 03-error-monitoring*
*Context gathered: 2026-03-03*
