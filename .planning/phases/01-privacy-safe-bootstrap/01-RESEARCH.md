# Phase 1: Privacy-Safe Bootstrap - Research

**Researched:** 2026-03-17
**Domain:** Privacy-safe observability bootstrap, consent-gated telemetry, and guarded external links in an Expo/React Native app
**Confidence:** MEDIUM

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                          | Research Support                                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PRIV-01 | Parent can review and change a telemetry preference for analytics and crash reporting from within app settings       | Add `telemetryEnabled` to `Settings`, sanitize/persist it in `SettingsContext`, and expose it with the existing `SettingToggle` pattern in `SettingsScreen` using i18n strings.            |
| PRIV-02 | App does not send analytics or crash telemetry until the telemetry preference for that install is explicitly enabled | Replace module-load `initSentry()` / `initAnalytics()` with an explicit bootstrap gate that waits for `SettingsContext.isLoading === false` before any observability initialization.       |
| PRIV-03 | Crash and analytics events only send allowlisted diagnostic fields and exclude free-form user content                | Centralize capture through `analytics.ts` and `sentry.ts`, use allowlisted event property shaping, and use Sentry `beforeSend` / `beforeBreadcrumb` to drop or rewrite anything free-form. |
| PRIV-04 | User receives a calm fallback message if an external support or privacy link cannot be opened                        | Replace direct `Linking.openURL(...)` in `HomeScreen` with a guarded helper plus an in-app modal/message using existing calm UI patterns.                                                  |
| STAB-02 | App startup services initialize from an explicit bootstrap flow after required settings state is available           | Introduce a dedicated bootstrap component/module under the app shell so startup ordering is explicit, testable, and non-blocking on observability failures.                                |

</phase_requirements>

## Summary

This phase should be planned as a focused startup-orchestration and privacy-hardening change, not as a broad telemetry redesign. The repository already has the right seams: `SettingsContext` owns persisted preferences, `App.tsx` is the composition root, `analytics.ts` and `sentry.ts` centralize observability, and `AppModal` provides a calm fallback surface. The main problem is ordering: `App.tsx` currently runs `initSentry()` and `initAnalytics()` at module load, before persisted settings are available, so a cold start cannot respect consent from the first frame.

The safest implementation pattern is a small explicit bootstrap gate inside the provider tree. It should wait for `SettingsContext` to finish loading, then reconcile the desired telemetry state exactly once per state change: initialize analytics/Sentry only if consent is enabled, degrade gracefully if either init fails, and always continue to the app shell. For runtime transitions, the strongest recommendation is to make changes take effect immediately: PostHog supports persisted `optIn()` / `optOut()`, and Sentry can be kept behind a consent flag enforced by wrapper functions plus `beforeSend` / `beforeBreadcrumb`.

Data minimization needs more than the current regex scrubbing. The highest-risk path today is Sentry error reporting from `GentleErrorBoundary`, which sends `componentStack` and breadcrumb data that are not allowlisted. Planning should therefore include centralizing error capture behind `src/utils/sentry.ts`, dropping or rewriting free-form fields, and keeping analytics payloads flat and tiny. The external-link work is intentionally narrow: replace the single audited `Linking.openURL('https://gentlegames.org')` call with a guarded helper and a gentle in-app fallback message.

**Primary recommendation:** Build a centralized consent-aware bootstrap gate after settings load, then route all telemetry and the audited external link through narrow allowlisted helpers.

## Standard Stack

### Core

| Library                                     | Version    | Purpose                                   | Why Standard                                                                                                          |
| ------------------------------------------- | ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Expo                                        | `~54.0.33` | App runtime/build tooling                 | Already the app shell and platform abstraction in use.                                                                |
| React Native                                | `0.81.5`   | Native/web UI runtime                     | Provides `Linking`, platform APIs, and current screen infrastructure.                                                 |
| `@react-native-async-storage/async-storage` | `2.2.0`    | Persist settings and anonymous install ID | Already used by `SettingsContext` and `sentry.ts`; no new persistence layer needed.                                   |
| `@sentry/react-native`                      | `^8.2.0`   | Crash/error monitoring                    | Already integrated; supports global event filtering via `beforeSend` and breadcrumb filtering via `beforeBreadcrumb`. |
| `posthog-react-native`                      | `^4.37.1`  | Product analytics                         | Already integrated; supports persisted privacy state via `optIn()` / `optOut()`.                                      |

