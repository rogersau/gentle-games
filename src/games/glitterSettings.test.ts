import {
  DEFAULT_GLITTER_SETTINGS,
  GLITTER_PRESETS,
  resolveGlitterSettings,
} from './glitterSettings';

describe('glitter settings', () => {
  it('defines four deterministic and visibly distinct presets', () => {
    expect(GLITTER_PRESETS).toEqual({
      settle: expect.objectContaining({
        particleDensity: 'very-sparse',
        fallSpeed: 'very-slow',
        colorCount: 1,
        ripples: false,
        shakeResponse: false,
      }),
      watch: expect.objectContaining({
        particleDensity: 'sparse',
        fallSpeed: 'slow',
      }),
      explore: expect.objectContaining({
        particleDensity: 'medium',
        ripples: true,
      }),
      full: expect.objectContaining({
        particleDensity: 'dense',
        colorCount: 6,
        shakeResponse: true,
      }),
    });
  });

  it('falls back to settle for missing or invalid persisted values', () => {
    expect(resolveGlitterSettings(undefined)).toEqual(DEFAULT_GLITTER_SETTINGS);
    expect(resolveGlitterSettings({ preset: 'unknown', ripples: 'yes' })).toEqual(
      DEFAULT_GLITTER_SETTINGS,
    );
  });
});
