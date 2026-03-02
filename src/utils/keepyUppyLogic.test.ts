import {
  addBalloon,
  flickBalloon,
  GROUND_POP_DELAY_MS,
  MAX_BALLOONS,
  KeepyUppyBalloon,
  stepBalloons,
  tapBalloon,
  resolveBalloonPalette,
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

  it('gives a brief ground grace period before popping', () => {
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

    const beforePop = stepBalloons([balloon], bounds, 1 / 30, 1000 + GROUND_POP_DELAY_MS - 1);
    const afterPop = stepBalloons([balloon], bounds, 1 / 30, 1000 + GROUND_POP_DELAY_MS + 1);

    expect(beforePop.balloons).toHaveLength(1);
    expect(afterPop.balloons).toHaveLength(0);
    expect(afterPop.popped).toBe(1);
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
});
