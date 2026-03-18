import { renderHook, act } from '@testing-library/react-native';
import { useMochi } from './useMochi';
import { MochiProvider } from '../context/MochiContext';

describe('useMochi', () => {
  it('shows mochi with idle variant', () => {
    const { result } = renderHook(() => useMochi(), { wrapper: MochiProvider });
    act(() => result.current.showMochi());
    expect(result.current.mochiProps.visible).toBe(true);
    expect(result.current.mochiProps.variant).toBe('idle');
  });

  it('celebrates and returns to idle after 1.5s', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useMochi(), { wrapper: MochiProvider });
    act(() => result.current.celebrate());
    expect(result.current.mochiProps.variant).toBe('happy');
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(result.current.mochiProps.variant).toBe('idle');
    jest.useRealTimers();
  });

  it('hides mochi', () => {
    const { result } = renderHook(() => useMochi(), { wrapper: MochiProvider });
    act(() => result.current.showMochi());
    act(() => result.current.hideMochi());
    expect(result.current.mochiProps.visible).toBe(false);
  });
});
