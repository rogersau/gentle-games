import { renderHook, act } from '@testing-library/react-native';
import { usePatternTrainUI } from './usePatternTrainUI';

describe('usePatternTrainUI', () => {
  it('starts with no celebration', () => {
    const { result } = renderHook(() => usePatternTrainUI());
    expect(result.current.showCelebration).toBe(false);
    expect(result.current.celebrationPhrase).toBe('');
  });

  it('tracks milestone count', () => {
    const { result } = renderHook(() => usePatternTrainUI());
    expect(result.current.milestoneCount).toBe(0);
  });

  it('resets on unmount', () => {
    const { unmount } = renderHook(() => usePatternTrainUI());
    expect(() => unmount()).not.toThrow();
  });

  it('gives the latest celebration a full duration and cancels its timer on unmount', () => {
    jest.useFakeTimers();
    try {
      const { result, unmount } = renderHook(() => usePatternTrainUI({ milestoneInterval: 1 }));
      act(() => result.current.onPatternComplete());
      const firstPhrase = result.current.celebrationPhrase;
      act(() => jest.advanceTimersByTime(2000));
      act(() => result.current.onPatternComplete());
      expect(result.current.celebrationPhrase).not.toBe(firstPhrase);
      act(() => jest.advanceTimersByTime(1000));
      expect(result.current.showCelebration).toBe(true);
      act(() => jest.advanceTimersByTime(2000));
      expect(result.current.showCelebration).toBe(false);
      act(() => result.current.onPatternComplete());
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
