import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const SENTRY_DEBUG = Constants.expoConfig?.extra?.sentryDebug as boolean | undefined;
const SENTRY_RELEASE = Constants.expoConfig?.extra?.sentryRelease as string | undefined;
const INSTALL_ID_KEY = '@gentle_games_install_id';

const ALLOWED_DIAGNOSTIC_KEYS = new Set([
  'action',
  'boundary',
  'category',
  'difficulty',
  'game',
  'screen',
  'setting',
  'status',
  'value',
]);

const ALLOWED_TAG_KEYS = new Set(['error_boundary', 'screen']);

const isPrimitiveDiagnosticValue = (value: unknown): value is string | number | boolean =>
  ['string', 'number', 'boolean'].includes(typeof value);

const isSentryEnabled = !__DEV__ || SENTRY_DEBUG === true;

export { isSentryEnabled };

let telemetryEnabled = false;
let sentryInitialized = false;
let consentVersion = 0;
let consentQueue: Promise<void> = Promise.resolve();

function sanitizeDiagnosticData(
  data?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!data) {
    return undefined;
  }

  const sanitized = Object.entries(data).reduce<Record<string, string | number | boolean>>(
    (accumulator, [key, value]) => {
      if (ALLOWED_DIAGNOSTIC_KEYS.has(key) && isPrimitiveDiagnosticValue(value)) {
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

function sanitizeTags(
  tags?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!tags) {
    return undefined;
  }

  const sanitized = Object.entries(tags).reduce<Record<string, string | number | boolean>>(
    (accumulator, [key, value]) => {
      if (ALLOWED_TAG_KEYS.has(key) && isPrimitiveDiagnosticValue(value)) {
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

function sanitizeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (!telemetryEnabled) {
    return null;
  }

  return {
    category: breadcrumb.category,
    type: breadcrumb.type,
    level: breadcrumb.level,
    data: sanitizeDiagnosticData(breadcrumb.data as Record<string, unknown> | undefined),
  };
}

function sanitizeFrameFilename(filename?: string): string | undefined {
  const path = filename?.split(/[?#]/)[0];
  // The SDK normalizes bundle names to app:/// URLs for source-map lookup.
  // Preserve that scheme while removing filesystem paths from other frames.
  return path?.startsWith('app:///') ? path : path?.split(/[\\/]/).pop();
}

function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (!telemetryEnabled) {
    return null;
  }

  return {
    ...event,
    message: undefined,
    user: undefined,
    request: undefined,
    logentry: undefined,
    transaction: undefined,
    threads: undefined,
    tags: sanitizeTags(event.tags as Record<string, unknown> | undefined),
    contexts: undefined,
    extra: undefined,
    breadcrumbs: event.breadcrumbs
      ?.map((breadcrumb) => sanitizeBreadcrumb(breadcrumb))
      .filter((breadcrumb): breadcrumb is Sentry.Breadcrumb => breadcrumb !== null),
    exception: event.exception?.values
      ? {
          ...event.exception,
          values: event.exception.values.map((value) => ({
            type: value.type,
            mechanism: value.mechanism
              ? { type: value.mechanism.type, handled: value.mechanism.handled }
              : undefined,
            value: undefined,
            // Keep source locations for debugging, but discard runtime variables
            // and source snippets, which can contain user content.
            stacktrace: value.stacktrace
              ? {
                  frames: value.stacktrace.frames?.map((frame) => ({
                    filename: sanitizeFrameFilename(frame.filename),
                    function: frame.function,
                    lineno: frame.lineno,
                    colno: frame.colno,
                    in_app: frame.in_app,
                  })),
                }
              : undefined,
          })),
        }
      : event.exception,
  };
}

export function reconcileSentryConsent(enabled: boolean): Promise<void> {
  telemetryEnabled = enabled && isSentryEnabled;
  const version = ++consentVersion;
  const shouldClose = !telemetryEnabled && sentryInitialized;
  if (shouldClose) {
    sentryInitialized = false;
    activeSentryVersion = 0;
    // Stop SDK captures as soon as consent changes, before awaiting close().
    const client = Sentry.getClient();
    if (client) client.getOptions().enabled = false;
    Sentry.setUser(null);
  }

  consentQueue = consentQueue
    .catch(() => undefined)
    .then(async () => {
      if (shouldClose) {
        try {
          await Sentry.close();
        } finally {
          Sentry.getCurrentScope().clear();
          Sentry.getIsolationScope().clear();
          Sentry.getCurrentScope().setClient(undefined);
        }
      }
      // Remove the identity saved by earlier versions. Crash reports no longer
      // need a persistent user, and analytics uses its own in-memory identity.
      await AsyncStorage.removeItem(INSTALL_ID_KEY).catch(() => undefined);
      if (version !== consentVersion || !telemetryEnabled || sentryInitialized) return;

      if (!SENTRY_DSN) {
        console.warn('[Sentry] DSN not configured. Error monitoring disabled.');
        return;
      }

      Sentry.init({
        dsn: SENTRY_DSN,
        sampleRate: 1.0,
        environment: __DEV__ ? 'development' : 'production',
        release: SENTRY_RELEASE,
        debug: SENTRY_DEBUG === true,
        sendDefaultPii: false,
        enableAutoSessionTracking: false,
        initialScope: { user: undefined },
        beforeSend: (event) =>
          version === activeSentryVersion && telemetryEnabled ? sanitizeEvent(event) : null,
        beforeBreadcrumb: (breadcrumb) =>
          version === activeSentryVersion && telemetryEnabled
            ? sanitizeBreadcrumb(breadcrumb)
            : null,
      });
      activeSentryVersion = version;
      Sentry.setUser(null);
      sentryInitialized = true;
    });
  return consentQueue;
}

let activeSentryVersion = 0;

export function isSentryInitialized(): boolean {
  return telemetryEnabled && sentryInitialized && !!SENTRY_DSN;
}

export function setGameContext(gameName: string, difficulty?: string): void {
  if (!isSentryInitialized()) {
    return;
  }

  Sentry.setContext(
    'game',
    sanitizeDiagnosticData({
      game: gameName,
      difficulty: difficulty || 'not_set',
    }) ?? null,
  );

  addActionBreadcrumb('game_started', 'navigation', {
    game: gameName,
    difficulty: difficulty || 'not_set',
  });
}

export function clearGameContext(): void {
  if (!isSentryInitialized()) {
    return;
  }

  Sentry.setContext('game', null);
}

export function addActionBreadcrumb(
  action: string,
  category: string = 'user_action',
  data?: Record<string, unknown>,
): void {
  if (!isSentryInitialized()) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message: action,
    level: 'info',
    data: sanitizeDiagnosticData({
      action,
      category,
      ...data,
    }),
  });
}

export function captureScreenError(
  error: Error,
  context: { screen: string; boundary?: string },
): void {
  if (!isSentryInitialized()) {
    return;
  }

  const tags: Record<string, string> = {
    screen: context.screen,
  };

  if (context.boundary) {
    tags.error_boundary = context.boundary;
  }

  Sentry.captureException(error, {
    tags,
  });

  Sentry.addBreadcrumb({
    category: 'error',
    level: 'error',
    data: sanitizeDiagnosticData({
      screen: context.screen,
      boundary: context.boundary,
    }),
  });
}

export async function testSentry(): Promise<void> {
  if (!isSentryInitialized()) {
    console.log('[Sentry] Cannot test - Sentry is disabled or DSN not configured.');
    return;
  }

  addActionBreadcrumb('manual_test', 'test', {
    status: 'started',
  });

  Sentry.captureException(new Error('Test error from development'));

  try {
    const flushResult = await (
      Sentry as unknown as { flush: (timeout?: number) => Promise<boolean> }
    ).flush(2000);
    console.log('[Sentry] Test complete. Flush result:', flushResult);
  } catch (error) {
    console.warn('[Sentry] Flush failed:', error);
  }
}
