import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

// Get PostHog config from Expo Constants (set in app.config.js extra)
const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey as string | undefined;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const POSTHOG_DEBUG = Constants.expoConfig?.extra?.posthogDebug as boolean | undefined;

// Enable PostHog in production, or in dev when POSTHOG_DEBUG is true
const isAnalyticsEnabled = !__DEV__ || POSTHOG_DEBUG === true;

export { isAnalyticsEnabled };

let posthogClient: PostHog | null = null;

/**
 * Get the PostHog client instance.
 * Returns null if analytics is not initialized.
 */
export function getPostHogClient(): PostHog | null {
  return posthogClient;
}

/**
 * Initialize PostHog analytics.
 * Called once at app startup, alongside Sentry.
 */
export async function initAnalytics(): Promise<void> {
  if (!isAnalyticsEnabled) {
    return;
  }

  if (!POSTHOG_API_KEY) {
    console.warn('[Analytics] PostHog API key not configured. Analytics disabled.');
    return;
  }

  try {
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST || 'https://eu.i.posthog.com',
      // Flush every 20 events (default) to balance battery/network usage
      flushAt: 20,
      // Flush every 30 seconds
      flushInterval: 30000,
    });
    if (POSTHOG_DEBUG) {
      console.log('[Analytics] PostHog initialized in debug mode');
    }
  } catch (error) {
    console.warn('[Analytics] PostHog initialization failed:', error);
  }
}

/**
 * Set the anonymous user identity for PostHog.
 * Uses the same random install ID as Sentry for consistency.
 */
export function setAnalyticsUser(installId: string): void {
  if (!posthogClient) return;
  posthogClient.identify(installId);
}

/**
 * Track a custom event.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>,
): void {
  if (POSTHOG_DEBUG) {
    console.log(`[Analytics] Event captured: ${eventName}`, properties);
  }
  if (!posthogClient) return;
  posthogClient.capture(eventName, properties as Record<string, string | number | boolean>);
}

/**
 * Track a screen view.
 * Called from NavigationContainer.onStateChange.
 */
export function trackScreenView(screenName: string): void {
  if (POSTHOG_DEBUG) {
    console.log(`[Analytics] Screen view: ${screenName}`);
  }
  if (!posthogClient) return;
  posthogClient.screen(screenName);
}

/**
 * Track when a user starts a game.
 */
export function trackGameStart(
  gameName: string,
  difficulty?: string,
): void {
  trackEvent('game started', {
    game: gameName,
    difficulty: difficulty || 'not_set',
  });
}

/**
 * Track when a user completes a game.
 */
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

/**
 * Track a settings change.
 * Only tracks the setting name and new value, not PII.
 */
export function trackSettingsChange(
  settingName: string,
  newValue: string | number | boolean,
): void {
  trackEvent('setting changed', {
    setting: settingName,
    value: newValue,
  });
}
