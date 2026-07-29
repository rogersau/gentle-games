import {
  addBalloon,
  createBalloon,
  createInitialBalloons,
  flickBalloon,
  GROUND_POP_DELAY_MS,
  MAX_BALLOONS,
  KeepyUppyBalloon,
  stepBalloons,
  tapBalloon,
  resolveBalloonPalette,
  DEFAULT_KEEPY_UPPY_CONFIG,
  KEEPY_UPPY_PROFILES,
  KEEPY_UPPY_VELOCITY_LIMITS,
  isBalloonResting,
  resolveKeepyUppyConfig,
} from './keepyUppyLogic';
import { PASTEL_COLORS, ThemeColors } from '../types';

const bounds = { width: 320, height: 480 };

describe('keepyUppyLogic', () => {
  it('adds balloons up to the max cap of three', () => {
    const rng = () => 0.5;
    const first = addBalloon([], bounds, { colors: PASTEL_COLORS, rng });
    const second = addBalloon(first, bounds, { colors: PASTEL_COLORS, rng });
    const third = addBalloon(second, bounds, { colors: PASTEL_COLORS, rng });
    const fourth = addBalloon(third, bounds, { colors: PASTEL_COLORS, rng });

    expect(third).toHaveLength(MAX_BALLOONS);
    expect(fourth).toHaveLength(MAX_BALLOONS);
  });

  it('applies direction-sensitive tap impulse', () => {
    const balloon: KeepyUppyBalloon = {
      id: 'a',
      x: 160,
      y: 220,
      vx: 0,
      vy: 10,
      radius: 34,
      color: '#fff',
      groundedAt: 100,
    };

    const tappedLeft = tapBalloon(balloon, 130, 220);
    const tappedRight = tapBalloon(balloon, 190, 220);

    expect(tappedLeft.vx).toBeGreaterThan(0);
    expect(tappedRight.vx).toBeLessThan(0);
    expect(tappedLeft.vy).toBeLessThan(balloon.vy);
    expect(tappedLeft.groundedAt).toBeNull();
  });

  it('keeps taps gently upward in easy mode', () => {
    const balloon: KeepyUppyBalloon = {
      id: 'easy',
      x: 160,
      y: 220,
      vx: 0,
      vy: 180,
      radius: 34,
      color: '#fff',
      groundedAt: null,
    };

    const normalTap = tapBalloon(balloon, 160, 190, false);
    const easyTap = tapBalloon(balloon, 160, 190, true);

    expect(easyTap.vy).toBeLessThanOrEqual(-80);
    expect(easyTap.vy).toBeLessThan(normalTap.vy);
  });

  it('applies extra momentum from an upward flick', () => {
    const balloon: KeepyUppyBalloon = {
      id: 'f',
      x: 160,
      y: 220,
      vx: 0,
      vy: 0,
      radius: 34,
      color: '#fff',
      groundedAt: 100,
    };

    const flicked = flickBalloon(balloon, 18, -40, 120);

    expect(flicked.vx).toBeGreaterThan(balloon.vx);
    expect(flicked.vy).toBeLessThan(balloon.vy);
    expect(flicked.groundedAt).toBeNull();
  });

  it('turns ground contact into a resting state without popping', () => {
    const balloon: KeepyUppyBalloon = {
      id: 'g',
      x: 160,
      y: 480 - 34,
      vx: 0,
      vy: 0,
      radius: 34,
      color: '#fff',
      groundedAt: 1000,
    };

    const beforeRest = stepBalloons([balloon], bounds, 1 / 30, 1000 + GROUND_POP_DELAY_MS - 1);
    const afterRest = stepBalloons([balloon], bounds, 1 / 30, 1000 + GROUND_POP_DELAY_MS + 1);

    expect(beforeRest.balloons).toHaveLength(1);
    expect(afterRest.balloons).toHaveLength(1);
    expect(afterRest.balloons[0].resting).toBe(true);
    expect(afterRest.popped).toBe(0);
    expect(isBalloonResting(afterRest.balloons[0])).toBe(true);
  });

  it('restarts a resting balloon through the normal lift input', () => {
    const balloon: KeepyUppyBalloon = {
      id: 'resting',
      x: 160,
      y: 446,
      vx: 0,
      vy: 0,
      radius: 34,
      color: '#fff',
      groundedAt: 1000,
      resting: true,
    };

    const lifted = tapBalloon(balloon, 160, 446);

    expect(lifted.resting).toBe(false);
    expect(lifted.groundedAt).toBeNull();
    expect(lifted.vy).toBeLessThan(0);
  });

  it('provides materially distinct deterministic profiles', () => {
    const profiles = Object.keys(KEEPY_UPPY_PROFILES) as Array<keyof typeof KEEPY_UPPY_PROFILES>;
    const configs = profiles.map((profile) => resolveKeepyUppyConfig({ profile }));

    expect(configs).toHaveLength(6);
    expect(new Set(configs.map((config) => config.balloonSize)).size).toBeGreaterThan(1);
    expect(new Set(configs.map((config) => config.gravity)).size).toBeGreaterThan(1);
    expect(new Set(configs.map((config) => config.targetSize)).size).toBeGreaterThan(1);
    expect(resolveKeepyUppyConfig({ profile: 'more-balloons' }).balloonCount).toBe(3);
    expect(DEFAULT_KEEPY_UPPY_CONFIG.profile).toBe('large-and-slow');
  });

  it('keeps a profile interaction when persisted physics values override it', () => {
    expect(
      resolveKeepyUppyConfig({
        profile: 'target-zones',
        balloonSize: 46,
        gravity: 82,
        targetSize: 2.6,
        balloonCount: 1,
      }).interaction,
    ).toBe('target-zones');
    expect(
      resolveKeepyUppyConfig({
        profile: 'tap-anywhere',
        balloonSize: 34,
        gravity: 175,
        targetSize: 2.6,
        balloonCount: 1,
      }).interaction,
    ).toBe('tap-anywhere');
  });

  it('keeps every profile playable and deterministic', () => {
    (Object.keys(KEEPY_UPPY_PROFILES) as Array<keyof typeof KEEPY_UPPY_PROFILES>).forEach(
      (profile) => {
        const config = resolveKeepyUppyConfig({ profile });
        const initial = createInitialBalloons(bounds, { rng: () => 0.5, config });
        const lifted = initial.map((balloon) =>
          tapBalloon(balloon, balloon.x, balloon.y, false, config),
        );

        expect(initial.length).toBe(profile === 'more-balloons' ? 3 : 1);
        expect(
          lifted.every((balloon) => Number.isFinite(balloon.x) && Number.isFinite(balloon.y)),
        ).toBe(true);
        expect(lifted.every((balloon) => !isBalloonResting(balloon))).toBe(true);
      },
    );
  });

  it('honours an explicit balloon count independently of the profile', () => {
    expect(
      createInitialBalloons(bounds, {
        rng: () => 0.5,
        config: { profile: 'direct-touch', balloonCount: 2 },
      }),
    ).toHaveLength(2);
  });

  it('uses a slower, stable but playable reduced-motion step', () => {
    const balloon = createBalloon(bounds, {
      rng: () => 0.5,
      config: { profile: 'large-and-slow' },
    });
    const normal = stepBalloons([balloon], bounds, 1 / 30, 1000, { profile: 'large-and-slow' });
    const reduced = stepBalloons([balloon], bounds, 1 / 30, 1000, {
      profile: 'large-and-slow',
      reducedMotion: true,
    });

    expect(reduced.balloons).toHaveLength(1);
    expect(reduced.balloons[0].y).toBeLessThanOrEqual(normal.balloons[0].y);
    expect(reduced.popped).toBe(0);
  });

  it('separates overlapping balloons and transfers velocity on collision', () => {
    const first: KeepyUppyBalloon = {
      id: '1',
      x: 150,
      y: 200,
      vx: 20,
      vy: 0,
      radius: 34,
      color: '#fff',
      groundedAt: null,
    };
    const second: KeepyUppyBalloon = {
      id: '2',
      x: 180,
      y: 200,
      vx: -20,
      vy: 0,
      radius: 34,
      color: '#fff',
      groundedAt: null,
    };

    const result = stepBalloons([first, second], bounds, 1 / 30, 2000);
    const [nextFirst, nextSecond] = result.balloons;
    const separation = Math.hypot(nextSecond.x - nextFirst.x, nextSecond.y - nextFirst.y);

    expect(separation).toBeGreaterThanOrEqual(nextFirst.radius + nextSecond.radius - 0.001);
    expect(nextFirst.vx).toBeLessThan(first.vx);
    expect(nextSecond.vx).toBeGreaterThan(second.vx);
  });

  it('generates a palette that excludes background tokens and keeps new balloons unique', () => {
    const theme: ThemeColors = {
      background: '#000',
      cardBack: '#CCCCCC',
      cardFront: '#FFFFFF',
      text: '#111111',
      textLight: '#222222',
      primary: '#AAA',
      secondary: '#BBB',
      success: '#SSSS',
      matched: '#MMM',
      surfaceGame: '#SUR',
      surface: '#SUR2',
      surfaceElevated: '#SUR3',
      border: '#BORD',
      borderSubtle: '#BORD2',
      overlay: '#OL',
      accent: '#ACC',
      danger: '#DNG',
    };
    const palette = resolveBalloonPalette(theme);
    expect(palette).not.toContain(theme.success);
    expect(palette).not.toContain(theme.cardFront);
    expect(palette).not.toContain(theme.cardBack);

    const first = addBalloon([], bounds, { colors: theme, rng: () => 0 });
    const second = addBalloon(first, bounds, { colors: theme, rng: () => 0 });
    // second contains two balloons; make sure the newly appended one differs
    expect(second[0].color).not.toBe(second[1].color);
  });

  describe('edge cases', () => {
    it('resolves balloon palette with empty forbidden set', () => {
      // When no balloon colors match the forbidden set
      const theme: ThemeColors = {
        background: '#000',
        cardBack: '#FFFFFF',
        cardFront: '#EEEEEE',
        text: '#111111',
        textLight: '#222222',
        primary: '#FF0000',
        secondary: '#00FF00',
        success: '#0000FF',
        matched: '#MMM',
        surfaceGame: '#SUR',
        surface: '#SUR2',
        surfaceElevated: '#SUR3',
        border: '#BORD',
        borderSubtle: '#BORD2',
        overlay: '#OL',
        accent: '#ACC',
        danger: '#DNG',
      };
      const palette = resolveBalloonPalette(theme);
      // All balloon palette colors should be present since they don't match forbidden
      expect(palette.length).toBeGreaterThan(0);
    });

    it('addBalloon returns same array when at max capacity', () => {
      const balloons = [
        createBalloon(bounds, { colors: PASTEL_COLORS }),
        createBalloon(bounds, { colors: PASTEL_COLORS }),
        createBalloon(bounds, { colors: PASTEL_COLORS }),
      ];
      const result = addBalloon(balloons, bounds, { colors: PASTEL_COLORS });
      expect(result).toBe(balloons);
      expect(result).toHaveLength(3);
    });

    it('flickBalloon clamps duration to minimum', () => {
      const balloon: KeepyUppyBalloon = {
        id: 'test',
        x: 160,
        y: 220,
        vx: 0,
        vy: 0,
        radius: 34,
        color: '#fff',
        groundedAt: null,
      };

      // Very short duration should be clamped to 60ms
      const flicked = flickBalloon(balloon, 10, -10, 10);
      expect(flicked.vx).not.toBe(0);
      expect(flicked.vy).not.toBe(0);
    });

    it('stepBalloons clamps deltaSeconds', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'test',
          x: 160,
          y: 100,
          vx: 100,
          vy: 100,
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
      ];

      // Large delta should be clamped
      const { balloons: result } = stepBalloons(balloons, bounds, 10, 1000);
      expect(result[0].x).toBeGreaterThan(100);
      // But not as far as 10 seconds would take it
      expect(result[0].x).toBeLessThan(1000);
    });

    it('handles balloon bouncing off left wall', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'test',
          x: 30, // Close to left wall (radius = 34)
          y: 200,
          vx: -50, // Moving left
          vy: 0,
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
      ];

      const { balloons: result } = stepBalloons(balloons, bounds, 1 / 30, 1000);
      expect(result[0].x).toBeGreaterThanOrEqual(34);
      expect(result[0].vx).toBeGreaterThan(0); // Should bounce back
    });

    it('handles balloon bouncing off right wall', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'test',
          x: 290, // Close to right wall (width - radius = 320 - 34 = 286)
          y: 200,
          vx: 50, // Moving right
          vy: 0,
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
      ];

      const { balloons: result } = stepBalloons(balloons, bounds, 1 / 30, 1000);
      expect(result[0].x).toBeLessThanOrEqual(286);
      expect(result[0].vx).toBeLessThan(0); // Should bounce back
    });

    it('handles balloon bouncing off ceiling', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'test',
          x: 160,
          y: 40, // Close to ceiling (radius = 34)
          vx: 0,
          vy: -100, // Moving up
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
      ];

      const { balloons: result } = stepBalloons(balloons, bounds, 1 / 30, 1000);
      expect(result[0].y).toBeGreaterThanOrEqual(34);
      // Balloon should be positioned at ceiling and velocity should be handled
      expect(result[0].vy).toBeDefined();
    });

    it('clears groundedAt when balloon leaves ground', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'test',
          x: 160,
          y: 446, // Just above floor (480 - 34 = 446)
          vx: 0,
          vy: -50, // Moving up
          radius: 34,
          color: '#fff',
          groundedAt: 1000,
        },
      ];

      const { balloons: result } = stepBalloons(balloons, bounds, 1 / 30, 2000);
      expect(result[0].groundedAt).toBeNull();
    });

    it('separates balloons at exact same position for edge recovery', () => {
      const balloons: KeepyUppyBalloon[] = [
        {
          id: 'a',
          x: 160,
          y: 200,
          vx: 0,
          vy: 0,
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
        {
          id: 'b',
          x: 160, // Same position as a (distance = 0)
          y: 200,
          vx: 0,
          vy: 0,
          radius: 34,
          color: '#fff',
          groundedAt: null,
        },
      ];

      const { balloons: result } = stepBalloons(balloons, bounds, 1 / 30, 1000);
      expect(result[0].x).not.toBe(result[1].x);
      expect(
        Math.hypot(result[1].x - result[0].x, result[1].y - result[0].y),
      ).toBeGreaterThanOrEqual(result[0].radius + result[1].radius - 0.001);
    });

    it('handles velocity clamping in flickBalloon', () => {
      const balloon: KeepyUppyBalloon = {
        id: 'test',
        x: 160,
        y: 220,
        vx: 0,
        vy: 0,
        radius: 34,
        color: '#fff',
        groundedAt: null,
      };

      // Extreme flick should be clamped
      const flicked = flickBalloon(balloon, 1000, -1000, 50);
      expect(flicked.vx).toBeLessThanOrEqual(KEEPY_UPPY_VELOCITY_LIMITS.horizontal);
      expect(flicked.vx).toBeGreaterThanOrEqual(-KEEPY_UPPY_VELOCITY_LIMITS.horizontal);
      expect(flicked.vy).toBeGreaterThanOrEqual(-KEEPY_UPPY_VELOCITY_LIMITS.upward);
      expect(flicked.vy).toBeLessThanOrEqual(KEEPY_UPPY_VELOCITY_LIMITS.downward);
    });

    it('handles velocity clamping in tapBalloon', () => {
      const balloon: KeepyUppyBalloon = {
        id: 'test',
        x: 160,
        y: 220,
        vx: 200,
        vy: 200,
        radius: 34,
        color: '#fff',
        groundedAt: null,
      };

      // Tap should clamp velocities
      const tapped = tapBalloon(balloon, 100, 100);
      expect(tapped.vx).toBeLessThanOrEqual(KEEPY_UPPY_VELOCITY_LIMITS.horizontal);
      expect(tapped.vx).toBeGreaterThanOrEqual(-KEEPY_UPPY_VELOCITY_LIMITS.horizontal);
      expect(tapped.vy).toBeGreaterThanOrEqual(-KEEPY_UPPY_VELOCITY_LIMITS.upward);
      expect(tapped.vy).toBeLessThanOrEqual(KEEPY_UPPY_VELOCITY_LIMITS.downward);
    });
  });
});
