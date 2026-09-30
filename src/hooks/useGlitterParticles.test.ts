import { renderHook, act } from '@testing-library/react-native';
import { useGlitterParticles } from './useGlitterParticles';

describe('useGlitterParticles', () => {
  it('initializes particles without requiring animation to start', () => {
    const { result } = renderHook(() =>
      useGlitterParticles({
        particleCount: 20,
        canvasWidth: 400,
        canvasHeight: 400,
      }),
    );
    expect(result.current.particles).toHaveLength(20);
    expect(result.current.ripples).toEqual([]);
  });

  it('provides start and stop animation', () => {
    const { result } = renderHook(() =>
      useGlitterParticles({
        particleCount: 20,
        canvasWidth: 400,
        canvasHeight: 400,
      }),
    );
    expect(typeof result.current.startAnimation).toBe('function');
    expect(typeof result.current.stopAnimation).toBe('function');
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() =>
      useGlitterParticles({
        particleCount: 20,
        canvasWidth: 400,
        canvasHeight: 400,
      }),
    );
    expect(() => unmount()).not.toThrow();
  });

  it('caps physics and rendering at 30 updates per second and cancels the animation', () => {
    let frame!: FrameRequestCallback;
    const raf = jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 123;
    });
    const cancel = jest.spyOn(global, 'cancelAnimationFrame');
    const resolveCollisions = jest.fn((particles) => particles);
    try {
      const { result, unmount } = renderHook(() =>
        useGlitterParticles({
          particleCount: 20,
          canvasWidth: 400,
          canvasHeight: 400,
          resolveCollisions,
        }),
      );
      act(() => result.current.startAnimation());
      act(() => frame(0));
      const initial = result.current.particles;
      act(() => frame(1000 / 60));
      expect(result.current.particles).toBe(initial);
      expect(resolveCollisions).not.toHaveBeenCalled();
      act(() => frame(1000 / 30));
      expect(result.current.particles).not.toBe(initial);
      expect(resolveCollisions).toHaveBeenCalledTimes(1);
      act(() => frame(1000 / 20));
      expect(resolveCollisions).toHaveBeenCalledTimes(1);
      act(() => frame(1000 / 15));
      expect(resolveCollisions).toHaveBeenCalledTimes(2);
      unmount();
      expect(cancel).toHaveBeenCalledWith(123);
    } finally {
      raf.mockRestore();
      cancel.mockRestore();
    }
  });

  it('keeps particle identities and relative positions inside the globe after resize while paused', () => {
    const { result, rerender } = renderHook(
      ({ size }: { size: number }) =>
        useGlitterParticles({ particleCount: 20, canvasWidth: size, canvasHeight: size }),
      { initialProps: { size: 400 } },
    );
    const previous = result.current.particles;
    rerender({ size: 200 });
    expect(result.current.particles.map(({ id }) => id)).toEqual(previous.map(({ id }) => id));
    result.current.particles.forEach((particle, index) => {
      const scale = (90 - particle.radius) / (190 - particle.radius);
      expect(particle.x).toBeCloseTo(100 + (previous[index].x - 200) * scale);
      expect(particle.y).toBeCloseTo(100 + (previous[index].y - 200) * scale);
      expect(Math.hypot(particle.x - 100, particle.y - 100)).toBeLessThanOrEqual(
        90 - particle.radius,
      );
    });
  });
});
