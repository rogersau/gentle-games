import { renderHook } from '@testing-library/react-native';
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
});
