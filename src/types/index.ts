export type TileType = 'animal' | 'shape';

export interface Tile {
  id: string;
  value: string;
  type: TileType;
  isFlipped: boolean;
  isMatched: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ColorMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  cardBack: string;
  cardFront: string;
  text: string;
  textLight: string;
  primary: string;
  secondary: string;
  success: string;
  matched: string;
  surfaceGame: string;
}

export interface Settings {
  animationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  difficulty: Difficulty;
  theme: 'animals' | 'shapes' | 'mixed';
  showCardPreview: boolean;
  colorMode: ColorMode;
  hiddenGames: string[];
  parentTimerMinutes: number;
}

export type CategoryMatchCategory = 'sky' | 'land' | 'ocean';

export interface CategoryMatchCategoryConfig {
  id: CategoryMatchCategory;
  label: string;
  icon: string;
}

export interface CategoryMatchItem {
  emoji: string;
  name: string;
  color: string;
  category: CategoryMatchCategory;
}

export const CATEGORY_MATCH_CATEGORIES: CategoryMatchCategoryConfig[] = [
  { id: 'sky', label: 'Sky', icon: '☁️' },
  { id: 'land', label: 'Land', icon: '🌱' },
  { id: 'ocean', label: 'Ocean', icon: '🌊' },
];

export const ANIMALS = [
  { emoji: '🐰', name: 'bunny', color: '#FFB6C1' },
  { emoji: '🐻', name: 'bear', color: '#D2B48C' },
  { emoji: '🐱', name: 'cat', color: '#FFDAB9' },
  { emoji: '🐶', name: 'dog', color: '#F5DEB3' },
  { emoji: '🦊', name: 'fox', color: '#FFA07A' },
  { emoji: '🐼', name: 'panda', color: '#E6E6FA' },
  { emoji: '🐨', name: 'koala', color: '#D3D3D3' },
  { emoji: '🦁', name: 'lion', color: '#F0E68C' },
  { emoji: '🐯', name: 'tiger', color: '#FFD700' },
  { emoji: '🐷', name: 'pig', color: '#FFC0CB' },
  { emoji: '🐸', name: 'frog', color: '#98FB98' },
  { emoji: '🐙', name: 'octopus', color: '#DDA0DD' },
  { emoji: '🦋', name: 'butterfly', color: '#E0FFFF' },
  { emoji: '🐢', name: 'turtle', color: '#90EE90' },
  { emoji: '🦉', name: 'owl', color: '#D8BFD8' },
  { emoji: '🦄', name: 'unicorn', color: '#E6E6FA' },
  { emoji: '🐝', name: 'bee', color: '#FFFACD' },
  { emoji: '🦕', name: 'dino', color: '#98D8C8' },
  { emoji: '🦔', name: 'hedgehog', color: '#D2B48C' },
  { emoji: '🦦', name: 'otter', color: '#C0C0C0' },
  { emoji: '🦥', name: 'sloth', color: '#DEB887' },
  { emoji: '🦫', name: 'beaver', color: '#CD853F' },
  { emoji: '🦨', name: 'skunk', color: '#D3D3D3' },
  { emoji: '🦡', name: 'badger', color: '#A9A9A9' },
  { emoji: '🦝', name: 'raccoon', color: '#C0C0C0' },
  { emoji: '🐓', name: 'rooster', color: '#FF6347' },
  { emoji: '🦆', name: 'duck', color: '#FFD700' },
  { emoji: '🦢', name: 'swan', color: '#FFFAFA' },
  { emoji: '🦜', name: 'parrot', color: '#7FFFD4' },
  { emoji: '🦎', name: 'lizard', color: '#8FBC8F' },
  { emoji: '🐌', name: 'snail', color: '#D2B48C' },
  { emoji: '🦒', name: 'giraffe', color: '#F0E68C' },
  { emoji: '🐞', name: 'ladybug', color: '#FF4500' },
  { emoji: '🪲', name: 'beetle', color: '#8B4513' },
  { emoji: '🦀', name: 'crab', color: '#FF6347' },
  { emoji: '🦞', name: 'lobster', color: '#CD5C5C' },
  { emoji: '🐠', name: 'fish', color: '#87CEEB' },
  { emoji: '🐟', name: 'fish2', color: '#4682B4' },
  { emoji: '🐡', name: 'blowfish', color: '#F4A460' },
  { emoji: '🐬', name: 'dolphin', color: '#00CED1' },
  { emoji: '🐳', name: 'whale', color: '#4169E1' },
  { emoji: '🦩', name: 'flamingo', color: '#FF69B4' },
  { emoji: '🦚', name: 'peacock', color: '#00FA9A' },
  { emoji: '🦤', name: 'dodo', color: '#FFFAFA' },
  { emoji: '🐦', name: 'bird', color: '#87CEEB' },
  { emoji: '🐇', name: 'rabbit', color: '#FFB6C1' },
  { emoji: '🐁', name: 'mouse', color: '#D3D3D3' },
  { emoji: '🐀', name: 'rat', color: '#A9A9A9' },
  { emoji: '🐿️', name: 'chipmunk', color: '#D2691E' },
];

