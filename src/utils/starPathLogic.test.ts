import {
  applyStarPathTilt,
  clampStarPathPoint,
  collectStarPathItems,
  createStarPathCollectibles,
} from './starPathLogic';

describe('starPathLogic', () => {
  it('creates collectible path points in bounds', () => {
    const items = createStarPathCollectibles(320, 420, 5);
    expect(items).toHaveLength(5);
    expect(items.every((item) => item.x >= 0 && item.y >= 0)).toBe(true);
  });

  it('clamps movement to board bounds', () => {
    expect(clampStarPathPoint({ x: -20, y: 999 }, 300, 400)).toEqual({ x: 18, y: 382 });
  });

  it('collects nearby items and applies tilt movement', () => {
    const items = [
      { id: 'a', x: 100, y: 100, collected: false },
      { id: 'b', x: 220, y: 220, collected: false },
    ];
    const collectResult = collectStarPathItems(items, { x: 108, y: 96 }, 20);
    expect(collectResult.collectedNow).toBe(1);
    expect(collectResult.items[0].collected).toBe(true);

    const moved = applyStarPathTilt({ x: 150, y: 150 }, 1, -1, 12, 300, 300);
    expect(moved.x).toBeGreaterThan(150);
    expect(moved.y).toBeLessThan(150);
  });
});

