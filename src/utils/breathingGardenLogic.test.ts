import {
  BREATHING_CYCLE_DURATION_MS,
  BREATHING_PHASE_DURATION_MS,
  getBreathingPhase,
  getBreathingPhaseProgress,
  getCompletedBreathingCycles,
  isCalmBreathPress,
} from './breathingGardenLogic';

describe('breathingGardenLogic', () => {
  describe('getBreathingPhase', () => {
    it('returns inhale at the start of a cycle', () => {
      expect(getBreathingPhase(0)).toBe('inhale');
    });

    it('returns inhale throughout the inhale phase', () => {
      expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS / 4)).toBe('inhale');
      expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS / 2)).toBe('inhale');
      expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS - 1)).toBe('inhale');
    });

    it('transitions to exhale at the phase boundary', () => {
      expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS)).toBe('exhale');
    });

    it('returns exhale throughout the exhale phase', () => {
      const midExhale = BREATHING_PHASE_DURATION_MS + BREATHING_PHASE_DURATION_MS / 2;
      expect(getBreathingPhase(midExhale)).toBe('exhale');
      expect(getBreathingPhase(BREATHING_CYCLE_DURATION_MS - 1)).toBe('exhale');
    });

    it('cycles back to inhale after a full cycle', () => {
      expect(getBreathingPhase(BREATHING_CYCLE_DURATION_MS)).toBe('inhale');
      expect(getBreathingPhase(BREATHING_CYCLE_DURATION_MS + 100)).toBe('inhale');
    });

    it('handles negative elapsed time by clamping to 0', () => {
      expect(getBreathingPhase(-100)).toBe('inhale');
    });

    it('handles multiple cycles correctly', () => {
      // 3 full cycles should reset
      const threeCycles = BREATHING_CYCLE_DURATION_MS * 3;
      expect(getBreathingPhase(threeCycles)).toBe('inhale');
      expect(getBreathingPhase(threeCycles + BREATHING_PHASE_DURATION_MS)).toBe('exhale');
    });
  });

  describe('getBreathingPhaseProgress', () => {
    it('returns 0 at the start of inhale', () => {
      expect(getBreathingPhaseProgress(0)).toBe(0);
    });

    it('returns 0 at the start of exhale', () => {
      expect(getBreathingPhaseProgress(BREATHING_PHASE_DURATION_MS)).toBe(0);
    });

    it('returns approximately 0.5 halfway through inhale', () => {
      expect(getBreathingPhaseProgress(BREATHING_PHASE_DURATION_MS / 2)).toBeCloseTo(0.5, 2);
    });

    it('returns approximately 0.5 halfway through exhale', () => {
      const midExhale = BREATHING_PHASE_DURATION_MS + BREATHING_PHASE_DURATION_MS / 2;
      expect(getBreathingPhaseProgress(midExhale)).toBeCloseTo(0.5, 2);
    });

    it('approaches 1 near the end of inhale', () => {
      expect(getBreathingPhaseProgress(BREATHING_PHASE_DURATION_MS - 1)).toBeCloseTo(1, 1);
    });

    it('approaches 1 near the end of exhale', () => {
      expect(getBreathingPhaseProgress(BREATHING_CYCLE_DURATION_MS - 1)).toBeCloseTo(1, 1);
    });

    it('resets to 0 after a full cycle', () => {
      expect(getBreathingPhaseProgress(BREATHING_CYCLE_DURATION_MS)).toBe(0);
    });
  });

  describe('getCompletedBreathingCycles', () => {
    it('returns 0 at the start', () => {
      expect(getCompletedBreathingCycles(0)).toBe(0);
    });

    it('returns 0 during the first cycle', () => {
      expect(getCompletedBreathingCycles(BREATHING_CYCLE_DURATION_MS - 1)).toBe(0);
    });

    it('returns 1 after one complete cycle', () => {
      expect(getCompletedBreathingCycles(BREATHING_CYCLE_DURATION_MS)).toBe(1);
    });

    it('returns correct count for multiple cycles', () => {
      expect(getCompletedBreathingCycles(BREATHING_CYCLE_DURATION_MS * 3)).toBe(3);
      expect(getCompletedBreathingCycles(BREATHING_CYCLE_DURATION_MS * 5 + 100)).toBe(5);
    });

    it('handles partial progress within cycles', () => {
      const oneAndAHalfCycles = BREATHING_CYCLE_DURATION_MS * 1.5;
      expect(getCompletedBreathingCycles(oneAndAHalfCycles)).toBe(1);
    });
  });

  describe('isCalmBreathPress', () => {
    it('returns true for valid inhale press', () => {
      expect(isCalmBreathPress('inhale', 700)).toBe(true);
      expect(isCalmBreathPress('inhale', 2000)).toBe(true);
      expect(isCalmBreathPress('inhale', 5000)).toBe(true);
    });

    it('returns false for exhale press', () => {
      expect(isCalmBreathPress('exhale', 700)).toBe(false);
      expect(isCalmBreathPress('exhale', 2000)).toBe(false);
    });

    it('returns false for too short hold', () => {
      expect(isCalmBreathPress('inhale', 499)).toBe(false);
      expect(isCalmBreathPress('inhale', 0)).toBe(false);
      expect(isCalmBreathPress('inhale', -100)).toBe(false);
    });

    it('returns false for too long hold', () => {
      expect(isCalmBreathPress('inhale', 6001)).toBe(false);
      expect(isCalmBreathPress('inhale', 10000)).toBe(false);
    });

    it('returns true at boundary values', () => {
      expect(isCalmBreathPress('inhale', 500)).toBe(true);
      expect(isCalmBreathPress('inhale', 6000)).toBe(true);
    });
  });

  describe('constants', () => {
    it('has correct phase duration (3.5 seconds)', () => {
      expect(BREATHING_PHASE_DURATION_MS).toBe(3500);
    });

    it('has correct cycle duration (7 seconds)', () => {
      expect(BREATHING_CYCLE_DURATION_MS).toBe(7000);
    });

    it('cycle is exactly twice the phase duration', () => {
      expect(BREATHING_CYCLE_DURATION_MS).toBe(BREATHING_PHASE_DURATION_MS * 2);
    });
  });
});
