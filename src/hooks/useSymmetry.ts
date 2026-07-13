import { useMemo } from 'react';

type SymmetryMode = 'none' | 'half' | 'quarter';

export function useSymmetry(symmetryMode: SymmetryMode) {
  const getSymmetryOffsets = useMemo(() => {
    return (): Array<[number, number]> => {
      switch (symmetryMode) {
        case 'half':
          return [[1, 1], [-1, 1]];
        case 'quarter':
          return [[1, 1], [-1, 1], [1, -1], [-1, -1]];
        case 'none':
        default:
          return [[1, 1]];
      }
    };
  }, [symmetryMode]);

  return { getSymmetryOffsets };
}
