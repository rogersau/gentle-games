jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      posthogApiKey: 'test-key',
      posthogHost: 'test-host',
      posthogDebug: false,
    },
  },
}));

const originalDev = __DEV__;

describe('Analytics Fallbacks & robust initialization', () => {
  beforeAll(() => {
    // @ts-ignore
    global.__DEV__ = false;
  });

  afterAll(() => {
    // @ts-ignore
    global.__DEV__ = originalDev;
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gracefully handles PostHog constructor throwing an error (e.g. unsupported web env)', async () => {
    // Mock PostHog to throw during instantiation
    jest.doMock('posthog-react-native', () => {
      return {
        default: jest.fn(() => {
          throw new Error('Simulated PostHog crash (e.g. web bundle error)');
        }),
        __esModule: true,
      };
    });

    // Dynamically import analytics after __DEV__ and mocks are set
    const analytics = require('./analytics');

    // Suppress console outputs to keep test output clean, but spy on them
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Ensure it doesn't throw uncaught exceptions
    await expect(analytics.initAnalytics()).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      '[Analytics] PostHog initialization failed:',
      expect.any(Error),
    );
    // Client should remain null so calling it doesn't happen
    expect(analytics.getPostHogClient()).toBeNull();
  });

  it('gracefully handles missing API key in production', async () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: {} }, // no posthogApiKey
      default: { expoConfig: { extra: {} } },
    }));

    const analytics = require('./analytics');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(analytics.initAnalytics()).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      '[Analytics] PostHog API key not configured. Analytics disabled.',
    );
    expect(analytics.getPostHogClient()).toBeNull();
  });

  it('ensures track functions are safe no-ops even if initialization fails', async () => {
    // We already have similar tests in analytics.test.ts, but here we run it under failed init
    jest.doMock('posthog-react-native', () => {
      return {
        default: jest.fn(() => {
          throw new Error('Crash');
        }),
        __esModule: true,
      };
    });

    const analytics = require('./analytics');
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await analytics.initAnalytics(); // Fails gracefully

    // Tracking functions shouldn't throw when client is null
    expect(() => analytics.trackEvent('test')).not.toThrow();
    expect(() => analytics.trackScreenView('Home')).not.toThrow();
  });
});