### Supporting

| Library                                                           | Version                | Purpose                        | When to Use                                                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-navigation/native`                                        | `^7.1.28`              | Route state and screen changes | Keep using `NavigationContainer.onStateChange` for screen tracking; PostHog's own typings explicitly call out manual screen capture for React Navigation v7+. |
| `react-i18next` + `i18next`                                       | `^16.5.4` / `^25.8.13` | Localized parent-facing copy   | Required for the telemetry toggle label/description and link-failure fallback copy.                                                                           |
| Existing UI primitives (`AppModal`, `SettingToggle`, `AppButton`) | repo-local             | Calm, consistent UI            | Reuse for parent-safe consent copy and fallback messaging; avoid ad hoc alert styles.                                                                         |

### Alternatives Considered

| Instead of                                         | Could Use                                        | Tradeoff                                                                                               |
| -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Explicit bootstrap gate after settings load        | Module-load side effects in `App.tsx`            | Rejected: cannot honor persisted consent on cold start and is harder to test.                          |
| Existing settings toggle UI                        | Separate consent screen/modal                    | Rejected by phase decision; adds flow complexity and diverges from current parent settings model.      |
| Guarded `Linking` helper + `AppModal` fallback     | Direct `Linking.openURL(...)` in button handlers | Rejected: `canOpenURL` / `openURL` are async and failure-prone; UI needs a gentle fallback.            |
| Allowlist filters in shared observability wrappers | Regex scrubbing at individual call sites         | Rejected: misses direct SDK calls like `GentleErrorBoundary` and non-string breadcrumb/context fields. |

**Installation:**

```bash
npm install
```

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── context/SettingsContext.tsx      # Persist + sanitize telemetryEnabled
├── screens/SettingsScreen.tsx       # Parent-facing telemetry toggle
├── screens/HomeScreen.tsx           # Audited external link + calm fallback state
├── utils/observabilityBootstrap.ts  # Central consent-aware init/reconcile logic
├── utils/analytics.ts               # PostHog client lifecycle + allowlisted events
├── utils/sentry.ts                  # Sentry init + consent flag + allowlisted filtering
├── utils/externalLinks.ts           # Guarded openURL helper for the audited link
└── components/GentleErrorBoundary.tsx # Route crashes through the shared Sentry helper
```

### Pattern 1: Bootstrap Gate After Settings Load

**What:** Put observability startup behind a component/module that runs only after `SettingsContext` has loaded persisted state.

**When to use:** Always for app-start services whose behavior depends on persisted settings or consent.

**Example:**

```typescript
// Source: local repo patterns from App.tsx + SettingsContext.tsx
const BootstrapGate: React.FC = () => {
  const { settings, isLoading } = useSettings();
  const [bootstrapComplete, setBootstrapComplete] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    void reconcileObservability(settings.telemetryEnabled)
      .catch((error: unknown) => {
        console.warn('Observability bootstrap failed. Continuing without telemetry.', error);
      })
      .finally(() => {
        if (!cancelled) setBootstrapComplete(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, settings.telemetryEnabled]);

  if (isLoading || !bootstrapComplete) {
    return <StartupLoadingScreen />;
  }

  return <ParentTimerProvider><AppNavigator /></ParentTimerProvider>;
};
```

### Pattern 2: Keep Manual Screen Tracking for React Navigation v7+

**What:** Continue manual screen tracking from `NavigationContainer.onStateChange`; do not switch to PostHog automatic screen capture.

**When to use:** Any time PostHog remains in the stack with `@react-navigation/native` v7+.

**Example:**

```typescript
// Source: App.tsx + posthog-react-native@4.37.1 dist/types.d.ts
<PostHogProvider
  client={client}
  autocapture={{
    captureScreens: false, // PostHog docs/types: React Navigation v7+ should capture screens manually
    captureTouches: false, // keep touch autocapture off for privacy and sensory-friendly UX
  }}
>
  <NavigationContainer onStateChange={handleStateChange}>
    {children}
  </NavigationContainer>
</PostHogProvider>
```

### Pattern 3: Enforce Allowlists at the Wrapper Boundary

**What:** Use small shared helpers that accept only approved keys, and use SDK hooks to drop everything else.

