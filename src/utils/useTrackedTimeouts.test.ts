import { act, renderHook } from '@testing-library/react-native';
import { useTrackedTimeouts } from './useTrackedTimeouts';

describe('useTrackedTimeouts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs queued callbacks once and removes completed timer IDs from the registry', () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();
    const { result } = renderHook(() => useTrackedTimeouts());

    act(() => {
      result.current.queueTimeout(firstCallback, 100);
      result.current.queueTimeout(secondCallback, 200);
    });

    expect(result.current.pendingTimeoutCount).toBe(2);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).not.toHaveBeenCalled();
    expect(result.current.pendingTimeoutCount).toBe(1);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(secondCallback).toHaveBeenCalledTimes(1);
    expect(result.current.pendingTimeoutCount).toBe(0);
  });

  it('cancels pending callbacks via clearAllTimeouts and during unmount cleanup', () => {
    const clearedCallback = jest.fn();
    const unmountedCallback = jest.fn();
    const { result, unmount } = renderHook(() => useTrackedTimeouts());

    act(() => {
      result.current.queueTimeout(clearedCallback, 100);
    });

    act(() => {
      result.current.clearAllTimeouts();
    });

    expect(result.current.pendingTimeoutCount).toBe(0);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(clearedCallback).not.toHaveBeenCalled();

    act(() => {
      result.current.queueTimeout(unmountedCallback, 100);
    });

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(unmountedCallback).not.toHaveBeenCalled();
  });
});