// Legacy name: this is the Memory Snap non-animal icon pool used by "shapes" and "mixed" themes.
export const SHAPES = [
  { emoji: '🏠', name: 'house', color: '#FFE4C4' },
  { emoji: '🏫', name: 'school', color: '#F5DEB3' },
  { emoji: '🏰', name: 'castle', color: '#E6E6FA' },
  { emoji: '🏥', name: 'hospital', color: '#F0F8FF' },
  { emoji: '🏡', name: 'home-garden', color: '#FFE4E1' },
  { emoji: '🛖', name: 'hut', color: '#DEB887' },
  { emoji: '🚗', name: 'car', color: '#ADD8E6' },
  { emoji: '🚌', name: 'bus', color: '#FFDAB9' },
  { emoji: '🚂', name: 'train', color: '#D3D3D3' },
  { emoji: '🚜', name: 'tractor', color: '#F0E68C' },
  { emoji: '🚲', name: 'bike', color: '#B0E0E6' },
  { emoji: '🚤', name: 'boat', color: '#87CEEB' },
  { emoji: '🛸', name: 'ufo', color: '#E6E6FA' },
  { emoji: '🚁', name: 'helicopter', color: '#C0C0C0' },
  { emoji: '✈️', name: 'airplane', color: '#E0FFFF' },
  { emoji: '🎈', name: 'balloon', color: '#FFB6C1' },
  { emoji: '🎀', name: 'ribbon', color: '#FFC0CB' },
  { emoji: '🔔', name: 'bell', color: '#FFD700' },
  { emoji: '🪁', name: 'kite', color: '#E6E6FA' },
  { emoji: '🎁', name: 'gift', color: '#FFB6C1' },
  { emoji: '🧸', name: 'teddy', color: '#DEB887' },
  { emoji: '🪀', name: 'yo-yo', color: '#DDA0DD' },
  { emoji: '⚽', name: 'ball', color: '#F5F5F5' },
  { emoji: '🧩', name: 'puzzle', color: '#FFDAB9' },
  { emoji: '📚', name: 'books', color: '#ADD8E6' },
  { emoji: '🖍️', name: 'crayon', color: '#FFA07A' },
  { emoji: '🧃', name: 'juice', color: '#FFFACD' },
  { emoji: '🍎', name: 'apple', color: '#FFB6C1' },
  { emoji: '🥕', name: 'carrot', color: '#FFDAB9' },
  { emoji: '🌙', name: 'moon', color: '#E6E6FA' },
  { emoji: '☀️', name: 'sun', color: '#FFFACD' },
  { emoji: '☁️', name: 'cloud', color: '#F0F8FF' },
  { emoji: '🌸', name: 'flower', color: '#FFE4E1' },
  { emoji: '🍀', name: 'clover', color: '#98FB98' },
  { emoji: '🍁', name: 'leaf', color: '#FFDAB9' },
  { emoji: '🌈', name: 'rainbow', color: '#E6E6FA' },
  { emoji: '⚡', name: 'lightning', color: '#FFFACD' },
  { emoji: '❄️', name: 'snowflake', color: '#E0FFFF' },
];

