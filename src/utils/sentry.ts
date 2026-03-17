import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const SENTRY_DEBUG = Constants.expoConfig?.extra?.sentryDebug as boolean | undefined;
const INSTALL_ID_KEY = '@gentle_games_install_id';

const ALLOWED_DIAGNOSTIC_KEYS = new Set([
  'action',
  'boundary',
  'category',
  'difficulty',
  'duration_ms',
  'game',
  'score',
  'screen',
  'setting',
  'status',
  'value',
]);

const ALLOWED_TAG_KEYS = new Set([
  'error_boundary',
  'screen',
]);

const isPrimitiveDiagnosticValue = (
  value: unknown,
): value is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof value);

const isSentryEnabled = !__DEV__ || SENTRY_DEBUG === true;

export { isSentryEnabled };

let telemetryEnabled = false;
let sentryInitialized = false;

async function getInstallId(): Promise<string | null> {
  try {
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);

    if (!installId) {
      installId = `install_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
    }

    return installId;
  } catch {
    return null;
  }
}

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

function sanitizeBreadcrumb(
  breadcrumb: Sentry.Breadcrumb,
): Sentry.Breadcrumb | null {
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

function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (!telemetryEnabled) {
    return null;
  }

  return {
    ...event,
    message: undefined,
    user: event.user?.id ? { id: event.user.id } : undefined,
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
            ...value,
            value: undefined,
          })),
        }
      : event.exception,
  };
}

export async function reconcileSentryConsent(enabled: boolean): Promise<void> {
  telemetryEnabled = enabled && isSentryEnabled;

  if (!telemetryEnabled) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error monitoring disabled.');
    return;
  }

  if (sentryInitialized) {
    return;
  }

  try {
    const installId = await getInstallId();

    Sentry.init({
      dsn: SENTRY_DSN,
      sampleRate: 1.0,
      environment: __DEV__ ? 'development' : 'production',
      debug: SENTRY_DEBUG === true,
      initialScope: {
        user: installId ? { id: installId } : undefined,
      },
      beforeSend(event) {
        return sanitizeEvent(event);
      },
      beforeBreadcrumb(breadcrumb) {
        return sanitizeBreadcrumb(breadcrumb);
      },
    });

    if (installId) {
      Sentry.setUser({ id: installId });
      const { setAnalyticsUser } = require('./analytics') as typeof import('./analytics');
      setAnalyticsUser(installId);
    }

    sentryInitialized = true;
  } catch (error) {
    console.warn('[Sentry] Initialization failed:', error);
    throw error;
  }
}

export async function initSentry(): Promise<void> {
  await reconcileSentryConsent(true);
}

export function isSentryInitialized(): boolean {
  return telemetryEnabled && sentryInitialized && !!SENTRY_DSN;
}

export function setGameContext(gameName: string, difficulty?: string): void {
  if (!isSentryInitialized()) {
    return;
  }

  Sentry.setContext('game', sanitizeDiagnosticData({
    game: gameName,
    difficulty: difficulty || 'not_set',
  }) ?? null);

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
    const flushResult = await (Sentry as unknown as { flush: (timeout?: number) => Promise<boolean> }).flush(2000);
    console.log('[Sentry] Test complete. Flush result:', flushResult);
  } catch (error) {
    console.warn('[Sentry] Flush failed:', error);
  }
}