**When to use:** All analytics events, breadcrumbs, and Sentry exception capture.

**Example:**

```typescript
// Source: Sentry React Native options docs + local sentry.ts/GentleErrorBoundary.tsx
Sentry.init({
  dsn,
  sendDefaultPii: false,
  beforeBreadcrumb(breadcrumb) {
    if (!telemetryConsentRef.current) return null;
    if (breadcrumb.category !== 'navigation' && breadcrumb.category !== 'user_action') {
      return null;
    }

    return {
      category: breadcrumb.category,
      level: breadcrumb.level,
      message: undefined,
      data: pickAllowlistedFields(breadcrumb.data, ['game', 'difficulty', 'screen']),
    };
  },
  beforeSend(event) {
    if (!telemetryConsentRef.current) return null;

    return {
      ...event,
      contexts: undefined, // drop free-form component stacks and other ad hoc context
      breadcrumbs: undefined, // or rebuild from allowlisted breadcrumbs only
      user: event.user?.id ? { id: event.user.id } : undefined,
    };
  },
});
```

### Pattern 4: Guard External Links and Return a Calm Result

**What:** Wrap `Linking.canOpenURL()` and `Linking.openURL()` in a helper that returns a simple result to the screen.

**When to use:** The audited `gentlegames.org` support/privacy path in this phase.

**Example:**

```typescript
// Source: React Native Linking docs + HomeScreen.tsx + AppModal.tsx
export async function openExternalUrl(url: string): Promise<'opened' | 'unsupported' | 'failed'> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return 'unsupported';

    await Linking.openURL(url);
    return 'opened';
  } catch {
    return 'failed';
  }
}
```

### Anti-Patterns to Avoid

- **Telemetry init at module scope:** `App.tsx` currently calls `initSentry()` and `initAnalytics()` before React mounts. That must be removed for consent-safe cold starts.
- **Direct SDK calls outside shared wrappers:** `GentleErrorBoundary` currently calls `Sentry.captureException(...)` directly, bypassing any future allowlist or consent logic.
- **Regex-only sanitization:** Current `sanitizeString()` in `sentry.ts` does not cover nested objects, breadcrumb data, or `componentStack`.
- **Scattered consent checks:** Do not add `if (settings.telemetryEnabled)` around arbitrary screens/components. Keep the decision in one bootstrap/observability layer.
- **Raw external-link errors in UI:** No `Alert.alert(error.message)` or raw exception text; keep fallback copy calm and parent-safe.

## Don't Hand-Roll

| Problem                         | Don't Build                                       | Use Instead                                                        | Why                                                                                                |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Consent persistence             | Separate storage key and bespoke persistence code | Existing `SettingsContext` default/sanitize/persist pipeline       | Keeps privacy preference alongside other parent settings and reuses current sanitization patterns. |
| Analytics opt-in/out state      | Custom boolean guards around every event call     | PostHog `optIn()` / `optOut()` plus a single shared client wrapper | SDK already persists opt state; central wrapper reduces drift.                                     |
| Sentry event filtering          | Ad hoc scrubbing in every capture site            | `beforeSend` / `beforeBreadcrumb` in `Sentry.init(...)`            | Global hooks cover exceptions and breadcrumbs, including unexpected paths.                         |
| Screen telemetry for navigation | Per-screen manual event calls                     | Existing `NavigationContainer.onStateChange` + `trackScreenView()` | Already aligned with current app architecture and PostHog React Navigation v7 guidance.            |
| Link failure UI                 | Inline `try/catch` in JSX handlers everywhere     | One helper returning a simple result + `AppModal` fallback         | Keeps async failure handling predictable and the copy consistent.                                  |
| Anonymous identity              | Device IDs, account IDs, or fingerprinting        | Existing random install ID approach                                | Meets privacy posture and current architecture.                                                    |

**Key insight:** The hard part in this phase is not adding a toggle; it is making startup ordering and telemetry boundaries impossible to bypass accidentally.

## Common Pitfalls

### Pitfall 1: Cold Start Sends Telemetry Before Consent Loads

**What goes wrong:** Module-load `initSentry()` / `initAnalytics()` run before `SettingsContext` reads AsyncStorage, so a previously disabled install can still send during boot.

**Why it happens:** Observability is initialized before persisted settings exist.

