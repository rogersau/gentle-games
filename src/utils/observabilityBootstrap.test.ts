import { initAnalytics } from './analytics';
import { initSentry } from './sentry';
import { reconcileObservability } from './observabilityBootstrap';

jest.mock('./analytics', () => ({
  initAnalytics: jest.fn(() => Promise.resolve()),
}));

jest.mock('./sentry', () => ({
  initSentry: jest.fn(() => Promise.resolve()),
}));

describe('reconcileObservability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not initialize analytics or Sentry when telemetry is disabled', async () => {
    await reconcileObservability(false);

    expect(initAnalytics).not.toHaveBeenCalled();
    expect(initSentry).not.toHaveBeenCalled();
  });

  it('initializes analytics and Sentry when telemetry is enabled', async () => {
    await reconcileObservability(true);

    expect(initAnalytics).toHaveBeenCalledTimes(1);
    expect(initSentry).toHaveBeenCalledTimes(1);
  });
});
