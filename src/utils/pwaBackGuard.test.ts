import { installPwaBackNavigationGuard, isStandalonePwa, type BrowserLike } from './pwaBackGuard';

type MockBrowser = BrowserLike & {
  history: {
    pushState: jest.Mock<void, [unknown, string, string?]>;
  };
  location: {
    href: string;
  };
  matchMedia?: jest.Mock<{ matches: boolean }, [string]>;
  addEventListener: jest.Mock<void, ['popstate', () => void]>;
  removeEventListener: jest.Mock<void, ['popstate', () => void]>;
};

const createMockBrowser = (isStandalone: boolean): MockBrowser => ({
  history: {
    pushState: jest.fn(),
  },
  location: {
    href: 'https://example.com/game',
  },
  matchMedia: jest.fn().mockReturnValue({ matches: isStandalone }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

describe('pwaBackGuard', () => {
  it('detects standalone mode only on web', () => {
    expect(isStandalonePwa('ios', createMockBrowser(true), true)).toBe(false);
    expect(isStandalonePwa('web', createMockBrowser(true), false)).toBe(true);
  });

  it('installs and removes popstate guard in standalone web mode', () => {
    const browser = createMockBrowser(true);
    const cleanup = installPwaBackNavigationGuard('web', browser, false);

    expect(browser.history.pushState).toHaveBeenCalledWith(null, '', browser.location.href);
    expect(browser.addEventListener).toHaveBeenCalledTimes(1);
    expect(browser.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));

    cleanup();
    expect(browser.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('does nothing when not running in standalone web mode', () => {
    const browser = createMockBrowser(false);
    const cleanup = installPwaBackNavigationGuard('web', browser, false);

    expect(browser.history.pushState).not.toHaveBeenCalled();
    expect(browser.addEventListener).not.toHaveBeenCalled();
    cleanup();
    expect(browser.removeEventListener).not.toHaveBeenCalled();
  });

  it('supports standalone fallback when matchMedia is unavailable', () => {
    const browser = createMockBrowser(false);
    delete browser.matchMedia;

    expect(isStandalonePwa('web', browser, true)).toBe(true);
    const cleanup = installPwaBackNavigationGuard('web', browser, true);

    expect(browser.history.pushState).toHaveBeenCalledWith(null, '', browser.location.href);
    cleanup();
    expect(browser.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  describe('edge cases', () => {
    it('returns false for non-web platforms even with standalone flag', () => {
      const browser = createMockBrowser(true);
      expect(isStandalonePwa('ios', browser, true)).toBe(false);
      expect(isStandalonePwa('android', browser, true)).toBe(false);
      expect(isStandalonePwa('macos', browser, true)).toBe(false);
      expect(isStandalonePwa('windows', browser, true)).toBe(false);
    });

    it('returns false when browser is undefined', () => {
      expect(isStandalonePwa('web', undefined, true)).toBe(false);
      expect(isStandalonePwa('web', undefined, false)).toBe(false);
    });

    it('returns false for web platform when not standalone', () => {
      const browser = createMockBrowser(false);
      expect(isStandalonePwa('web', browser, false)).toBe(false);
    });

    it('returns no-op function when browser is undefined and no window', () => {
      // Ensure window is undefined
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const cleanup = installPwaBackNavigationGuard('web', undefined, true);
      expect(typeof cleanup).toBe('function');
      // Should not throw
      expect(() => cleanup()).not.toThrow();

      // Restore window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('returns no-op function when not in standalone mode', () => {
      const browser = createMockBrowser(false);
      const cleanup = installPwaBackNavigationGuard('web', browser, false);
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('returns no-op function on non-web platforms', () => {
      const browser = createMockBrowser(true);
      const cleanup = installPwaBackNavigationGuard('ios', browser, true);
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('uses window.navigator.standalone when standaloneFlag is not provided', () => {
      // Mock the global navigator object
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { standalone: true },
        writable: true,
        configurable: true,
      });

      const browser = createMockBrowser(false);
      const cleanup = installPwaBackNavigationGuard('web', browser, undefined);

      expect(browser.history.pushState).toHaveBeenCalled();
      cleanup();

      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('prevents back navigation by pushing state on popstate', () => {
      const browser = createMockBrowser(true);
      installPwaBackNavigationGuard('web', browser, false);

      // Get the popstate handler
      const popstateHandler = browser.addEventListener.mock.calls[0][1];

      // Call the handler to simulate popstate event
      popstateHandler();

      // Should push state again to prevent back navigation
      expect(browser.history.pushState).toHaveBeenCalledTimes(2);
    });

    it('cleanup removes the correct popstate handler', () => {
      const browser = createMockBrowser(true);
      const cleanup = installPwaBackNavigationGuard('web', browser, false);

      const handler = browser.addEventListener.mock.calls[0][1];
      cleanup();

      expect(browser.removeEventListener).toHaveBeenCalledWith('popstate', handler);
    });

    it('uses global window when browser parameter is not provided on web', () => {
      // This test verifies the code path that uses global window
      const originalWindow = global.window;
      const mockWindow = {
        history: { pushState: jest.fn() },
        location: { href: 'https://example.com' },
        matchMedia: jest.fn().mockReturnValue({ matches: true }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(global, 'window', {
        value: mockWindow as unknown as Window,
        writable: true,
        configurable: true,
      });

      const cleanup = installPwaBackNavigationGuard('web', undefined, true);

      expect(mockWindow.history.pushState).toHaveBeenCalled();
      cleanup();

      // Restore original window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });
  });
});
