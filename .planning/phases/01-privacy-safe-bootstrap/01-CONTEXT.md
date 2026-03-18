# Phase 1: Privacy-Safe Bootstrap - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers parent-controlled telemetry consent and privacy-safe startup observability defaults. It covers the settings model and UI for telemetry preference, startup sequencing so observability waits for sanitized settings, strict minimization of telemetry payloads, and calm fallback handling for failed external support/privacy links.

</domain>

<decisions>
## Implementation Decisions

### Telemetry Consent Model

- Add a persisted `telemetryEnabled` boolean to the shared `Settings` interface and sanitize it in `SettingsContext` using the existing boolean-setting pattern.
- Default telemetry consent to `false` for fresh installs so analytics and crash reporting stay off until a parent explicitly enables them.
- Expose the consent control in `SettingsScreen` using the existing toggle-style settings UI rather than a separate flow or modal.
- Treat telemetry consent as a parent-facing setting that can be changed in-app at any time and persists across launches.

### Startup Sequencing

- Move analytics and Sentry startup out of module-load side effects and into an explicit bootstrap flow that waits for settings to finish loading first.
- Keep startup resilient: telemetry initialization failures must not block the app from reaching the home experience.
- Read the persisted telemetry preference before initializing observability services so cold starts respect consent from the first frame onward.
- Keep the bootstrap logic centralized instead of scattering initialization checks through multiple screens or utilities.

### Telemetry Data Minimization

- Gate both analytics and Sentry initialization on explicit consent, not just environment flags.
- Preserve the existing anonymous install-ID approach rather than introducing device- or account-derived identity.
- Shift Sentry and analytics payload shaping toward allowlisted diagnostic fields and exclude free-form user-entered content.
- Prefer small, structured event payloads that mirror the current analytics event style instead of rich nested context objects.

### External Link Fallbacks

- Wrap external site launches in a guarded helper or handler instead of calling `Linking.openURL(...)` directly from UI event handlers.
- If link opening fails, show a calm, non-jarring fallback message inside the app using existing UI patterns.
- Keep the fallback wording parent-safe and gentle; do not surface raw technical errors to the user.
- Limit this phase to the currently audited external link path rather than inventing a broader link-management subsystem.

### Claude's Discretion

- Claude can choose the exact bootstrap module shape and naming as long as initialization clearly occurs after settings load.
- Claude can decide whether telemetry enable/disable transitions reinitialize services immediately or only affect future sessions, provided the requirements and success criteria remain satisfied.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/context/SettingsContext.tsx` already persists and sanitizes settings via `defaultSettings`, `sanitizeSettings`, and `updateSettings`.
- `src/screens/SettingsScreen.tsx` already renders parent-facing toggles and sliders using the established settings UI components.
- `src/ui/components/AppModal.tsx` and existing modal patterns on `src/screens/HomeScreen.tsx` provide a calm fallback surface for user-visible error states.
- `src/utils/analytics.ts` and `src/utils/sentry.ts` already centralize observability setup and event shaping.

### Established Patterns

- Shared preferences live in `SettingsContext` and are sanitized before use or persistence.
- App-level initialization is currently concentrated in `App.tsx`, with startup failures handled as non-blocking warnings rather than fatal errors.
- Analytics events use small structured payloads and Sentry already performs some string sanitization plus anonymous install-ID tracking.
- User-facing copy and controls should align with the app's sensory-friendly settings experience and i18n patterns.

### Integration Points

- `App.tsx` is the composition root that currently triggers `initSentry()`, `initAnalytics()`, splash handling, sounds, and providers.
- `src/types/index.ts` owns the `Settings` interface and any new persisted setting field must be added there.
- `src/context/SettingsContext.tsx` must be updated for defaults, sanitization, persistence, and any side effects tied to telemetry preference.
- `src/screens/SettingsScreen.tsx` and `src/screens/HomeScreen.tsx` are the main user-facing integration points for the new consent control and external-link fallback.

</code_context>

<specifics>
## Specific Ideas

Keep the telemetry experience explicitly parent-controlled, default-off, and aligned with the child-focused privacy posture described in `.planning/codebase/CONCERNS.md`. Preserve the current anonymous install ID pattern and avoid introducing any account- or device-derived identity.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>
