import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { Breakpoint } from './tokens';

export type LayoutBreakpoint = 'compact' | 'medium' | 'expanded';

export interface LayoutInfo {
  /** Current breakpoint name */
  breakpoint: LayoutBreakpoint;
  /** True on tablet-sized screens (≥600px) */
  isTablet: boolean;
  /** True when width > height */
  isLandscape: boolean;
  /** Screen width */
  screenWidth: number;
  /** Screen height */
  screenHeight: number;
  /** Max content width (centered on large screens) */
  contentWidth: number;
  /** Number of columns for grid layouts */
  gridColumns: number;
}

const getBreakpoint = (width: number): LayoutBreakpoint => {
  if (width >= Breakpoint.expanded) return 'expanded';
  if (width >= Breakpoint.medium) return 'medium';
  return 'compact';
};

const getContentWidth = (screenWidth: number, breakpoint: LayoutBreakpoint): number => {
  switch (breakpoint) {
    case 'expanded':
      return Math.min(screenWidth - 64, 720);
    case 'medium':
      return Math.min(screenWidth - 48, 560);
    default:
      return screenWidth;
  }
};

const getGridColumns = (breakpoint: LayoutBreakpoint): number => {
  switch (breakpoint) {
    case 'expanded':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
};

export const useLayout = (): LayoutInfo => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    return {
      breakpoint,
      isTablet: width >= Breakpoint.medium,
      isLandscape: width > height,
      screenWidth: width,
      screenHeight: height,
      contentWidth: getContentWidth(width, breakpoint),
      gridColumns: getGridColumns(breakpoint),
    };
  }, [width, height]);
};
