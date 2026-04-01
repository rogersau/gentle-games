describe('sentry consent-aware wrappers', () => {
  const mockInit = jest.fn();
  const mockSetUser = jest.fn();
  const mockSetContext = jest.fn();
  const mockAddBreadcrumb = jest.fn();
  const mockCaptureException = jest.fn();
  const mockStorageGetItem = jest.fn();
  const mockStorageSetItem = jest.fn();
  const mockSetAnalyticsUser = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStorageGetItem.mockResolvedValue('install_test');
    mockStorageSetItem.mockResolvedValue(undefined);

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            sentryDsn: 'https://dsn.example/1',
            sentryDebug: true,
          },
        },
      },
      expoConfig: {
        extra: {
          sentryDsn: 'https://dsn.example/1',
          sentryDebug: true,
        },
      },
    }));

    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: {
        getItem: mockStorageGetItem,
        setItem: mockStorageSetItem,
      },
      getItem: mockStorageGetItem,
      setItem: mockStorageSetItem,
    }));

    jest.doMock('@sentry/react-native', () => ({
      __esModule: true,
      init: mockInit,
      setUser: mockSetUser,
      setContext: mockSetContext,
      addBreadcrumb: mockAddBreadcrumb,
      captureException: mockCaptureException,
    }));

    jest.doMock('./analytics', () => ({
      __esModule: true,
      setAnalyticsUser: mockSetAnalyticsUser,
    }));
  });

  it('makes capture helpers safe no-ops when telemetry is disabled', () => {
    const sentry = require('./sentry');

    sentry.addActionBreadcrumb('Card flipped', 'game_action', {
      screen: 'Home',
      rawMessage: 'drop me',
    });
    sentry.captureScreenError(new Error('Test error'), {
      screen: 'Home',
      componentStack: 'stack',
    });

    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters beforeSend and beforeBreadcrumb payloads to allowlisted fields only', async () => {
    const sentry = require('./sentry');

    await sentry.reconcileSentryConsent(true);

    expect(mockInit).toHaveBeenCalledTimes(1);

    const options = mockInit.mock.calls[0][0];
    const filteredEvent = options.beforeSend({
      message: 'raw error text',
      user: {
        id: 'install_test',
        email: 'child@example.com',
      },
      tags: {
        screen: 'Home',
        custom: 'remove-me',
      },
      contexts: {
        react: {
          componentStack: 'drop me',
        },
      },
      extra: {
        rawMessage: 'drop me',
      },
      exception: {
        values: [
          {
            type: 'Error',
            value: 'drop me',
          },
        ],
      },
    });

    expect(filteredEvent).toEqual(
      expect.objectContaining({
        user: { id: 'install_test' },
        tags: { screen: 'Home' },
      }),
    );
    expect(filteredEvent.message).toBeUndefined();
    expect(filteredEvent.contexts).toBeUndefined();
    expect(filteredEvent.extra).toBeUndefined();
    expect(filteredEvent.exception.values[0].value).toBeUndefined();

    const filteredBreadcrumb = options.beforeBreadcrumb({
      category: 'error',
      message: 'free-form text',
      data: {
        screen: 'Home',
        componentStack: 'drop me',
      },
    });

    expect(filteredBreadcrumb).toEqual({
      category: 'error',
      data: {
        screen: 'Home',
      },
    });
  });

  it('persists a generated install ID, shares it with analytics, and avoids reinitializing on repeated enable', async () => {
    mockStorageGetItem.mockResolvedValueOnce(null);

    const sentry = require('./sentry');

    await sentry.reconcileSentryConsent(true);
    await sentry.reconcileSentryConsent(true);

    expect(mockStorageSetItem).toHaveBeenCalledTimes(1);
    expect(mockStorageSetItem).toHaveBeenCalledWith(
      '@gentle_games_install_id',
      expect.stringMatching(/^install_/),
    );
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledWith({
      id: expect.stringMatching(/^install_/),
    });
    expect(mockSetAnalyticsUser).toHaveBeenCalledWith(expect.stringMatching(/^install_/));
  });

  it('continues without crashing when install ID storage fails', async () => {
    mockStorageGetItem.mockRejectedValueOnce(new Error('storage offline'));

    const sentry = require('./sentry');

    await expect(sentry.reconcileSentryConsent(true)).resolves.toBeUndefined();

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockSetAnalyticsUser).not.toHaveBeenCalled();
  });
});
