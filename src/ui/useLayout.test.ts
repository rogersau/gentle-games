import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import { useLayout } from './useLayout';

// Mock react-native
jest.mock('react-native', () => ({
  useWindowDimensions: jest.fn(),
  Platform: {
    OS: 'ios',
  },
}));

// Mock tokens
jest.mock('./tokens', () => ({
  Breakpoint: {
    compact: 0,
    medium: 600,
    expanded: 840,
  },
}));

describe('useLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns compact breakpoint for small screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 812,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('compact');
    expect(result.current.isTablet).toBe(false);
    expect(result.current.gridColumns).toBe(1);
    expect(result.current.screenWidth).toBe(375);
    expect(result.current.screenHeight).toBe(812);
  });

  it('returns medium breakpoint for tablet-sized screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 768,
      height: 1024,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('medium');
    expect(result.current.isTablet).toBe(true);
    expect(result.current.gridColumns).toBe(2);
  });

  it('returns expanded breakpoint for large screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 1200,
      height: 800,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('expanded');
    expect(result.current.isTablet).toBe(true);
    expect(result.current.gridColumns).toBe(2);
  });

  it('correctly identifies landscape orientation', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 1024,
      height: 768,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.isLandscape).toBe(true);
  });

  it('correctly identifies portrait orientation', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 768,
      height: 1024,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.isLandscape).toBe(false);
  });

  it('calculates content width for compact screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 812,
    });

    const { result } = renderHook(() => useLayout());

    // For compact, content width equals screen width
    expect(result.current.contentWidth).toBe(375);
  });

  it('calculates content width for medium screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 768,
      height: 1024,
    });

    const { result } = renderHook(() => useLayout());

    // For medium, content width is min(screenWidth - 48, 560)
    // 768 - 48 = 720, but capped at 560
    expect(result.current.contentWidth).toBe(560);
  });

  it('calculates content width for expanded screens', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 1200,
      height: 800,
    });

    const { result } = renderHook(() => useLayout());

    // For expanded, content width is min(screenWidth - 64, 720)
    // 1200 - 64 = 1136, but capped at 720
    expect(result.current.contentWidth).toBe(720);
  });

  it('updates when dimensions change', () => {
    // Start with compact
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 812,
    });

    const { result, rerender } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('compact');

    // Change to medium
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 768,
      height: 1024,
    });

    rerender(undefined);

    expect(result.current.breakpoint).toBe('medium');
  });

  it('handles exact breakpoint boundaries', () => {
    // Test at exactly 600px (medium boundary)
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 600,
      height: 800,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('medium');
  });

  it('handles edge case at 0 width', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 0,
      height: 800,
    });

    const { result } = renderHook(() => useLayout());

    expect(result.current.breakpoint).toBe('compact');
    expect(result.current.contentWidth).toBe(0);
  });
});
