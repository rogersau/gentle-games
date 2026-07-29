import { act, renderHook } from '@testing-library/react-native';
import { useGlitterGestures } from './useGlitterGestures';

describe('useGlitterGestures', () => {
  it('provides gesture handlers', () => {
    const onShake = jest.fn();
    const onWake = jest.fn();
    const { result } = renderHook(() => useGlitterGestures({ onShake, onWake }));
    expect(typeof result.current.handleShake).toBe('function');
    expect(typeof result.current.handleWake).toBe('function');
  });

  it('cleans up listeners on unmount', () => {
    const onShake = jest.fn();
    const onWake = jest.fn();
    const { unmount } = renderHook(() => useGlitterGestures({ onShake, onWake }));
    expect(() => unmount()).not.toThrow();
  });

  it('does not respond to a shake when shake response is disabled', () => {
    const onShake = jest.fn();
    const { result } = renderHook(() =>
      useGlitterGestures({ onShake, onWake: jest.fn(), enabled: false }),
    );

    act(() => {
      result.current.handleShake();
    });

    expect(onShake).not.toHaveBeenCalled();
  });
});
