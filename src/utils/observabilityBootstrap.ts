import { reconcileAnalyticsConsent } from './analytics';
import { reconcileSentryConsent } from './sentry';

export async function reconcileObservability(telemetryEnabled: boolean): Promise<void> {
  const results = await Promise.allSettled([
    reconcileSentryConsent(telemetryEnabled),
    reconcileAnalyticsConsent(telemetryEnabled),
  ]);

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failures.length > 0) {
    throw new Error(
      failures
        .map((failure) =>
          failure.reason instanceof Error ? failure.reason.message : String(failure.reason),
        )
        .join('; '),
    );
  }
}