export const CATEGORY_MATCH_SKY: CategoryMatchItem[] = [
  { emoji: '☀️', name: 'sun', color: '#FFFACD', category: 'sky' },
  { emoji: '☁️', name: 'cloud', color: '#F0F8FF', category: 'sky' },
  { emoji: '🌙', name: 'moon', color: '#E6E6FA', category: 'sky' },
  { emoji: '🌈', name: 'rainbow', color: '#E6E6FA', category: 'sky' },
  { emoji: '🪁', name: 'kite', color: '#FFB6C1', category: 'sky' },
  { emoji: '✈️', name: 'airplane', color: '#ADD8E6', category: 'sky' },
  { emoji: '🐦', name: 'bird', color: '#87CEEB', category: 'sky' },
  { emoji: '🎈', name: 'balloon', color: '#FFC0CB', category: 'sky' },
  { emoji: '⭐', name: 'star', color: '#FFFACD', category: 'sky' },
  { emoji: '⚡', name: 'lightning', color: '#FFFACD', category: 'sky' },
  { emoji: '🛸', name: 'ufo', color: '#D3D3D3', category: 'sky' },
  { emoji: '🚁', name: 'helicopter', color: '#C0C0C0', category: 'sky' },
];

export const CATEGORY_MATCH_OCEAN: CategoryMatchItem[] = [
  { emoji: '🐠', name: 'fish', color: '#87CEEB', category: 'ocean' },
  { emoji: '🐬', name: 'dolphin', color: '#00CED1', category: 'ocean' },
  { emoji: '🐳', name: 'whale', color: '#4169E1', category: 'ocean' },
  { emoji: '🐙', name: 'octopus', color: '#DDA0DD', category: 'ocean' },
  { emoji: '🦀', name: 'crab', color: '#FF6347', category: 'ocean' },
  { emoji: '🦞', name: 'lobster', color: '#CD5C5C', category: 'ocean' },
  { emoji: '🦑', name: 'squid', color: '#E6E6FA', category: 'ocean' },
  { emoji: '🦐', name: 'shrimp', color: '#FFA07A', category: 'ocean' },
  { emoji: '🪼', name: 'jellyfish', color: '#E0FFFF', category: 'ocean' },
  { emoji: '🪸', name: 'coral', color: '#FFC0CB', category: 'ocean' },
  { emoji: '🐚', name: 'shell', color: '#F5DEB3', category: 'ocean' },
  { emoji: '🌊', name: 'wave', color: '#ADD8E6', category: 'ocean' },
];

export const CATEGORY_MATCH_LAND: CategoryMatchItem[] = [
  { emoji: '🌳', name: 'tree', color: '#90EE90', category: 'land' },
  { emoji: '🌻', name: 'flower', color: '#FFFACD', category: 'land' },
  { emoji: '🏠', name: 'house', color: '#FFE4C4', category: 'land' },
  { emoji: '🚗', name: 'car', color: '#ADD8E6', category: 'land' },
  { emoji: '🚌', name: 'bus', color: '#FFDAB9', category: 'land' },
  { emoji: '🚜', name: 'tractor', color: '#F0E68C', category: 'land' },
  { emoji: '🍎', name: 'apple', color: '#FFB6C1', category: 'land' },
  { emoji: '🍌', name: 'banana', color: '#FFFACD', category: 'land' },
  { emoji: '🍓', name: 'strawberry', color: '#FFC0CB', category: 'land' },
  { emoji: '🥕', name: 'carrot', color: '#FFA07A', category: 'land' },
  { emoji: '🌽', name: 'corn', color: '#FFFFE0', category: 'land' },
  { emoji: '🥦', name: 'broccoli', color: '#98FB98', category: 'land' },
];

export const CATEGORY_MATCH_ITEMS: CategoryMatchItem[] = [
  ...CATEGORY_MATCH_SKY,
  ...CATEGORY_MATCH_LAND,
  ...CATEGORY_MATCH_OCEAN,
];

export const PASTEL_COLORS: ThemeColors = {
  background: '#FFFEF7',
  cardBack: '#E8E4E1',
  cardFront: '#FFFFFF',
  text: '#5A5A5A',
  textLight: '#8A8A8A',
  primary: '#A8D8EA',
  secondary: '#FFB6C1',
  success: '#B8E6B8',
  matched: '#D3D3D3',
  surfaceGame: '#FFFFFF',
};

export const DARK_PASTEL_COLORS: ThemeColors = {
  background: '#2F333B',
  cardBack: '#4A4E57',
  cardFront: '#E9E4DC',
  text: '#EAE6DF',
  textLight: '#C2BEB6',
  primary: '#7FB1C1',
  secondary: '#D59CB2',
  success: '#95C5A3',
  matched: '#8B9099',
  surfaceGame: '#3F444D',
};
