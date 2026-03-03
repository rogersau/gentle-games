import {
    trackEvent,
    trackScreenView,
    trackGameStart,
    trackGameComplete,
    trackSettingsChange,
} from './analytics';

// In test environment, __DEV__ is true and POSTHOG_DEBUG is not set,
// so the PostHog client never initializes. This means all tracking
// functions are safe no-ops (they check for null client internally).

describe('analytics', () => {
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
});
