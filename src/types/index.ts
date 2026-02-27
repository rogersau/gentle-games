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
}

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
  { emoji: '🐛', name: 'caterpillar', color: '#98FB98' },
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

export const SHAPES = [
  { emoji: '⭕', name: 'circle', color: '#FFB6C1' },
  { emoji: '🔲', name: 'square', color: '#ADD8E6' },
  { emoji: '🔺', name: 'triangle', color: '#FFDAB9' },
  { emoji: '⭐', name: 'star', color: '#FFFACD' },
  { emoji: '❤️', name: 'heart', color: '#FFC0CB' },
  { emoji: '💎', name: 'diamond', color: '#E0FFFF' },
  { emoji: '🌙', name: 'moon', color: '#E6E6FA' },
  { emoji: '☀️', name: 'sun', color: '#FFFACD' },
  { emoji: '☁️', name: 'cloud', color: '#F0F8FF' },
  { emoji: '🌸', name: 'flower', color: '#FFE4E1' },
  { emoji: '🍀', name: 'clover', color: '#98FB98' },
  { emoji: '🍁', name: 'leaf', color: '#FFDAB9' },
  { emoji: '🌈', name: 'rainbow', color: '#E6E6FA' },
  { emoji: '⚡', name: 'bolt', color: '#FFFACD' },
  { emoji: '❄️', name: 'snowflake', color: '#E0FFFF' },
  { emoji: '🔔', name: 'bell', color: '#FFD700' },
  { emoji: '🎈', name: 'balloon', color: '#FFB6C1' },
  { emoji: '🎀', name: 'ribbon', color: '#FFC0CB' },
  { emoji: '🎵', name: 'note', color: '#E6E6FA' },
  { emoji: '💫', name: 'sparkle', color: '#FFFACD' },
  { emoji: '🌟', name: 'glow', color: '#FFD700' },
  { emoji: '✨', name: 'stars', color: '#FFFACD' },
  { emoji: '🌀', name: 'swirl', color: '#ADD8E6' },
  { emoji: '💠', name: 'fancy', color: '#E0FFFF' },
  { emoji: '🔷', name: 'blue', color: '#ADD8E6' },
  { emoji: '🟢', name: 'green', color: '#90EE90' },
  { emoji: '🟡', name: 'yellow', color: '#FFFFE0' },
  { emoji: '🟣', name: 'purple', color: '#DDA0DD' },
  { emoji: '🟧', name: 'orange', color: '#FFDAB9' },
  { emoji: '🔴', name: 'red', color: '#FF6347' },
  { emoji: '🔵', name: 'blue2', color: '#87CEEB' },
  { emoji: '⬛', name: 'black', color: '#2F4F4F' },
  { emoji: '⬜', name: 'white', color: '#FFFAFA' },
  { emoji: '💜', name: 'purple2', color: '#9370DB' },
  { emoji: '💚', name: 'green2', color: '#90EE90' },
  { emoji: '💛', name: 'yellow2', color: '#FFFACD' },
  { emoji: '🧡', name: 'orange2', color: '#FFA500' },
  { emoji: '🩷', name: 'red2', color: '#FF4500' },
  { emoji: '💙', name: 'blue3', color: '#6495ED' },
  { emoji: '🤎', name: 'brown', color: '#D2691E' },
  { emoji: '🖤', name: 'black2', color: '#000000' },
  { emoji: '🤍', name: 'white2', color: '#FFFFFF' },
  { emoji: '💟', name: 'heart2', color: '#FF69B4' },
  { emoji: '❣️', name: 'heart3', color: '#FF1493' },
  { emoji: '💢', name: 'angry', color: '#FF0000' },
  { emoji: '💤', name: 'sleep', color: '#87CEEB' },
  { emoji: '💨', name: 'dash', color: '#D3D3D3' },
  { emoji: '💦', name: 'sweat', color: '#00BFFF' },
  { emoji: '🕸️', name: 'web', color: '#2F4F4F' },
  { emoji: '🎪', name: 'circus', color: '#FFA500' },
  { emoji: '🏠', name: 'house', color: '#FFE4C4' },
  { emoji: '🏫', name: 'school', color: '#F5DEB3' },
  { emoji: '🏰', name: 'castle', color: '#E6E6FA' },
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
