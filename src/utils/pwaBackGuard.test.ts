import { installPwaBackNavigationGuard, isStandalonePwa } from './pwaBackGuard';

type MockBrowser = {
  history: {
    pushState: jest.Mock<void, [unknown, string, string?]>;
  };
  location: {
    href: string;
  };
  matchMedia: jest.Mock<{ matches: boolean }, [string]>;
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
});
