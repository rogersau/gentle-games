import { calculateGameBoardSize } from './gameLayout';

describe('calculateGameBoardSize', () => {
  const options = {
    horizontalPadding: 24,
    verticalReserve: 148,
    compactMinHeight: 220,
    maxHeightRatio: 0.72,
  };

  it('fits a compact narrow viewport without the old hard width minimum', () => {
    const size = calculateGameBoardSize({ width: 240, height: 480 }, options);
    expect(size.width).toBe(216);
    expect(size.height).toBeLessThanOrEqual(332);
  });

  it('keeps a compact board reachable when height is short', () => {
    const size = calculateGameBoardSize({ width: 360, height: 260 }, options);
    expect(size.width).toBe(336);
    expect(size.height).toBe(options.compactMinHeight);
  });

  it('relayouts on rotation within the measured viewport', () => {
    const portrait = calculateGameBoardSize({ width: 390, height: 844 }, options);
    const landscape = calculateGameBoardSize({ width: 844, height: 390 }, options);
    expect(landscape.width).toBeGreaterThan(portrait.width);
    expect(landscape.height).toBeLessThan(portrait.height);
  });
});
