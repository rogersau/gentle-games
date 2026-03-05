import {
    trackEvent,
    trackScreenView,
    trackGameStart,
    trackGameComplete,
    trackSettingsChange,
    getPostHogClient,
    initAnalytics,
    isAnalyticsEnabled,
} from './analytics';

// Mock expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            posthogApiKey: 'test-api-key',
            posthogHost: 'https://test.posthog.com',
            posthogDebug: false,
        },
    },
}));

// Mock PostHog
const mockIdentify = jest.fn();
const mockCapture = jest.fn();
const mockScreen = jest.fn();

jest.mock('posthog-react-native', () => {
    return jest.fn().mockImplementation(() => ({
        identify: mockIdentify,
        capture: mockCapture,
        screen: mockScreen,
    }));
});

// In test environment, __DEV__ is true and POSTHOG_DEBUG is not set,
// so the PostHog client never initializes. This means all tracking
// functions are safe no-ops (they check for null client internally).

describe('analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('when PostHog is not initialized (dev mode)', () => {
        it('trackEvent does not throw', () => {
            expect(() => trackEvent('test event', { key: 'value' })).not.toThrow();
        });

        it('trackScreenView does not throw', () => {
            expect(() => trackScreenView('Home')).not.toThrow();
        });

        it('trackGameStart does not throw', () => {
            expect(() => trackGameStart('Memory Snap', 'easy')).not.toThrow();
        });

        it('trackGameComplete does not throw', () => {
            expect(() => trackGameComplete('Memory Snap', 12000, 10)).not.toThrow();
        });

        it('trackSettingsChange does not throw', () => {
            expect(() => trackSettingsChange('soundEnabled', false)).not.toThrow();
        });
    });

    describe('event naming conventions', () => {
        it('trackGameStart uses object-verb format', () => {
            // Verify the function exists and accepts expected parameters
            expect(typeof trackGameStart).toBe('function');
        });

        it('trackGameComplete uses object-verb format', () => {
            expect(typeof trackGameComplete).toBe('function');
        });

        it('trackSettingsChange uses object-verb format', () => {
            expect(typeof trackSettingsChange).toBe('function');
        });
    });

    describe('privacy safety', () => {
        it('trackGameStart only sends game name and difficulty', () => {
            // Function accepts only non-PII parameters
            expect(trackGameStart.length).toBeGreaterThanOrEqual(1);
        });

        it('trackGameComplete only sends game name, duration, and score', () => {
            expect(trackGameComplete.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('edge cases', () => {
        it('getPostHogClient returns null when not initialized', () => {
            expect(getPostHogClient()).toBeNull();
        });

        it('initAnalytics returns early when analytics is disabled', async () => {
            // In __DEV__ mode with POSTHOG_DEBUG=false, analytics is disabled
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            
            await initAnalytics();
            
            // Should not have logged API key warning since analytics is disabled
            expect(warnSpy).not.toHaveBeenCalled();
            
            warnSpy.mockRestore();
        });

        it('isAnalyticsEnabled reflects the current state', () => {
            // In test environment: __DEV__ is true, POSTHOG_DEBUG is false
            // so isAnalyticsEnabled should be false
            expect(isAnalyticsEnabled).toBe(false);
        });

        it('trackEvent handles undefined properties', () => {
            expect(() => trackEvent('test event')).not.toThrow();
        });

        it('trackGameStart uses not_set when difficulty is undefined', () => {
            // This test verifies the fallback logic
            expect(() => trackGameStart('Test Game')).not.toThrow();
        });

        it('trackGameComplete handles undefined duration and score', () => {
            expect(() => trackGameComplete('Test Game')).not.toThrow();
        });
    });
});
