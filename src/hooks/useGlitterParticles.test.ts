import { renderHook, act } from '@testing-library/react-native';
import { useGlitterParticles } from './useGlitterParticles';

describe('useGlitterParticles', () => {
  it('starts with empty particles', () => {
    const { result } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(result.current.particles).toEqual([]);
    expect(result.current.ripples).toEqual([]);
  });

  it('provides start and stop animation', () => {
    const { result } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(typeof result.current.startAnimation).toBe('function');
    expect(typeof result.current.stopAnimation).toBe('function');
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useGlitterParticles({
      particleCount: 20,
      canvasWidth: 400,
      canvasHeight: 400,
    }));
    expect(() => unmount()).not.toThrow();
  });
});