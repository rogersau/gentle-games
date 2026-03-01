import { BreathingGardenPhase } from '../types';

export const BREATHING_PHASE_DURATION_MS = 3500;
export const BREATHING_CYCLE_DURATION_MS = BREATHING_PHASE_DURATION_MS * 2;

const normalizeMs = (elapsedMs: number) => Math.max(0, Math.floor(elapsedMs));

export const getBreathingPhase = (elapsedMs: number): BreathingGardenPhase => {
  const cycleMs = normalizeMs(elapsedMs) % BREATHING_CYCLE_DURATION_MS;
  return cycleMs < BREATHING_PHASE_DURATION_MS ? 'inhale' : 'exhale';
};

export const getBreathingPhaseProgress = (elapsedMs: number): number => {
  const cycleMs = normalizeMs(elapsedMs) % BREATHING_CYCLE_DURATION_MS;
  const phaseMs = cycleMs < BREATHING_PHASE_DURATION_MS ? cycleMs : cycleMs - BREATHING_PHASE_DURATION_MS;
  return phaseMs / BREATHING_PHASE_DURATION_MS;
};

export const getCompletedBreathingCycles = (elapsedMs: number): number =>
  Math.floor(normalizeMs(elapsedMs) / BREATHING_CYCLE_DURATION_MS);

export const isCalmBreathPress = (phase: BreathingGardenPhase, holdDurationMs: number): boolean => {
  if (phase !== 'inhale') {
    return false;
  }
  const hold = normalizeMs(holdDurationMs);
  return hold >= 500 && hold <= 6000;
};

