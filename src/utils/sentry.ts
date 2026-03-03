import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Sentry DSN from Expo Constants (set in app.config.js extra)
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const INSTALL_ID_KEY = '@gentle_games_install_id';

/**
 * Generate a random install ID for session correlation without PII.
 * Persists in AsyncStorage to maintain ID across app restarts.
 */
async function getInstallId(): Promise<string | null> {
  try {
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (!installId) {
      // Generate random ID (not derived from any device info)
      installId = `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  if (__DEV__) return;
  
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
  if (__DEV__) return;
  
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
  if (__DEV__) return;
  
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
  // Only initialize in production to respect free tier and keep dev clean
  if (__DEV__) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  // Get or create install ID for session correlation
  const installId = await getInstallId();

  Sentry.init({
    dsn: SENTRY_DSN,
    sampleRate: 1.0,
    environment: 'production',
    enableNativeCrashHandling: true,
    debug: false,
    
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
        // Only allow the install ID, remove everything else
        event.user = {
          id: event.user.id,
        };
      }
      
      return event;
    },
  });
}

/**
 * Check if Sentry is initialized and ready.
 */
export function isSentryInitialized(): boolean {
  return !__DEV__ && !!SENTRY_DSN;
}
