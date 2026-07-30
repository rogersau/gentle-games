import { Settings } from '../types';

/** Presentation choices shared by finished games. Game state and rules remain independent. */
export interface GamePresentationPolicy {
  showPressureMetrics: boolean;
  showMilestoneCelebrations: boolean;
}

export const getGamePresentationPolicy = (
  settings: Pick<Settings, 'pressureFreeMode'>,
): GamePresentationPolicy => ({
  showPressureMetrics: settings.pressureFreeMode !== true,
  showMilestoneCelebrations: settings.pressureFreeMode !== true,
});
