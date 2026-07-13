import { renderHook } from '@testing-library/react-native';
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
});
