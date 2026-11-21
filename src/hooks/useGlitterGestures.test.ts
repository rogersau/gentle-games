import { act, renderHook } from '@testing-library/react-native';
import { useGlitterGestures } from './useGlitterGestures';

describe('useGlitterGestures', () => {
  it('provides a shake handler', () => {
    const onShake = jest.fn();
    const { result } = renderHook(() => useGlitterGestures({ onShake }));
    expect(typeof result.current.handleShake).toBe('function');
  });

  it('cleans up listeners on unmount', () => {
    const onShake = jest.fn();
    const { unmount } = renderHook(() => useGlitterGestures({ onShake }));
    expect(() => unmount()).not.toThrow();
  });

  it('does not respond to a shake when shake response is disabled', () => {
    const onShake = jest.fn();
    const { result } = renderHook(() => useGlitterGestures({ onShake, enabled: false }));

    act(() => {
      result.current.handleShake();
    });

    expect(onShake).not.toHaveBeenCalled();
  });
});
