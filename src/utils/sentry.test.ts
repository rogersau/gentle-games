describe('sentry consent lifecycle and payload scrubbing', () => {
  const mockInit = jest.fn();
  const mockSetUser = jest.fn();
  const mockAddBreadcrumb = jest.fn();
  const mockCaptureException = jest.fn();
  const mockRemoveItem = jest.fn();
  const mockClose = jest.fn();
  const mockClear = jest.fn();
  const mockSetClient = jest.fn();
  const mockOptions = { enabled: true };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockOptions.enabled = true;
    mockRemoveItem.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            sentryDsn: 'https://dsn.example/1',
            sentryDebug: true,
            sentryRelease: 'gentle-games@1.1.0',
          },
        },
      },
    }));
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: { removeItem: mockRemoveItem },
    }));
    jest.doMock('@sentry/react-native', () => ({
      init: mockInit,
      setUser: mockSetUser,
      addBreadcrumb: mockAddBreadcrumb,
      captureException: mockCaptureException,
      close: mockClose,
      getClient: () => ({ getOptions: () => mockOptions }),
      getCurrentScope: () => ({ clear: mockClear, setClient: mockSetClient }),
      getIsolationScope: () => ({ clear: mockClear }),
    }));
  });

  it('keeps all capture helpers disabled without consent', async () => {
    const sentry = require('./sentry');
    await sentry.reconcileSentryConsent(false);
    sentry.addActionBreadcrumb('flip', 'game_action');
    sentry.captureScreenError(new Error('test'), { screen: 'Home' });
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('removes the legacy shared identity and only initializes once for repeated consent', async () => {
    const sentry = require('./sentry');
    await sentry.reconcileSentryConsent(true);
    await sentry.reconcileSentryConsent(true);
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        sendDefaultPii: false,
        enableAutoSessionTracking: false,
        initialScope: { user: undefined },
        release: 'gentle-games@1.1.0',
      }),
    );
    expect(mockRemoveItem).toHaveBeenCalledWith('@gentle_games_install_id');
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  it('scrubs content, identities, requests, variables, and source snippets while retaining source locations', async () => {
    const sentry = require('./sentry');
    await sentry.reconcileSentryConsent(true);
    const { beforeSend, beforeBreadcrumb } = mockInit.mock.calls[0][0];
    const event = beforeSend({
      message: 'private',
      user: { id: 'shared', email: 'private' },
      request: { url: 'private' },
      logentry: { message: 'private' },
      transaction: 'private',
      threads: { values: ['private'] },
      contexts: { react: { componentStack: 'private' } },
      extra: { note: 'private' },
      tags: { screen: 'Home', arbitrary: 'private' },
      exception: {
        values: [
          {
            type: 'Error',
            value: 'private',
            stacktrace: {
              frames: [
                {
                  filename: 'https://example.com/index.bundle?secret=value',
                  abs_path: '/private/path',
                  function: 'render',
                  lineno: 12,
                  colno: 4,
                  in_app: true,
                  vars: { name: 'private' },
                  context_line: 'private',
                  pre_context: ['private'],
                },
              ],
            },
          },
        ],
      },
    });
    for (const field of [
      'message',
      'user',
      'request',
      'logentry',
      'transaction',
      'threads',
      'contexts',
      'extra',
    ]) {
      expect(event[field]).toBeUndefined();
    }
    expect(event.tags).toEqual({ screen: 'Home' });
    expect(event.exception.values[0].value).toBeUndefined();
    expect(event.exception.values[0].stacktrace.frames).toEqual([
      {
        filename: 'index.bundle',
        function: 'render',
        lineno: 12,
        colno: 4,
        in_app: true,
      },
    ]);
    expect(
      beforeBreadcrumb({
        category: 'error',
        message: 'private',
        data: {
          screen: 'Home',
          score: 10,
          duration_ms: 100,
          rawMessage: 'private',
        },
      }),
    ).toEqual({ category: 'error', data: { screen: 'Home' } });
    expect(
      beforeSend({
        exception: {
          values: [
            {
              stacktrace: {
                frames: [
                  { filename: 'app:///index.android.bundle?private=value' },
                  { filename: '/private/user/file.js' },
                ],
              },
            },
          ],
        },
      }).exception.values[0].stacktrace.frames.map((frame: { filename: string }) => frame.filename),
    ).toEqual(['app:///index.android.bundle', 'file.js']);
  });

  it('blocks immediately, closes and clears the SDK, and can safely start a fresh client', async () => {
    const sentry = require('./sentry');
    await sentry.reconcileSentryConsent(true);
    const beforeSend = mockInit.mock.calls[0][0].beforeSend;
    const disable = sentry.reconcileSentryConsent(false);
    expect(mockOptions.enabled).toBe(false);
    expect(sentry.isSentryInitialized()).toBe(false);
    expect(beforeSend({ message: 'test' })).toBeNull();
    sentry.captureScreenError(new Error('test'), { screen: 'Home' });
    await disable;
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(2);
    expect(mockSetClient).toHaveBeenCalledWith(undefined);
    expect(mockCaptureException).not.toHaveBeenCalled();
    await sentry.reconcileSentryConsent(true);
    expect(mockInit).toHaveBeenCalledTimes(2);
    expect(beforeSend({ message: 'test' })).toBeNull();
    expect(sentry.isSentryInitialized()).toBe(true);
  });

  it('does not initialize if consent changes during legacy identity cleanup', async () => {
    let finishCleanup!: () => void;
    mockRemoveItem.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishCleanup = resolve;
        }),
    );
    const sentry = require('./sentry');
    const enable = sentry.reconcileSentryConsent(true);
    await Promise.resolve();
    await Promise.resolve();
    const disable = sentry.reconcileSentryConsent(false);
    finishCleanup();
    await enable;
    await disable;
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('continues without identity if local cleanup fails', async () => {
    mockRemoveItem.mockRejectedValueOnce(new Error('storage unavailable'));
    const sentry = require('./sentry');
    await expect(sentry.reconcileSentryConsent(true)).resolves.toBeUndefined();
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});
