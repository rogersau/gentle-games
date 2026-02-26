import { Tile } from '../types';
import {
  checkGameComplete,
  checkMatch,
  formatTime,
  generateTiles,
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