**How to avoid:** Render a bootstrap gate after `SettingsProvider` mounts, wait for `isLoading === false`, then reconcile telemetry state once.

**Warning signs:** Any top-level `void init...()` calls outside a component/effect; tests that don't distinguish "settings not loaded yet" from "telemetry disabled".

### Pitfall 2: PostHog Screen Tracking Is Reconfigured the Wrong Way

**What goes wrong:** A refactor turns on `captureScreens`, duplicates screen events, or breaks screen tracking under React Navigation v7.

**Why it happens:** `posthog-react-native@4.37.1` typings explicitly note that React Navigation v7+ should capture screens manually and keep `captureScreens` disabled.

**How to avoid:** Keep `captureScreens: false` and retain `NavigationContainer.onStateChange` + `trackScreenView()`.

**Warning signs:** Duplicate screen events, removal of `handleStateChange`, or code that wraps navigation with automatic tracking config.

### Pitfall 3: Regex Scrubbing Leaves Free-Form Data in Sentry

**What goes wrong:** Breadcrumb data, nested objects, and `contexts.react.componentStack` still contain unsanitized text even when top-level strings are scrubbed.

**Why it happens:** Current sanitization only rewrites string values on a shallow object path.

**How to avoid:** Move to explicit allowlists and drop free-form fields globally in `beforeSend` / `beforeBreadcrumb`.

**Warning signs:** Direct `Sentry.captureException(...)` calls, raw `error.message`, `componentStack`, or breadcrumb `message` strings being forwarded.

### Pitfall 4: Disable Toggle Stops New Events in UI but Not in Runtime

**What goes wrong:** The setting changes visually, but an already-initialized client continues to send until the next app launch.

**Why it happens:** Consent is persisted but not reconciled against live SDK instances.

**How to avoid:** Make `reconcileObservability(telemetryEnabled)` idempotent and call it when the setting changes. Recommended behavior: `posthog.optIn()` / `optOut()` immediately; Sentry uses a live consent flag plus init-on-enable.

**Warning signs:** Toggle tests assert storage writes only; no tests assert runtime capture/no-capture behavior after a change.

### Pitfall 5: `Linking.canOpenURL()` and `openURL()` Are Treated as Guaranteed

**What goes wrong:** Unsupported or rejected URLs fail silently or throw into the console without a calm fallback.

**Why it happens:** Both APIs are async and `canOpenURL()` can reject under platform restrictions.

**How to avoid:** Always `await` both calls inside a helper, catch rejection, and surface only a gentle in-app message.

**Warning signs:** Inline `onPress={() => Linking.openURL(...)}` handlers or fallback UI that exposes raw technical errors.

### Pitfall 6: i18n and Test Mocks Drift

**What goes wrong:** New setting labels/modal copy render as keys in tests or fail accessibility queries.

**Why it happens:** This repo uses real locale JSON plus a large manual translation mock in `jest.setup.ts`.

**How to avoid:** Update both locale JSON and the Jest translation mock when adding visible strings.

**Warning signs:** Tests asserting raw translation keys, or new accessibility labels not found in tests.

### Pitfall 7: SDK Defaults Quietly Increase Data Surface

**What goes wrong:** Even with small custom event payloads, the analytics SDK still contributes common app/device properties.

**Why it happens:** Unpacked `posthog-react-native@4.37.1` shows `getCommonEventProperties()` merges app properties and screen dimensions into events.

**How to avoid:** Keep advanced features off in this phase: no session replay, no touch autocapture, no app lifecycle capture, no custom person/group properties, no extra registration calls.

**Warning signs:** New calls to `register`, `group`, `alias`, session replay config, feature-flag person properties, or richer event builders.

## Code Examples

Verified patterns from official sources and repository evidence:

### Consent-Safe Bootstrap Reconciliation

```typescript
// Source: App.tsx + SettingsContext.tsx
export async function reconcileObservability(telemetryEnabled: boolean): Promise<void> {
  if (!telemetryEnabled) {
    disableSentryConsent();
    await disableAnalytics();
    return;
  }

  const installId = await getOrCreateInstallId();

  await initSentry({ installId, telemetryEnabled: true });
  await initAnalytics({ installId, telemetryEnabled: true });
}
```

### PostHog Privacy Controls

