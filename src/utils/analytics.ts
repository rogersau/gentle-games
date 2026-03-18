import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey as string | undefined;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const POSTHOG_DEBUG = Constants.expoConfig?.extra?.posthogDebug as boolean | undefined;

const ANALYTICS_PROPERTY_ALLOWLIST = new Set([
  'difficulty',
  'duration_ms',
  'game',
  'screen',
  'score',
  'setting',
  'value',
]);

const isPrimitiveDiagnosticValue = (
  value: unknown,
): value is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof value);

const isAnalyticsEnabled = !__DEV__ || POSTHOG_DEBUG === true;

export { isAnalyticsEnabled };

let posthogClient: PostHog | null = null;
let telemetryEnabled = false;
let pendingInstallId: string | null = null;

function sanitizeEventProperties(
  properties?: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> | undefined {
  if (!properties) {
    return undefined;
  }

  const sanitized = Object.entries(properties).reduce<Record<string, string | number | boolean>>(
    (accumulator, [key, value]) => {
      if (
        ANALYTICS_PROPERTY_ALLOWLIST.has(key) &&
        value !== undefined &&
        isPrimitiveDiagnosticValue(value)
      ) {
        accumulator[key] = value;
      }

      return accumulator;
    },
    {},
  );

  if (Object.keys(sanitized).length === 0) {
    return undefined;
  }

  return sanitized;
}

async function getOrCreatePostHogClient(): Promise<PostHog | null> {
  if (posthogClient) {
    return posthogClient;
  }

  if (!isAnalyticsEnabled) {
    return null;
  }

  if (!POSTHOG_API_KEY) {
    console.warn('[Analytics] PostHog API key not configured. Analytics disabled.');
    return null;
  }

  try {
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST || 'https://eu.i.posthog.com',
      flushAt: 20,
      flushInterval: 30000,
      defaultOptIn: false,
    });

    if (pendingInstallId) {
      posthogClient.identify(pendingInstallId);
    }

    return posthogClient;
  } catch (error) {
    console.warn('[Analytics] PostHog initialization failed:', error);
    posthogClient = null;
    return null;
  }
}

export function getPostHogClient(): PostHog | null {
  return telemetryEnabled ? posthogClient : null;
}

export async function reconcileAnalyticsConsent(enabled: boolean): Promise<void> {
  telemetryEnabled = enabled && isAnalyticsEnabled;

  if (!telemetryEnabled) {
    if (posthogClient) {
      await posthogClient.optOut();
    }
    return;
  }

  const hadExistingClient = !!posthogClient;
  const client = await getOrCreatePostHogClient();

  if (!client) {
    return;
  }

  if (pendingInstallId && hadExistingClient) {
    client.identify(pendingInstallId);
  }

  await client.optIn();
}

export async function initAnalytics(): Promise<void> {
  await reconcileAnalyticsConsent(true);
}

export function setAnalyticsUser(installId: string): void {
  pendingInstallId = installId;

  if (!telemetryEnabled || !posthogClient) {
    return;
  }

  posthogClient.identify(installId);
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>,
): void {
  if (!telemetryEnabled || !posthogClient) {
    return;
  }

  const sanitizedProperties = sanitizeEventProperties(properties);

  if (POSTHOG_DEBUG) {
    console.log(`[Analytics] Event captured: ${eventName}`, sanitizedProperties);
  }

  posthogClient.capture(eventName, sanitizedProperties);
}

export function trackScreenView(screenName: string): void {
  if (!telemetryEnabled || !posthogClient) {
    return;
  }

  if (POSTHOG_DEBUG) {
    console.log(`[Analytics] Screen view: ${screenName}`);
  }

  posthogClient.screen(screenName);
}

export function trackGameStart(
  gameName: string,
  difficulty?: string,
): void {
  trackEvent('game started', {
    game: gameName,
    difficulty: difficulty || 'not_set',
  });
}

export function trackGameComplete(
  gameName: string,
  durationMs?: number,
  score?: number,
): void {
  trackEvent('game completed', {
    game: gameName,
    duration_ms: durationMs,
    score,
  });
}

export function trackSettingsChange(
  settingName: string,
  newValue: string | number | boolean,
): void {
  trackEvent('setting changed', {
    setting: settingName,
    value: newValue,
  });
}
