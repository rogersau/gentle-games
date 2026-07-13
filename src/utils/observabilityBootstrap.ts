import { reconcileAnalyticsConsent } from './analytics';
import { reconcileSentryConsent } from './sentry';

export async function reconcileObservability(telemetryEnabled: boolean): Promise<void> {
  const results = await Promise.allSettled([
    reconcileSentryConsent(telemetryEnabled),
    reconcileAnalyticsConsent(telemetryEnabled),
  ]);

  const failures = results.reduce<string[]>((messages, result, index) => {
    if (result.status !== 'rejected') {
      return messages;
    }

    const source = index === 0 ? 'Sentry' : 'Analytics';
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);

    messages.push(`${source} unavailable`);

    if (reason && reason !== source) {
      messages[messages.length - 1] =
        `${source} unavailable${reason === `${source} unavailable` ? '' : `: ${reason}`}`;
    }

    return messages;
  }, []);

  if (failures.length > 0) {
    throw new Error(`Observability reconciliation failed: ${failures.join('; ')}`);
  }
}
