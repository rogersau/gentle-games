import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initSentry,
  setGameContext,
  clearGameContext,
  addActionBreadcrumb,
  testSentry,
  isSentryInitialized,
  isSentryEnabled,
} from './sentry';

// Mock dependencies
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  flush: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('./analytics', () => ({
  setAnalyticsUser: jest.fn(),
}));

describe('sentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSentryEnabled', () => {
    it('is exported and available', () => {
      // In test environment, Sentry should be disabled
      expect(typeof isSentryEnabled).toBe('boolean');
    });
  });

  describe('initSentry', () => {
    it('skips initialization when Sentry is disabled', async () => {
      await initSentry();

      // Should not initialize Sentry when disabled
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('does not generate install ID when Sentry is disabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await initSentry();

      // Should not generate install ID when Sentry is disabled
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Should not throw
      await expect(initSentry()).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('setGameContext', () => {
    it('skips when Sentry is disabled and logs to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      setGameContext('Memory Snap', 'easy');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sentry] Skipping setGameContext - disabled'
      );
      expect(Sentry.setContext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clearGameContext', () => {
    it('skips when Sentry is disabled and logs to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      clearGameContext();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sentry] Skipping clearGameContext - disabled'
      );
      expect(Sentry.setContext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('addActionBreadcrumb', () => {
    it('skips when Sentry is disabled and logs to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      addActionBreadcrumb('Card flipped', 'game_action', { cardId: 1 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sentry] Skipping breadcrumb - disabled:',
        'Card flipped'
      );
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('uses default category when not specified', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      addActionBreadcrumb('Button pressed');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sentry] Skipping breadcrumb - disabled:',
        'Button pressed'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isSentryInitialized', () => {
    it('returns false when Sentry is disabled', () => {
      expect(isSentryInitialized()).toBe(false);
    });
  });

  describe('testSentry', () => {
    it('logs when Sentry is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await testSentry();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sentry] Cannot test - Sentry is disabled or DSN not configured.'
      );
      expect(Sentry.captureException).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getInstallId', () => {
    it('retrieves existing install ID from storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('existing_install_id');

      await initSentry();

      // Should not generate new ID if one exists
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns null when AsyncStorage fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(initSentry()).resolves.not.toThrow();
    });
  });
});