```typescript
// Source: posthog-react-native@4.37.1 dist/posthog-rn.d.ts + dist/types.d.ts
await posthog.optIn();  // persisted until optOut() or reset()
await posthog.optOut(); // persisted opt-out for future capture

// Keep screen tracking manual under React Navigation v7+
<PostHogProvider
  client={client}
  autocapture={{ captureScreens: false, captureTouches: false }}
>
  {children}
</PostHogProvider>
```

### Guarded External Link Flow

```typescript
// Source: React Native Linking docs + HomeScreen/AppModal patterns
const handleOpenWebsite = async () => {
  const result = await openExternalUrl('https://gentlegames.org');
  if (result !== 'opened') {
    setShowLinkFallback(true);
  }
};
```

### Sentry Error Capture Through a Shared Helper

```typescript
// Source: local GentleErrorBoundary.tsx + Sentry options docs
export function captureScreenError(error: Error, screen: string): void {
  if (!isTelemetryCaptureAllowed()) return;

  Sentry.captureException(error, {
    tags: { screen, errorBoundary: 'GentleErrorBoundary' },
  });
}
```

## State of the Art

| Old Approach                         | Current Approach                                                                      | When Changed                                      | Impact                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| Module-load telemetry init           | Explicit bootstrap after settings load                                                | Current best practice for this app phase          | Consent can be enforced from cold start.                        |
| Environment-only telemetry gating    | Consent + environment gating                                                          | Required by PRIV-01/02                            | Production builds no longer imply telemetry-on.                 |
| Regex-based string scrubbing         | Allowlisted event/breadcrumb shaping                                                  | Current privacy-hardening direction               | Reduces hidden free-form leakage paths.                         |
| Direct `Linking.openURL(...)` in UI  | Guarded helper + calm in-app fallback                                                 | Current phase requirement                         | External support/privacy path fails gently instead of abruptly. |
| Automatic screen capture assumptions | Manual `onStateChange` tracking with `captureScreens: false` for React Navigation v7+ | PostHog React Native 4.x / React Navigation 7 era | Avoids duplicate/broken screen telemetry.                       |

**Deprecated/outdated:**

- Top-level `void initSentry()` / `void initAnalytics()` in `App.tsx`: outdated for consent-aware startup.
- Direct `Sentry.captureException(...)` from `GentleErrorBoundary`: outdated once allowlisted consent-aware wrappers exist.
- Direct `Linking.openURL('https://gentlegames.org')` in `HomeScreen`: outdated once guarded external-link handling is added.

## Open Questions

1. **How should Sentry behave when telemetry is disabled after being enabled in the same session?**
   - What we know: PostHog exposes persisted `optIn()` / `optOut()`; Sentry docs clearly support `beforeSend` / `beforeBreadcrumb` filtering, but I did not verify a clean teardown/re-init lifecycle for this exact version.
   - What's unclear: Whether a full Sentry shutdown path is worth the complexity for this phase.
   - Recommendation: Do not plan a teardown feature. Plan immediate runtime disable by flipping a shared consent flag and dropping all future events in Sentry hooks and wrappers.

2. **How strict should the analytics allowlist be about SDK-added metadata?**
   - What we know: The PostHog SDK contributes common app/screen properties beyond the custom event payload.
   - What's unclear: Whether the requirement interpretation expects suppressing all SDK-added metadata or only app-authored free-form fields.
   - Recommendation: Plan to tightly allowlist app-authored fields and explicitly avoid enabling additional SDK features. Flag deeper SDK metadata suppression as a follow-up only if privacy review requires it.

3. **Should the app block first paint until bootstrap completes?**
   - What we know: Fonts already gate initial render; settings do not. Bootstrap failures must not block reaching home.
   - What's unclear: Whether the UI should wait for both settings load and bootstrap completion, or only settings load.
   - Recommendation: Wait for settings load and a single bootstrap reconciliation attempt. If bootstrap fails, continue immediately with telemetry off.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Jest 29 + `jest-expo` (`jest` declared in `package.json`)                                                                                                                                                                                 |
