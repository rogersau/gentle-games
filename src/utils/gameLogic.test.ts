import { ANIMALS, MEMORY_SNAP_OBJECTS, Tile } from '../types';
import {
  checkGameComplete,
  checkMatch,
  calculateMemorySnapBoardSize,
  formatTime,
  generateTiles,
  generateMemorySnapTiles,
  getMemorySnapGridConfig,
  getGridConfig,
} from './gameLogic';

describe('gameLogic', () => {
  it('returns expected grid config by difficulty', () => {
    expect(getGridConfig('easy')).toEqual({ cols: 3, rows: 4, pairs: 6 });
    expect(getGridConfig('medium')).toEqual({ cols: 4, rows: 5, pairs: 10 });
    expect(getGridConfig('hard')).toEqual({ cols: 5, rows: 6, pairs: 15 });
  });

  it('generates exactly two tiles per selected value', () => {
    const tiles = generateTiles('easy', 'animals');
    expect(tiles).toHaveLength(12);

    const counts = tiles.reduce<Record<string, number>>((acc, tile) => {
      acc[tile.value] = (acc[tile.value] ?? 0) + 1;
      return acc;
    }, {});

    Object.values(counts).forEach((count) => {
      expect(count).toBe(2);
    });
    tiles.forEach((tile) => {
      expect(tile.isFlipped).toBe(false);
      expect(tile.isMatched).toBe(false);
    });
  });

  it.each([
    [2, 2, 2],
    [3, 2, 3],
    [4, 2, 4],
    [6, 3, 4],
    [10, 4, 5],
    [15, 5, 6],
  ] as const)('supports %i pairs on a %ix%i board', (pairs, cols, rows) => {
    expect(getMemorySnapGridConfig(pairs)).toEqual({ cols, rows, pairs });
    const tiles = generateMemorySnapTiles(pairs, 'animals', () => 0.25);
    expect(tiles).toHaveLength(pairs * 2);
    expect(
      Object.values(
        tiles.reduce<Record<string, number>>((counts, tile) => {
          counts[tile.value] = (counts[tile.value] ?? 0) + 1;
          return counts;
        }, {}),
      ),
    ).toEqual(Array.from({ length: pairs }, () => 2));
  });

  it('uses the injected random source for deterministic exact pairs', () => {
    const randomValues = [0.1, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4, 0.5, 0.9, 0.05];
    let index = 0;
    const random = () => randomValues[index++ % randomValues.length];
    const first = generateMemorySnapTiles(4, 'mixed', random);
    index = 0;
    const second = generateMemorySnapTiles(4, 'mixed', random);

    expect(first).toEqual(second);
    expect(first.map((tile) => tile.value).sort()).toEqual(first.map((tile) => tile.value).sort());
    expect(new Set(first.map((tile) => tile.value)).size).toBe(4);
  });

  it('keeps every board inside responsive viewport bounds', () => {
    ([2, 3, 4, 6, 10, 15] as const).forEach((pairs) => {
      const board = calculateMemorySnapBoardSize({ width: 320, height: 568 }, pairs);
      expect(board.width).toBeLessThanOrEqual(288);
      expect(board.height).toBeLessThanOrEqual(348);
      expect(board.tileSize).toBeGreaterThan(0);
    });
  });

  it('prioritizes animals in mixed theme', () => {
    const tiles = generateTiles('medium', 'mixed');
    const animalTiles = tiles.filter((tile) => tile.type === 'animal').length;
    const shapeTiles = tiles.length - animalTiles;

    expect(animalTiles).toBeGreaterThan(shapeTiles);
  });

  it('keeps scary animals out of the animal pool', () => {
    const animalNames = ANIMALS.map((animal) => animal.name);
    expect(animalNames).not.toContain('spider');
    expect(animalNames).not.toContain('scorpion');
    expect(animalNames).not.toContain('shark');
    expect(animalNames).not.toContain('crocodile');
  });

  it('includes gentle buildings in the non-animal tile pool', () => {
    const shapeNames = MEMORY_SNAP_OBJECTS.map((shape) => shape.name);
    expect(shapeNames).toContain('house');
    expect(shapeNames).toContain('school');
    expect(shapeNames).toContain('castle');
  });

  it('uses objects and places instead of geometric shapes in the non-animal pool', () => {
    const shapeNames = MEMORY_SNAP_OBJECTS.map((shape) => shape.name);
    expect(shapeNames).not.toContain('circle');
    expect(shapeNames).not.toContain('square');
    expect(shapeNames).not.toContain('triangle');
  });

  it('keeps visually similar lizard/caterpillar pair out of the animal pool', () => {
    const animalNames = ANIMALS.map((animal) => animal.name);
    expect(animalNames).toContain('lizard');
    expect(animalNames).not.toContain('caterpillar');
    expect(animalNames).toContain('giraffe');
  });

  it('formats timer output correctly', () => {
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(59_000)).toBe('59s');
    expect(formatTime(60_000)).toBe('1:00');
    expect(formatTime(61_000)).toBe('1:01');
  });

  it('checks tile matches correctly', () => {
    const tiles: Tile[] = [
      { id: '1a', value: '🐰', type: 'animal', isFlipped: true, isMatched: false },
      { id: '1b', value: '🐰', type: 'animal', isFlipped: true, isMatched: false },
      { id: '2a', value: '🐶', type: 'animal', isFlipped: false, isMatched: false },
    ];

    expect(checkMatch(tiles, ['1a', '1b'])).toBe(true);
    expect(checkMatch(tiles, ['1a', '2a'])).toBe(false);
    expect(checkMatch(tiles, ['1a'])).toBe(false);
  });

  it('detects when game is complete', () => {
    const completeTiles: Tile[] = [
      { id: '1a', value: '🐰', type: 'animal', isFlipped: true, isMatched: true },
      { id: '1b', value: '🐰', type: 'animal', isFlipped: true, isMatched: true },
    ];
    const incompleteTiles: Tile[] = [
      { id: '1a', value: '🐰', type: 'animal', isFlipped: true, isMatched: true },
      { id: '1b', value: '🐰', type: 'animal', isFlipped: true, isMatched: false },
    ];

    expect(checkGameComplete(completeTiles)).toBe(true);
    expect(checkGameComplete(incompleteTiles)).toBe(false);
  });
});
