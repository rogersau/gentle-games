import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for production error monitoring.
 * 
 * Per project decisions:
 * - Production only: dev/staging errors stay local
 * - 100% sampling: capture all errors (rely on low volume)
 * - Early initialization: called before React mounts
 */
export function initSentry(): void {
  // Only initialize in production to respect free tier and keep dev clean
  if (__DEV__) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // 100% sampling per decision (rely on low volume, not sampling)
    sampleRate: 1.0,
    
    // Environment identification
    environment: 'production',
    
    // Enable native crash reporting
    enableNativeCrashHandling: true,
    
    // Debug mode (disabled in production)
    debug: false,
    
    // Before-send hook for privacy filtering (preparation for SENTRY-05)
    beforeSend(event) {
      // Strip PII - will be expanded in error boundaries plan
      if (event.exception) {
        // Ensure no user-identifiable info in error messages
        const sanitize = (str: string): string => {
          // Remove potential PII patterns
          return str
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
            .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
        };
        
        event.exception.values?.forEach(value => {
          if (value.value) {
            value.value = sanitize(value.value);
          }
        });
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
