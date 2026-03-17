import { reconcileAnalyticsConsent } from './analytics';
import { reconcileSentryConsent } from './sentry';
import { reconcileObservability } from './observabilityBootstrap';

jest.mock('./analytics', () => ({
  reconcileAnalyticsConsent: jest.fn(() => Promise.resolve()),
}));

jest.mock('./sentry', () => ({
  reconcileSentryConsent: jest.fn(() => Promise.resolve()),
}));

describe('reconcileObservability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not initialize analytics or Sentry when telemetry is disabled', async () => {
    await reconcileObservability(false);

    expect(reconcileAnalyticsConsent).toHaveBeenCalledWith(false);
    expect(reconcileSentryConsent).toHaveBeenCalledWith(false);
  });

  it('initializes analytics and Sentry when telemetry is enabled', async () => {
    await reconcileObservability(true);

    expect(reconcileAnalyticsConsent).toHaveBeenCalledWith(true);
    expect(reconcileSentryConsent).toHaveBeenCalledWith(true);
  });
});
