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

  it('keeps screen tracking as a safe no-op until telemetry is enabled', async () => {
    const analytics = require('./analytics');

    analytics.trackScreenView('Home');

    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockScreen).not.toHaveBeenCalled();

    await analytics.reconcileAnalyticsConsent(false);

    expect(MockPostHog).not.toHaveBeenCalled();
    expect(mockOptOut).not.toHaveBeenCalled();
  });

  it('tracks screen navigation without child performance events or properties', async () => {
    const analytics = require('./analytics');

    await analytics.reconcileAnalyticsConsent(true);
    analytics.trackScreenView('Home');

    expect(mockOptIn).toHaveBeenCalledTimes(1);
    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockScreen).toHaveBeenCalledWith('Home');
  });

  it('identifies a pending install ID once after client creation and opts out after disable', async () => {
    const analytics = require('./analytics');

    analytics.setAnalyticsUser('install_pending');
    await analytics.reconcileAnalyticsConsent(true);
    await analytics.reconcileAnalyticsConsent(false);

    expect(MockPostHog).toHaveBeenCalledTimes(1);
    expect(mockIdentify).toHaveBeenCalledTimes(1);
    expect(mockIdentify).toHaveBeenCalledWith('install_pending');
    expect(mockOptIn).toHaveBeenCalledTimes(1);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
  });
});
