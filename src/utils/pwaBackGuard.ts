import { Platform } from 'react-native';

type BrowserLike = {
  history: {
    pushState: (data: unknown, unused: string, url?: string) => void;
  };
  location: {
    href: string;
  };
  matchMedia?: (query: string) => { matches: boolean };
  addEventListener: (type: 'popstate', listener: () => void) => void;
  removeEventListener: (type: 'popstate', listener: () => void) => void;
};

export const isStandalonePwa = (
  platformOS: string = Platform.OS,
  browser?: BrowserLike,
  standaloneFlag?: boolean,
) => {
  if (platformOS !== 'web' || !browser) {
    return false;
  }

  const standaloneMedia = browser.matchMedia?.('(display-mode: standalone)').matches === true;
  return standaloneMedia || standaloneFlag === true;
};

export const installPwaBackNavigationGuard = (
  platformOS: string = Platform.OS,
  browser?: BrowserLike,
  standaloneFlag?: boolean,
) => {
  const activeBrowser = browser ?? (typeof window !== 'undefined' ? (window as unknown as BrowserLike) : undefined);
  if (!activeBrowser) {
    return () => {};
  }

  const activeStandaloneFlag =
    standaloneFlag ??
    (typeof navigator !== 'undefined'
      ? (navigator as Navigator & { standalone?: boolean }).standalone
      : undefined);

  if (!isStandalonePwa(platformOS, activeBrowser, activeStandaloneFlag)) {
    return () => {};
  }

  const preventBackNavigation = () => {
    activeBrowser.history.pushState(null, '', activeBrowser.location.href);
  };

  preventBackNavigation();
  activeBrowser.addEventListener('popstate', preventBackNavigation);

  return () => {
    activeBrowser.removeEventListener('popstate', preventBackNavigation);
  };
};