| Config file        | `jest.config.js`                                                                                                                                                                                                                          |
| Quick run command  | `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx src/screens/HomeScreen.test.tsx src/utils/analytics.test.ts src/utils/analytics-fallback.test.ts src/utils/sentry.test.ts App.test.tsx` |
| Full suite command | `npm run test:ci && npm run typecheck`                                                                                                                                                                                                    |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                       | Test Type        | Automated Command                                                                                                                    | File Exists? |
| ------- | ------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| PRIV-01 | Telemetry preference is visible, persisted, and changeable from Settings       | integration      | `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx`                                   | ✅           |
| PRIV-02 | No analytics/Sentry init or capture before explicit consent                    | integration      | `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts src/utils/analytics.test.ts src/utils/sentry.test.ts` | ❌ Wave 0    |
| PRIV-03 | Telemetry payloads are allowlisted and exclude free-form content               | unit/integration | `npm test -- --runInBand src/utils/analytics.test.ts src/utils/sentry.test.ts src/components/GentleErrorBoundary.test.tsx`           | ✅           |
| PRIV-04 | Failed external link shows calm in-app fallback                                | integration      | `npm test -- --runInBand src/screens/HomeScreen.test.tsx src/utils/externalLinks.test.ts`                                            | ❌ Wave 0    |
| STAB-02 | Startup services run from explicit bootstrap flow after settings are available | integration      | `npm test -- --runInBand App.test.tsx src/utils/observabilityBootstrap.test.ts`                                                      | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm test -- --runInBand src/context/SettingsContext.test.tsx src/screens/SettingsScreen.test.tsx src/screens/HomeScreen.test.tsx src/utils/analytics.test.ts src/utils/sentry.test.ts`
- **Per wave merge:** `npm run test:ci && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/utils/observabilityBootstrap.test.ts` — covers PRIV-02 and STAB-02 startup ordering and consent gating
- [ ] `src/utils/externalLinks.test.ts` — covers PRIV-04 guarded link outcomes (`opened`, `unsupported`, `failed`)
- [ ] Extend `App.test.tsx` so it verifies actual bootstrap ordering rather than only conditional `PostHogProvider` rendering
- [ ] Extend `src/components/GentleErrorBoundary.test.tsx` to assert the boundary routes through the shared consent-aware Sentry helper
- [ ] Framework install: `npm install` — `node_modules/` is absent and `jest` is currently unavailable in this workspace

## Sources

### Primary (HIGH confidence)

- Local repo: `App.tsx` — current startup order, PostHogProvider usage, manual screen tracking
- Local repo: `src/context/SettingsContext.tsx` — persisted settings load/sanitize pattern and `isLoading`
- Local repo: `src/screens/SettingsScreen.tsx` — existing toggle-based parent settings UI
- Local repo: `src/screens/HomeScreen.tsx` — current direct external-link call and fallback integration point
- Local repo: `src/utils/analytics.ts` — current PostHog init and event wrappers
- Local repo: `src/utils/sentry.ts` — current install ID pattern and shallow sanitization
- Local repo: `src/components/GentleErrorBoundary.tsx` — direct Sentry capture path and `componentStack` exposure
- Local repo: `src/ui/components/AppModal.tsx` — calm existing fallback UI pattern
- Local repo: `package.json` — installed stack versions used for this phase
- Official docs: https://posthog.com/docs/libraries/react-native — React Native SDK configuration and privacy methods
- Verified package inspection: unpacked `posthog-react-native@4.37.1` `dist/posthog-rn.d.ts`, `dist/types.d.ts`, and `dist/posthog-rn.js` — `optIn()` / `optOut()`, manual screen capture guidance for React Navigation v7+, and common event properties behavior
- Official docs: https://docs.sentry.io/platforms/react-native/configuration/options/ — `sendDefaultPii`, `beforeSend`, `beforeBreadcrumb`
- Official docs: https://reactnative.dev/docs/linking — `canOpenURL()` / `openURL()` async behavior and failure handling

### Secondary (MEDIUM confidence)

- npm registry metadata via `npm view` for `posthog-react-native`, `@sentry/react-native`, and `@react-navigation/native` — current published versions and project homepages

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - repository versions plus official docs and unpacked package typings agree
- Architecture: HIGH - based on direct repo inspection of `App.tsx`, providers, screens, and utilities
- Pitfalls: MEDIUM - strongly evidenced by local code and official docs, but Sentry runtime disable semantics are not fully verified beyond hook-based filtering

**Research date:** 2026-03-17
**Valid until:** 2026-03-31
