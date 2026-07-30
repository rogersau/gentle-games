import { DEFAULT_GAME_SETTINGS, sanitizeGameSettings, SETTINGS_VERSION } from './settings';

describe('game settings schema', () => {
  it('uses calm phase-four starter defaults', () => {
    expect(SETTINGS_VERSION).toBe(5);
    expect(DEFAULT_GAME_SETTINGS['bubble-pop']).toMatchObject({
      motion: 'still',
      speed: 'slow',
      density: 'sparse',
      size: 'large',
    });
    expect(DEFAULT_GAME_SETTINGS.drawing).toMatchObject({
      mode: 'free-draw',
      copyActivity: 'copy-line',
      strokeWidth: 5,
      smoothing: true,
    });
    expect(DEFAULT_GAME_SETTINGS['keepy-uppy']).toMatchObject({
      profile: 'large-and-slow',
      balloonSize: 46,
      gravity: 82,
      targetSize: 1.8,
      balloonCount: 1,
    });
  });

  it('preserves valid independent phase-four settings', () => {
    const settings = sanitizeGameSettings({
      drawing: {
        mode: 'gentle-trails',
        trailPattern: 'spiral',
        copyActivity: 'continue-pattern',
        tolerance: 56,
        pathWidth: 88,
        strokeWidth: 8,
        smoothing: false,
      },
      'bubble-pop': {
        motion: 'moving',
        speed: 'fast',
        density: 'full',
        size: 'small',
        sound: false,
      },
      'keepy-uppy': {
        liftMode: 'precise',
        profile: 'more-balloons',
        balloonSize: 29,
        gravity: 220,
        targetSize: 1.8,
        balloonCount: 3,
      },
    });

    expect(settings.drawing).toEqual({
      mode: 'gentle-trails',
      trailPattern: 'spiral',
      copyActivity: 'continue-pattern',
      tolerance: 56,
      pathWidth: 88,
      strokeWidth: 8,
      smoothing: false,
    });
    expect(settings['bubble-pop']).toEqual({
      motion: 'moving',
      speed: 'fast',
      density: 'full',
      size: 'small',
      sound: false,
    });
    expect(settings['keepy-uppy']).toEqual({
      liftMode: 'precise',
      profile: 'more-balloons',
      balloonSize: 29,
      gravity: 220,
      targetSize: 1.8,
      balloonCount: 3,
    });
  });

  it('sanitizes invalid values and migrates the legacy precise-touch choice', () => {
    const invalid = sanitizeGameSettings({
      drawing: { mode: 'graded', strokeWidth: 12, smoothing: 'yes' },
      'bubble-pop': { motion: 'spinning', density: 'crowded' },
      'keepy-uppy': { profile: 'impossible', balloonCount: 8 },
    });
    const migrated = sanitizeGameSettings(undefined, { keepyUppyEasyMode: false });

    expect(invalid.drawing).toEqual(DEFAULT_GAME_SETTINGS.drawing);
    expect(invalid['bubble-pop']).toEqual(DEFAULT_GAME_SETTINGS['bubble-pop']);
    expect(invalid['keepy-uppy']).toEqual(DEFAULT_GAME_SETTINGS['keepy-uppy']);
    expect(migrated['keepy-uppy']).toMatchObject({
      liftMode: 'precise',
      profile: 'direct-touch',
    });
  });
});
