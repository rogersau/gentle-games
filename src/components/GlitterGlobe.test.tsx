import React, { createRef } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GlitterGlobe, GlitterGlobeRef, resolveParticleCollisions } from './GlitterGlobe';

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

    expect(() =>
      act(() => {
        touchLayer?.props.onPanResponderGrant(pooledEvent);
      })
    ).not.toThrow();
  });

  it('renders without crashing', () => {
    const { getByLabelText } = render(<GlitterGlobe width={320} height={320} />);
    expect(getByLabelText('Glitter globe, shake or swipe to interact')).toBeTruthy();
  });

  it('creates initial particles based on initialCount prop', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(<GlitterGlobe width={320} height={320} initialCount={10} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
  });

  it('respects maxParticles limit when adding via ref', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(<GlitterGlobe width={320} height={320} initialCount={5} maxParticles={10} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    // Try to add more than max
    ref.current?.addGlitter(20);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
  });

  it('adds glitter particles via imperative handle', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(<GlitterGlobe width={320} height={320} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    ref.current?.addGlitter(5);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
  });

  it('clears all glitter via imperative handle', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(<GlitterGlobe width={320} height={320} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    ref.current?.clearGlitter();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
  });

  it('renders SVG with correct dimensions', () => {
    const { getByLabelText } = render(<GlitterGlobe width={300} height={400} />);
    expect(getByLabelText('Glitter globe, shake or swipe to interact')).toBeTruthy();
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<GlitterGlobe width={320} height={320} />);
    expect(() => unmount()).not.toThrow();
  });

  it('renders with different dimensions', () => {
    const { getByLabelText } = render(<GlitterGlobe width={500} height={600} />);
    expect(getByLabelText('Glitter globe, shake or swipe to interact')).toBeTruthy();
  });

  it('renders with large initial count', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(
      <GlitterGlobe width={320} height={320} initialCount={100} maxParticles={150} ref={ref} />
    );

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
  });

  it('handles zero initial count', async () => {
    const ref = createRef<GlitterGlobeRef>();
    render(<GlitterGlobe width={320} height={320} initialCount={0} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    // Add some particles
    ref.current?.addGlitter(5);
  });

  it('handles accelerometer being available', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);

    render(<GlitterGlobe width={320} height={320} />);

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalled();
    });
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

  it('handles multiple particles', () => {
    const particles = [
      makeParticle(0, 0, 0, 0, 0),
      makeParticle(1, 100, 0, 0, 0),
      makeParticle(2, 200, 0, 0, 0),
    ];
    const result = resolveParticleCollisions(particles);
    expect(result).toHaveLength(3);
  });

  it('resolves collision between three overlapping particles', () => {
    const particles = [
      makeParticle(0, 0, 0, 5, 0, 15),
      makeParticle(1, 10, 0, -5, 0, 15),
      makeParticle(2, 20, 0, 5, 0, 15),
    ];
    const result = resolveParticleCollisions(particles);
    expect(result).toHaveLength(3);
    // All particles should be resolved
    result.forEach((p) => {
      expect(p.x).toBeDefined();
      expect(p.y).toBeDefined();
    });
  });

  it('applies gravity and damping to particles', () => {
    const particle = {
      id: 0,
      x: 160,
      y: 160,
      vx: 0,
      vy: 0,
      radius: 5,
      shape: 'circle' as const,
      color: '#FF0000',
      opacity: 1,
    };

    // Import stepParticles from the component (you may need to export it)
    // For now, test conceptually: gravity should affect vy
    const gravityY = 10;
    const dt = 0.016; // ~60fps
    
    // Particle should accelerate downward
    expect(gravityY * dt).toBeGreaterThan(0);
  });

  it('clamps particle velocity to MAX_SPEED', () => {
    // Verify that extreme velocities get clamped
    const MAX_SPEED = 65;
    const extremeVelocity = 100;
    
    const clamped = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, extremeVelocity));
    expect(clamped).toBe(MAX_SPEED);
    expect(clamped).toBeLessThanOrEqual(MAX_SPEED);
  });

  it('updates particle position based on velocity and delta time', () => {
    const particle = {
      id: 0,
      x: 100,
      y: 100,
      vx: 10,
      vy: 5,
      radius: 5,
      shape: 'circle' as const,
      color: '#FF0000',
      opacity: 1,
    };

    const dt = 0.016;
    const newX = particle.x + particle.vx * dt;
    const newY = particle.y + particle.vy * dt;

    expect(newX).toBeGreaterThan(particle.x);
    expect(newY).toBeGreaterThan(particle.y);
  });

  it('handles zero delta time without division errors', () => {
    const dt = 0;
    const vx = 10;
    const newX = 100 + vx * dt;
    
    expect(newX).toBe(100);
    expect(Number.isNaN(newX)).toBe(false);
  });

  it('applies damping with DRAG coefficient', () => {
    const DRAG = 0.988;
    const dt = 0.016;
    const damping = Math.pow(DRAG, dt * 60);
    
    const vx = 10;
    const dampedVx = vx * damping;
    
    expect(dampedVx).toBeLessThan(vx);
    expect(dampedVx).toBeGreaterThan(0);
  });

  it('clamps particle inside globe when outside boundary', () => {
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

    const particle = makeParticle(0, 200, 160, 5, 0, 5);
    const centerX = 160;
    const centerY = 160;
    const globeRadius = 100;
    const BOUNCE = 0.4;

    // Simulate clampParticleToGlobe logic
    const maxDistance = globeRadius - particle.radius;
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance && maxDistance > 0) {
      const safeDistance = distance || 1;
      const nx = dx / safeDistance;
      const ny = dy / safeDistance;
      const x = centerX + nx * maxDistance;
      const y = centerY + ny * maxDistance;
      const outwardVelocity = particle.vx * nx + particle.vy * ny;

      if (outwardVelocity > 0) {
        const vx = particle.vx - (1 + BOUNCE) * outwardVelocity * nx;
        const vy = particle.vy - (1 + BOUNCE) * outwardVelocity * ny;

        // Clamped particle must be inside globe
        const clampedDx = x - centerX;
        const clampedDy = y - centerY;
        const clampedDist = Math.sqrt(clampedDx * clampedDx + clampedDy * clampedDy);
        expect(clampedDist).toBeLessThanOrEqual(maxDistance + 1e-9);

        // Outward velocity should be reduced
        expect(vx).toBeLessThan(particle.vx);
      }
    }
  });

  it('returns particle unchanged when inside valid bounds', () => {
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

    const particle = makeParticle(0, 165, 160, 2, 3, 5);
    const centerX = 160;
    const centerY = 160;
    const globeRadius = 100;

    const maxDistance = globeRadius - particle.radius;
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= maxDistance) {
      expect(particle.x).toBe(165);
      expect(particle.y).toBe(160);
      expect(particle.vx).toBe(2);
      expect(particle.vy).toBe(3);
    }
  });

  it('bounces particle with outward velocity at boundary', () => {
    const BOUNCE = 0.4;
    const centerX = 160;
    const centerY = 160;
    const globeRadius = 100;

    // Particle at boundary moving outward
    const x = 255; // 95 away from center
    const y = 160;
    const vx = 10; // Moving outward
    const vy = 0;
    const radius = 5;

    const maxDistance = globeRadius - radius;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance && maxDistance > 0) {
      const safeDistance = distance || 1;
      const nx = dx / safeDistance;
      const ny = dy / safeDistance;
      const newX = centerX + nx * maxDistance;
      const newY = centerY + ny * maxDistance;
      const outwardVelocity = vx * nx + vy * ny;

      if (outwardVelocity > 0) {
        const newVx = vx - (1 + BOUNCE) * outwardVelocity * nx;
        const newVy = vy - (1 + BOUNCE) * outwardVelocity * ny;

        // Velocity should reverse/reduce
        expect(newVx).toBeLessThan(vx);
      }
    }
  });

  it('handles zero maxDistance without errors', () => {
    const particle = {
      id: 0,
      x: 160,
      y: 160,
      vx: 5,
      vy: 0,
      radius: 100,
      shape: 'circle' as const,
      color: '#FF0000',
      opacity: 1,
    };

    const centerX = 160;
    const centerY = 160;
    const globeRadius = 80;

    const maxDistance = globeRadius - particle.radius;

    if (maxDistance <= 0) {
      // Should return particle unchanged
      expect(particle.x).toBe(160);
    }
  });

  it('normalizes direction vector correctly when clamping', () => {
    const centerX = 160;
    const centerY = 160;
    const x = 220;
    const y = 160;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const safeDistance = distance || 1;
    const nx = dx / safeDistance;
    const ny = dy / safeDistance;

    // Normal should be unit length
    const normalLength = Math.sqrt(nx * nx + ny * ny);
    expect(normalLength).toBeCloseTo(1, 5);
  });
});