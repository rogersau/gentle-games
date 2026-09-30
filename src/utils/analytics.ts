import PostHog, { PostHogPersistedProperty } from 'posthog-react-native';
import Constants from 'expo-constants';
import type { AppRouteName } from '../types/navigation';

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey as string | undefined;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const POSTHOG_DEBUG = Constants.expoConfig?.extra?.posthogDebug as boolean | undefined;

export const isAnalyticsEnabled = !__DEV__ || POSTHOG_DEBUG === true;

let posthogClient: PostHog | null = null;
let telemetryEnabled = false;
let consentVersion = 0;
let consentQueue: Promise<void> = Promise.resolve();

async function retireClient(client: PostHog): Promise<void> {
  try {
    await client.optOut();
  } finally {
    // reset() deliberately preserves the event queue. Discard it before shutdown,
    // which would otherwise flush events after consent has been withdrawn.
    client.setPersistedProperty(PostHogPersistedProperty.Queue, null);
    client.reset();
    await client.shutdown();
  }
}

export function getPostHogClient(): PostHog | null {
  return telemetryEnabled ? posthogClient : null;
}

export function reconcileAnalyticsConsent(enabled: boolean): Promise<void> {
  telemetryEnabled = enabled && isAnalyticsEnabled;
  const version = ++consentVersion;
  // Stop exposing the client immediately; serialize SDK shutdown and initialization.
  const retiredClient = !telemetryEnabled ? posthogClient : null;
  if (retiredClient) posthogClient = null;

  consentQueue = consentQueue
    .catch(() => undefined)
    .then(async () => {
      if (retiredClient) await retireClient(retiredClient);
      if (version !== consentVersion || !telemetryEnabled || posthogClient) return;

      if (!POSTHOG_API_KEY) {
        console.warn('[Analytics] PostHog API key not configured. Analytics disabled.');
        return;
      }

      let client: PostHog | null = null;
      try {
        client = new PostHog(POSTHOG_API_KEY, {
          host: POSTHOG_HOST || 'https://eu.i.posthog.com',
          flushAt: 20,
          flushInterval: 30000,
          defaultOptIn: false,
          // The SDK creates its own random identity for this runtime only. It is
          // never shared with crash reporting or persisted across launches.
          persistence: 'memory',
          personProfiles: 'never',
          preloadFeatureFlags: false,
          disableRemoteConfig: true,
          disableSurveys: true,
          enableSessionReplay: false,
          captureAppLifecycleEvents: false,
          before_send: (event) => (telemetryEnabled && posthogClient === client ? event : null),
        });
        await client.optIn();
        if (version !== consentVersion || !telemetryEnabled) {
          await retireClient(client);
          return;
        }
        posthogClient = client;
      } catch (error) {
        console.warn('[Analytics] PostHog initialization failed:', error);
        if (client) await retireClient(client);
      }
    });
  return consentQueue;
}

export function trackScreenView(screenName: AppRouteName): void {
  getPostHogClient()?.screen(screenName);
}
