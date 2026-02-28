import React from 'react';
import { render } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GlitterGlobe, resolveParticleCollisions } from './GlitterGlobe';

const mockIsAvailableAsync: jest.MockedFunction<() => Promise<boolean>> = jest.fn();
const mockSetUpdateInterval = jest.fn();
const mockAddListener = jest.fn();

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: () => mockIsAvailableAsync(),
    setUpdateInterval: (...args: unknown[]) => mockSetUpdateInterval(...args),
    addListener: (...args: unknown[]) => mockAddListener(...args),
  },
}));

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      cardBack: '#E8E4E1',
      cardFront: '#FFFFFF',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      success: '#B8E6B8',
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

describe('GlitterGlobe', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeAll(() => {
    globalThis.requestAnimationFrame = jest.fn(() => 1) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = jest.fn() as typeof globalThis.cancelAnimationFrame;
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(false);
    mockAddListener.mockReturnValue({ remove: jest.fn() });
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers } as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads nativeEvent only once in grant handler', () => {
    const screen = render(<GlitterGlobe width={320} height={320} />);

    const touchLayer = screen
      .UNSAFE_getAllByType(View)
      .find((node) => typeof node.props.onPanResponderGrant === 'function');

    expect(touchLayer).toBeTruthy();

    let canReadNativeEvent = true;
    const pooledEvent: { nativeEvent?: { locationX: number; locationY: number } | null } = {};

    Object.defineProperty(pooledEvent, 'nativeEvent', {
      get: () => {
        if (!canReadNativeEvent) {
          return null;
        }
        canReadNativeEvent = false;
        return {
          locationX: 160,
          locationY: 160,
        };
      },
    });

    expect(() => touchLayer?.props.onPanResponderGrant(pooledEvent)).not.toThrow();
  });
});

describe('resolveParticleCollisions', () => {
  const makeParticle = (
    id: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius = 5
  ) => ({
    id,
    x,
    y,
    vx,
    vy,
    radius,
    shape: 'circle' as const,
    color: '#FF0000',
    opacity: 1,
  });

  it('returns particles unchanged when fewer than 2', () => {
    const single = [makeParticle(0, 50, 50, 0, 0)];
    expect(resolveParticleCollisions(single)).toEqual(single);
    expect(resolveParticleCollisions([])).toEqual([]);
  });

  it('separates two overlapping particles and applies impulse', () => {
    // Two particles with radius 5 placed only 4px apart (overlapping by 6px total)
    // Moving toward each other so dvn > 0 and impulse fires
    const p0 = makeParticle(0, 0, 0, 5, 0);
    const p1 = makeParticle(1, 4, 0, -5, 0);
    const result = resolveParticleCollisions([p0, p1]);

    // After resolution they must be at least minDist (10) apart
    const dx = result[1].x - result[0].x;
    const dy = result[1].y - result[0].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThanOrEqual(10 - 1e-9);

    // Impulse should have reversed/reduced the approaching velocities
    expect(result[0].vx).toBeLessThan(p0.vx);
    expect(result[1].vx).toBeGreaterThan(p1.vx);
  });

  it('handles distSq === 0 (exact same position) without NaN', () => {
    const p0 = makeParticle(0, 50, 50, -3, 0);
    const p1 = makeParticle(1, 50, 50, 3, 0);
    const result = resolveParticleCollisions([p0, p1]);

    expect(Number.isNaN(result[0].x)).toBe(false);
    expect(Number.isNaN(result[0].y)).toBe(false);
    expect(Number.isNaN(result[1].x)).toBe(false);
    expect(Number.isNaN(result[1].y)).toBe(false);

    // Particles must be separated
    const dx = result[1].x - result[0].x;
    const dy = result[1].y - result[0].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThan(0);
  });

  it('leaves non-overlapping particles unchanged', () => {
    const p0 = makeParticle(0, 0, 0, 0, 0);
    const p1 = makeParticle(1, 20, 0, 0, 0); // 20px apart, radii sum = 10
    const result = resolveParticleCollisions([p0, p1]);
    expect(result[0]).toEqual(p0);
    expect(result[1]).toEqual(p1);
  });
});
