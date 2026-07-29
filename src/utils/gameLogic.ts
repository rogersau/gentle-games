import { Tile, TileType, Difficulty, ANIMALS, MEMORY_SNAP_OBJECTS } from '../types';
import type { MemorySnapPairCount } from '../games/settings';

export type RandomSource = () => number;

export const shuffle = <T>(array: T[], random: RandomSource = Math.random): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Grid configurations for each difficulty
const GRID_CONFIGS: Record<Difficulty, { cols: number; rows: number; pairs: number }> = {
  easy: { cols: 3, rows: 4, pairs: 6 }, // 3x4 = 12 tiles = 6 pairs
  medium: { cols: 4, rows: 5, pairs: 10 }, // 4x5 = 20 tiles = 10 pairs
  hard: { cols: 5, rows: 6, pairs: 15 }, // 5x6 = 30 tiles = 15 pairs
};

export const MEMORY_SNAP_GRID_CONFIGS: Record<
  MemorySnapPairCount,
  { cols: number; rows: number; pairs: MemorySnapPairCount }
> = {
  2: { cols: 2, rows: 2, pairs: 2 },
  3: { cols: 2, rows: 3, pairs: 3 },
  4: { cols: 2, rows: 4, pairs: 4 },
  6: { cols: 3, rows: 4, pairs: 6 },
  10: { cols: 4, rows: 5, pairs: 10 },
  15: { cols: 5, rows: 6, pairs: 15 },
};

export const getMemorySnapGridConfig = (pairCount: MemorySnapPairCount) =>
  MEMORY_SNAP_GRID_CONFIGS[pairCount];

export const calculateMemorySnapBoardSize = (
  viewport: { width: number; height: number },
  pairCount: MemorySnapPairCount,
  bottomInset = 0,
) => {
  const { cols, rows } = getMemorySnapGridConfig(pairCount);
  const width = Math.min(Math.max(viewport.width - 32, 1), 640);
  const height = Math.max(viewport.height - 220 - bottomInset, 1);
  const tileSize = Math.max(
    1,
    Math.floor(Math.min((width - cols * 8) / cols, (height - rows * 8) / rows)),
  );

  return {
    cols,
    rows,
    tileSize,
    width: cols * (tileSize + 8),
    height: rows * (tileSize + 8),
  };
};

export const getGridConfig = (
  difficulty: Difficulty,
): { cols: number; rows: number; pairs: number } => {
  return GRID_CONFIGS[difficulty];
};

export const calculateGridDimensions = (
  difficulty: Difficulty,
  _screenWidth: number,
  _screenHeight: number,
): { cols: number; rows: number } => {
  const { cols, rows } = GRID_CONFIGS[difficulty];
  return { cols, rows };
};

export const generateTiles = (
  difficultyOrPairCount: Difficulty | MemorySnapPairCount,
  theme: 'animals' | 'shapes' | 'mixed',
  random: RandomSource = Math.random,
): Tile[] => {
  const pairCount =
    typeof difficultyOrPairCount === 'number'
      ? difficultyOrPairCount
      : (GRID_CONFIGS[difficultyOrPairCount].pairs as MemorySnapPairCount);
  return generateMemorySnapTiles(pairCount, theme, random);
};

export const generateMemorySnapTiles = (
  pairCount: MemorySnapPairCount,
  theme: 'animals' | 'shapes' | 'mixed',
  random: RandomSource = Math.random,
): Tile[] => {
  const { pairs } = getMemorySnapGridConfig(pairCount);

  let availableItems: { emoji: string; name: string; color: string }[] = [];

  if (theme === 'animals') {
    availableItems = shuffle(ANIMALS, random);
  } else if (theme === 'shapes') {
    availableItems = shuffle(MEMORY_SNAP_OBJECTS, random);
  } else {
    const animalPairs = Math.ceil(pairs * 0.75);
    const shapePairs = Math.max(0, pairs - animalPairs);
    availableItems = shuffle(
      [
        ...shuffle(ANIMALS, random).slice(0, animalPairs),
        ...shuffle(MEMORY_SNAP_OBJECTS, random).slice(0, shapePairs),
      ],
      random,
    );
  }

  const selected = availableItems.slice(0, pairs);

  const tiles: Tile[] = [];
  selected.forEach((item, index) => {
    const isAnimal = ANIMALS.some((a) => a.name === item.name);
    const type: TileType = isAnimal ? 'animal' : 'shape';

    tiles.push({
      id: `${index}-a`,
      value: item.emoji,
      name: item.name,
      type,
      isFlipped: false,
      isMatched: false,
    });

    tiles.push({
      id: `${index}-b`,
      value: item.emoji,
      name: item.name,
      type,
      isFlipped: false,
      isMatched: false,
    });
  });

  return shuffle(tiles, random);
};

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
};

export const checkMatch = (tiles: Tile[], selectedIds: string[]): boolean => {
  if (selectedIds.length !== 2) return false;

  const tile1 = tiles.find((t) => t.id === selectedIds[0]);
  const tile2 = tiles.find((t) => t.id === selectedIds[1]);

  if (!tile1 || !tile2) return false;

  return tile1.value === tile2.value;
};

export const checkGameComplete = (tiles: Tile[]): boolean => {
  return tiles.every((tile) => tile.isMatched);
};
