import { APP_ROUTES } from '../types/navigation';

describe('analytics consent lifecycle', () => {
  const mockScreen = jest.fn();
  const mockOptIn = jest.fn();
  const mockOptOut = jest.fn();
  const mockShutdown = jest.fn();
  const mockReset = jest.fn();
  const mockSetPersistedProperty = jest.fn();
  const MockPostHog = jest.fn((_key: string, _options: Record<string, any>) => ({
    screen: mockScreen,
    optIn: mockOptIn,
    optOut: mockOptOut,
    shutdown: mockShutdown,
    reset: mockReset,
    setPersistedProperty: mockSetPersistedProperty,
  }));

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockOptIn.mockResolvedValue(undefined);
    mockOptOut.mockResolvedValue(undefined);
    mockShutdown.mockResolvedValue(undefined);
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: { posthogApiKey: 'test-api-key', posthogDebug: true } } },
    }));
    jest.doMock('posthog-react-native', () => ({
      __esModule: true,
      default: MockPostHog,
      PostHogPersistedProperty: { Queue: 'queue' },
    }));
  });

  it('never initializes or captures without consent', async () => {
    const analytics = require('./analytics');
    analytics.trackScreenView(APP_ROUTES.Home);
    await analytics.reconcileAnalyticsConsent(false);
    expect(MockPostHog).not.toHaveBeenCalled();
    expect(mockScreen).not.toHaveBeenCalled();
    expect(analytics.getPostHogClient()).toBeNull();
  });

  it('uses an independent runtime identity with optional SDK network features disabled', async () => {
    const analytics = require('./analytics');
    await analytics.reconcileAnalyticsConsent(true);
    await analytics.reconcileAnalyticsConsent(true);
    analytics.trackScreenView(APP_ROUTES.Home);
    expect(MockPostHog).toHaveBeenCalledTimes(1);
    expect(MockPostHog).toHaveBeenCalledWith(
      'test-api-key',
      expect.objectContaining({
        persistence: 'memory',
        personProfiles: 'never',
        defaultOptIn: false,
        preloadFeatureFlags: false,
        disableRemoteConfig: true,
        disableSurveys: true,
        enableSessionReplay: false,
        captureAppLifecycleEvents: false,
      }),
    );
    expect(mockScreen).toHaveBeenCalledWith(APP_ROUTES.Home);
  });

  it('immediately blocks captures, discards queued events, and shuts down after opt-out', async () => {
    const analytics = require('./analytics');
    await analytics.reconcileAnalyticsConsent(true);
    const beforeSend = MockPostHog.mock.calls[0][1].before_send;
    expect(beforeSend({ event: '$screen' })).toEqual({ event: '$screen' });
    const disable = analytics.reconcileAnalyticsConsent(false);
    analytics.trackScreenView(APP_ROUTES.Game);
    expect(analytics.getPostHogClient()).toBeNull();
    expect(beforeSend({ event: '$screen' })).toBeNull();
    await disable;
    expect(mockScreen).not.toHaveBeenCalled();
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    expect(mockSetPersistedProperty).toHaveBeenCalledWith('queue', null);
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockShutdown).toHaveBeenCalledTimes(1);
    expect(mockSetPersistedProperty.mock.invocationCallOrder[0]).toBeLessThan(
      mockShutdown.mock.invocationCallOrder[0],
    );

    await analytics.reconcileAnalyticsConsent(true);
    expect(MockPostHog).toHaveBeenCalledTimes(2);
    expect(beforeSend({ event: '$screen' })).toBeNull();
  });

  it('cannot publish a client when consent is withdrawn during opt-in', async () => {
    let finishOptIn!: () => void;
    mockOptIn.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOptIn = resolve;
        }),
    );
    const analytics = require('./analytics');
    const enable = analytics.reconcileAnalyticsConsent(true);
    await Promise.resolve();
    await Promise.resolve();
    const disable = analytics.reconcileAnalyticsConsent(false);
    finishOptIn();
    await enable;
    await disable;
    expect(analytics.getPostHogClient()).toBeNull();
    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });

  it('still discards queued events and shuts down if SDK opt-out fails', async () => {
    const analytics = require('./analytics');
    await analytics.reconcileAnalyticsConsent(true);
    mockOptOut.mockRejectedValueOnce(new Error('opt-out failure'));
    await expect(analytics.reconcileAnalyticsConsent(false)).rejects.toThrow('opt-out failure');
    expect(analytics.getPostHogClient()).toBeNull();
    expect(mockSetPersistedProperty).toHaveBeenCalledWith('queue', null);
    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });
});
