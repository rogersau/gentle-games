import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Sentry DSN from Expo Constants (set in app.config.js extra)
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const SENTRY_DEBUG = Constants.expoConfig?.extra?.sentryDebug as boolean | undefined;
const INSTALL_ID_KEY = '@gentle_games_install_id';

// Enable Sentry in dev mode when SENTRY_DEBUG is true
const isSentryEnabled = !__DEV__ || SENTRY_DEBUG === true;

// Export for use in other components
export { isSentryEnabled };

/**
 * Generate a random install ID for session correlation without PII.
 * Persists in AsyncStorage to maintain ID across app restarts.
 */
async function getInstallId(): Promise<string | null> {
  try {
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (!installId) {
      // Generate random ID (not derived from any device info)
      installId = `install_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
    }
    return installId;
  } catch {
    // Fail silently - error monitoring shouldn't break the app
    return null;
  }
}

/**
 * Set the current game context for error reporting.
 * Called when user navigates to a game screen.
 */
export function setGameContext(gameName: string, difficulty?: string): void {
  if (!isSentryEnabled) {
    console.log('[Sentry] Skipping setGameContext - disabled');
    return;
  }

  Sentry.setContext('game', {
    name: gameName,
    difficulty: difficulty || 'not_set',
    timestamp: new Date().toISOString(),
  });

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Started game: ${gameName}`,
    level: 'info',
    data: {
      game: gameName,
      difficulty: difficulty || 'not_set',
    },
  });
}

/**
 * Clear game context when leaving a game.
 */
export function clearGameContext(): void {
  if (!isSentryEnabled) {
    console.log('[Sentry] Skipping clearGameContext - disabled');
    return;
  }

  Sentry.setContext('game', null);
}

/**
 * Add an action breadcrumb for detailed debugging.
 * Tracks user actions without PII.
 */
export function addActionBreadcrumb(
  action: string,
  category: string = 'user_action',
  data?: Record<string, unknown>
): void {
  if (!isSentryEnabled) {
    console.log('[Sentry] Skipping breadcrumb - disabled:', action);
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message: action,
    level: 'info',
    data: data ? sanitizeData(data) : undefined,
  });
}

/**
 * Sanitize data to remove potential PII before sending.
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize string to remove PII patterns.
 */
function sanitizeString(str: string): string {
  return str
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'); // Social Security Number pattern
}

/**
 * Initialize Sentry for production error monitoring.
 */
export async function initSentry(): Promise<void> {
  // Only initialize in production unless SENTRY_DEBUG is enabled
  if (!isSentryEnabled) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error monitoring disabled.');
    return;
  }

  try {
    // Get or create install ID for session correlation
    const installId = await getInstallId();

    Sentry.init({
      dsn: SENTRY_DSN,
      sampleRate: 1.0,
      environment: __DEV__ ? 'development' : 'production',
      debug: __DEV__,

      // Set privacy-safe user ID (random, not tied to identity)
      initialScope: {
        user: installId ? { id: installId } : undefined,
      },

      beforeSend(event) {
        // Sanitize all string values in the event
        if (event.message) {
          event.message = sanitizeString(event.message);
        }

        if (event.exception?.values) {
          event.exception.values.forEach(value => {
            if (value.value) {
              value.value = sanitizeString(value.value);
            }
          });
        }

        // Ensure no user data beyond the random ID
        if (event.user) {
          event.user = {
            id: event.user.id,
          };
        }

        return event;
      },
    });

    // Share install ID with PostHog for consistent anonymous identification
    if (installId) {
      const { setAnalyticsUser } = await import('./analytics');
      setAnalyticsUser(installId);
    }
  } catch (error) {
    console.warn('[Sentry] Initialization failed:', error);
    throw error;
  }
}

/**
 * Check if Sentry is initialized and ready.
 */
export function isSentryInitialized(): boolean {
  return isSentryEnabled && !!SENTRY_DSN;
}

/**
 * Test Sentry by sending a test error.
 * Use this to verify Sentry is working in development.
 */
export async function testSentry(): Promise<void> {
  if (!isSentryEnabled || !SENTRY_DSN) {
    console.log('[Sentry] Cannot test - Sentry is disabled or DSN not configured.');
    return;
  }

  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Manual test triggered',
    level: 'info',
  });

  Sentry.captureException(new Error('Test error from development'));
  Sentry.captureMessage('Test message from development', 'info');

  try {
    const flushResult = await (Sentry as unknown as { flush: (timeout?: number) => Promise<boolean> }).flush(2000);
    console.log('[Sentry] Test complete. Flush result:', flushResult);
  } catch (error) {
    console.warn('[Sentry] Flush failed:', error);
  }
}

