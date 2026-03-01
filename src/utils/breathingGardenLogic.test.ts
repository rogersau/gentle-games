import {
  BREATHING_CYCLE_DURATION_MS,
  BREATHING_PHASE_DURATION_MS,
  getBreathingPhase,
  getBreathingPhaseProgress,
  getCompletedBreathingCycles,
  isCalmBreathPress,
} from './breathingGardenLogic';

describe('breathingGardenLogic', () => {
  it('returns inhale then exhale based on elapsed time', () => {
    expect(getBreathingPhase(0)).toBe('inhale');
    expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS - 1)).toBe('inhale');
    expect(getBreathingPhase(BREATHING_PHASE_DURATION_MS)).toBe('exhale');
  });

  it('normalizes progress per phase', () => {
    expect(getBreathingPhaseProgress(0)).toBe(0);
    expect(getBreathingPhaseProgress(BREATHING_PHASE_DURATION_MS / 2)).toBeCloseTo(0.5, 2);
    expect(getBreathingPhaseProgress(BREATHING_CYCLE_DURATION_MS)).toBe(0);
  });

  it('tracks completed cycles and valid inhale holds', () => {
    expect(getCompletedBreathingCycles(BREATHING_CYCLE_DURATION_MS * 3 + 100)).toBe(3);
    expect(isCalmBreathPress('inhale', 700)).toBe(true);
    expect(isCalmBreathPress('exhale', 700)).toBe(false);
  });
});

