describe('analytics consent-aware wrappers', () => {
  const mockIdentify = jest.fn();
  const mockCapture = jest.fn();
  const mockScreen = jest.fn();
  const mockOptIn = jest.fn(() => Promise.resolve());
  const mockOptOut = jest.fn(() => Promise.resolve());
  const MockPostHog = jest.fn(() => ({
    identify: mockIdentify,
    capture: mockCapture,
    screen: mockScreen,
    optIn: mockOptIn,
    optOut: mockOptOut,
  }));

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            posthogApiKey: 'test-api-key',
            posthogHost: 'https://test.posthog.com',
            posthogDebug: true,
          },
        },
      },
      expoConfig: {
        extra: {
          posthogApiKey: 'test-api-key',
          posthogHost: 'https://test.posthog.com',
          posthogDebug: true,
        },
      },
    }));

    jest.doMock('posthog-react-native', () => ({
      __esModule: true,
      default: MockPostHog,
    }));
  });

  it('keeps capture and screen tracking as safe no-ops until telemetry is enabled', async () => {
    const analytics = require('./analytics');

    analytics.trackEvent('game completed', { game: 'Memory Snap' });
    analytics.trackScreenView('Home');

    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockScreen).not.toHaveBeenCalled();

    await analytics.reconcileAnalyticsConsent(false);

    expect(MockPostHog).not.toHaveBeenCalled();
    expect(mockOptOut).not.toHaveBeenCalled();
  });

  it('only forwards allowlisted flat diagnostic properties and preserves manual screen tracking', async () => {
    const analytics = require('./analytics');

    await analytics.reconcileAnalyticsConsent(true);
    analytics.trackEvent('game completed', {
      game: 'Memory Snap',
      duration_ms: 1200,
      score: 4,
      debug_note: 'drop me',
      nested: { bad: true },
      rawMessage: 'drop me too',
    });
    analytics.trackScreenView('Home');

    expect(mockOptIn).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith('game completed', {
      game: 'Memory Snap',
      duration_ms: 1200,
      score: 4,
    });
    expect(mockScreen).toHaveBeenCalledWith('Home');
  });
});
