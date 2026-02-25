import { Tile, TileType, PairCount, ANIMALS, SHAPES } from '../types';

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getEvenGridDimensions = (totalTiles: number, maxCols: number): { cols: number; rows: number } => {
  // Find factors that create even rows
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(totalTiles); i++) {
    if (totalTiles % i === 0) {
      factors.push(i);
      if (i !== totalTiles / i) {
        factors.push(totalTiles / i);
      }
    }
  }
  factors.sort((a, b) => a - b);
  
  // Try to find a layout where all rows are equal
  // Prefer layouts that are more square-like but respect max columns
  let bestCols = 1;
  let bestRows = totalTiles;
  let bestRatio = Infinity;
  
  for (const cols of factors) {
    if (cols > maxCols) continue;
    
    const rows = totalTiles / cols;
    if (rows !== Math.floor(rows)) continue; // Not even
    
    const ratio = Math.max(cols / rows, rows / cols);
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestCols = cols;
      bestRows = rows;
    }
  }
  
  return { cols: bestCols, rows: bestRows };
};

export const calculateGridDimensions = (pairCount: PairCount, screenWidth: number, screenHeight: number): { cols: number; rows: number } => {
  const totalTiles = pairCount * 2;
  const padding = 16 * 2;
  const gap = 8;
  const tileMargin = 4 * 2;
  const headerHeight = 60;
  
  const availableWidth = screenWidth - padding;
  const availableHeight = screenHeight - padding - headerHeight - 40;
  
  const minTileSize = 40;
  const maxTilesPerRow = Math.floor((availableWidth + gap + tileMargin) / (minTileSize + gap + tileMargin));
  
  // Try to get even grid first
  const evenDims = getEvenGridDimensions(totalTiles, Math.min(maxTilesPerRow, 10));
  
  // Check if it fits with min tile size
  const tileSize = (availableWidth - gap * (evenDims.cols - 1) - tileMargin * 2 * evenDims.cols) / evenDims.cols;
  
  if (tileSize >= minTileSize) {
    return evenDims;
  }
  
  // Fall back to square root approximation with max columns constraint
  const cols = Math.min(Math.ceil(Math.sqrt(totalTiles)), maxTilesPerRow, 10);
  const rows = Math.ceil(totalTiles / cols);
  
  return { cols, rows };
};

export const generateTiles = (pairCount: PairCount, theme: 'animals' | 'shapes' | 'mixed'): Tile[] => {
  let availableItems: { emoji: string; name: string; color: string }[] = [];
  
  if (theme === 'animals') {
    availableItems = shuffle(ANIMALS);
  } else if (theme === 'shapes') {
    availableItems = shuffle(SHAPES);
  } else {
    availableItems = shuffle([...ANIMALS, ...SHAPES]);
  }
  
  const selected = availableItems.slice(0, pairCount);
  
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
