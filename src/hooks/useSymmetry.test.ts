import { renderHook } from '@testing-library/react-native';
import { useSymmetry } from './useSymmetry';

describe('useSymmetry', () => {
  it('returns single offset for none mode', () => {
    const { result } = renderHook(() => useSymmetry('none'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toEqual([[1, 1]]);
  });

  it('returns two offsets for half mode', () => {
    const { result } = renderHook(() => useSymmetry('half'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toHaveLength(2);
    expect(offsets).toContainEqual([1, 1]);
    expect(offsets).toContainEqual([-1, 1]);
  });

  it('returns four offsets for quarter mode', () => {
    const { result } = renderHook(() => useSymmetry('quarter'));
    const offsets = result.current.getSymmetryOffsets();
    expect(offsets).toHaveLength(4);
    expect(offsets).toContainEqual([1, 1]);
    expect(offsets).toContainEqual([-1, 1]);
    expect(offsets).toContainEqual([1, -1]);
    expect(offsets).toContainEqual([-1, -1]);
  });

  it('updates offsets when symmetry mode changes', () => {
    const { result, rerender } = renderHook(
      ({ mode }) => useSymmetry(mode),
      { initialProps: { mode: 'none' as const } }
    );
    expect(result.current.getSymmetryOffsets()).toHaveLength(1);

    rerender({ mode: 'half' });
    expect(result.current.getSymmetryOffsets()).toHaveLength(2);

    rerender({ mode: 'quarter' });
    expect(result.current.getSymmetryOffsets()).toHaveLength(4);
  });
});
