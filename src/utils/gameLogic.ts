import { Tile, TileType, Difficulty, ANIMALS, SHAPES } from '../types';

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Grid configurations for each difficulty
const GRID_CONFIGS: Record<Difficulty, { cols: number; rows: number; pairs: number }> = {
  easy: { cols: 3, rows: 4, pairs: 6 },    // 3x4 = 12 tiles = 6 pairs
  medium: { cols: 4, rows: 5, pairs: 10 }, // 4x5 = 20 tiles = 10 pairs
  hard: { cols: 5, rows: 6, pairs: 15 },   // 5x6 = 30 tiles = 15 pairs
};

export const getGridConfig = (difficulty: Difficulty): { cols: number; rows: number; pairs: number } => {
  return GRID_CONFIGS[difficulty];
};

export const calculateGridDimensions = (
  difficulty: Difficulty,
  screenWidth: number,
  screenHeight: number
): { cols: number; rows: number } => {
  const { cols, rows } = GRID_CONFIGS[difficulty];
  return { cols, rows };
};

export const generateTiles = (difficulty: Difficulty, theme: 'animals' | 'shapes' | 'mixed'): Tile[] => {
  const { pairs } = GRID_CONFIGS[difficulty];
  
  let availableItems: { emoji: string; name: string; color: string }[] = [];
  
  if (theme === 'animals') {
    availableItems = shuffle(ANIMALS);
  } else if (theme === 'shapes') {
    availableItems = shuffle(SHAPES);
  } else {
    const animalPairs = Math.ceil(pairs * 0.75);
    const shapePairs = Math.max(0, pairs - animalPairs);
    availableItems = shuffle([
      ...shuffle(ANIMALS).slice(0, animalPairs),
      ...shuffle(SHAPES).slice(0, shapePairs),
    ]);
  }
  
  const selected = availableItems.slice(0, pairs);
  
  const tiles: Tile[] = [];
  selected.forEach((item, index) => {
    const isAnimal = ANIMALS.some(a => a.name === item.name);
    const type: TileType = isAnimal ? 'animal' : 'shape';
    
    tiles.push({
      id: `${index}-a`,
      value: item.emoji,
      type,
      isFlipped: false,
      isMatched: false,
    });
    
    tiles.push({
      id: `${index}-b`,
      value: item.emoji,
      type,
      isFlipped: false,
      isMatched: false,
    });
  });
  
  return shuffle(tiles);
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
  
  const tile1 = tiles.find(t => t.id === selectedIds[0]);
  const tile2 = tiles.find(t => t.id === selectedIds[1]);
  
  if (!tile1 || !tile2) return false;
  
  return tile1.value === tile2.value;
};

export const checkGameComplete = (tiles: Tile[]): boolean => {
  return tiles.every(tile => tile.isMatched);
};
