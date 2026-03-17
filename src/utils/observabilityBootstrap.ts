import { initAnalytics } from './analytics';
import { initSentry } from './sentry';

export async function reconcileObservability(telemetryEnabled: boolean): Promise<void> {
  if (!telemetryEnabled) {
    return;
  }

  const results = await Promise.allSettled([
    initSentry(),
    initAnalytics(),
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
