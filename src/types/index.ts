export type TileType = 'animal' | 'shape';

export interface Tile {
  id: string;
  value: string;
  name?: string;
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
  // Extended semantic tokens
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  overlay: string;
  accent: string;
  danger: string;
}

export interface Settings {
  settingsVersion?: number;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  difficulty: Difficulty;
  theme: 'animals' | 'shapes' | 'mixed';
  showCardPreview: boolean;
  keepyUppyEasyMode: boolean;
  colorMode: ColorMode;
  hiddenGames: import('../games/registry').GameId[];
  parentTimerMinutes: number;
  enableUnfinishedGames: boolean;
  language: import('./i18n').SupportedLanguage;
  reducedMotionEnabled: boolean;
  telemetryEnabled: boolean;
  showMochiInGames: boolean;
  /** When enabled, hide non-essential scores, counters, and milestone celebrations in games. */
  pressureFreeMode?: boolean;
  /** Independently persisted challenge and assistance controls for each game. */
  gameSettings?: import('../games/settings').GameSettingsMap;
}

export type BreathingGardenPhase = 'inhale' | 'exhale';

export interface PatternTrainRound {
  sequence: string[];
  display: string[];
  choices: string[];
  answer: string;
  patternLabel: string;
}

export interface TrainCarriageType {
  emoji: string;
  isMissing: boolean;
}

export interface TrainPatternType {
  carriages: TrainCarriageType[];
  answer: string;
  choices: string[];
  patternLabel: string;
}

export type NumberPicnicStage = '1-3' | '1-5' | '6-10';

export type NumberPicnicMode =
  | 'make-amount'
  | 'find-amount'
  | 'match-numeral'
  | 'more-fewer'
  | 'add-one-more';

export interface NumberPicnicRepresentation {
  quantity: number;
  numeral: number;
  frameCapacity: 5 | 10;
  filledSlots: number[];
}

export interface NumberPicnicChoice {
  id: string;
  quantity: number;
  numeral: number;
  representation: NumberPicnicRepresentation;
}

export interface NumberPicnicGroup {
  id: 'left' | 'right';
  quantity: number;
  representation: NumberPicnicRepresentation;
}

export interface NumberPicnicPrompt {
  itemEmoji: string;
  itemName: string;
  targetCount: number;
  stage: NumberPicnicStage;
  mode: NumberPicnicMode;
  representation: NumberPicnicRepresentation;
  choices: NumberPicnicChoice[];
  groups: NumberPicnicGroup[];
  comparison: 'more' | 'fewer' | null;
}

export type CategoryMatchCategory =
  | 'food'
  | 'toys'
  | 'clothes'
  | 'vehicles'
  | 'buildings'
  | 'instruments'
  | 'animals'
  | 'plants'
  | 'sky';
export type CategoryMatchPack = 'everyday' | 'town' | 'outdoors';
export type CategoryMatchCategoryCount = 2 | 3;

export interface CategoryMatchCategoryConfig {
  id: CategoryMatchCategory;
  example: CategoryMatchItem;
}

export interface CategoryMatchItem {
  id: string;
  emoji: string;
  name: string;
  color: string;
  category: CategoryMatchCategory;
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

export const CATEGORY_MATCH_FOOD: CategoryMatchItem[] = [
  { id: 'apple', emoji: '🍎', name: 'apple', color: '#FFB6C1', category: 'food' },
  { id: 'banana', emoji: '🍌', name: 'banana', color: '#FFFACD', category: 'food' },
  { id: 'carrot', emoji: '🥕', name: 'carrot', color: '#FFA07A', category: 'food' },
  { id: 'bread', emoji: '🍞', name: 'bread', color: '#DEB887', category: 'food' },
  { id: 'cheese', emoji: '🧀', name: 'cheese', color: '#FFD700', category: 'food' },
  { id: 'cookie', emoji: '🍪', name: 'cookie', color: '#D2B48C', category: 'food' },
  { id: 'strawberry', emoji: '🍓', name: 'strawberry', color: '#DA8278', category: 'food' },
  { id: 'pear', emoji: '🍐', name: 'pear', color: '#B6C883', category: 'food' },
];

export const CATEGORY_MATCH_TOYS: CategoryMatchItem[] = [
  { id: 'teddy', emoji: '🧸', name: 'teddy', color: '#DEB887', category: 'toys' },
  { id: 'ball', emoji: '⚽', name: 'ball', color: '#F5F5F5', category: 'toys' },
  { id: 'puzzle', emoji: '🧩', name: 'puzzle', color: '#FFDAB9', category: 'toys' },
  { id: 'kite', emoji: '🪁', name: 'kite', color: '#E6E6FA', category: 'toys' },
  { id: 'yo-yo', emoji: '🪀', name: 'yo-yo', color: '#DDA0DD', category: 'toys' },
  { id: 'game', emoji: '🎮', name: 'game', color: '#B0C4DE', category: 'toys' },
  { id: 'train', emoji: '🚂', name: 'train', color: '#CE956D', category: 'toys' },
  { id: 'rubber-duck', emoji: '🐤', name: 'rubber-duck', color: '#ECCA75', category: 'toys' },
];

export const CATEGORY_MATCH_CLOTHES: CategoryMatchItem[] = [
  { id: 'shirt', emoji: '👕', name: 'shirt', color: '#87CEEB', category: 'clothes' },
  { id: 'sock', emoji: '🧦', name: 'sock', color: '#F0F8FF', category: 'clothes' },
  { id: 'hat', emoji: '🧢', name: 'hat', color: '#98FB98', category: 'clothes' },
  { id: 'shoe', emoji: '👟', name: 'shoe', color: '#D3D3D3', category: 'clothes' },
  { id: 'dress', emoji: '👗', name: 'dress', color: '#FFB6C1', category: 'clothes' },
  { id: 'coat', emoji: '🧥', name: 'coat', color: '#D2B48C', category: 'clothes' },
  { id: 'mitten', emoji: '🧤', name: 'mitten', color: '#DB9D86', category: 'clothes' },
  { id: 'scarf', emoji: '🧣', name: 'scarf', color: '#9EBAC7', category: 'clothes' },
];

export const CATEGORY_MATCH_CATEGORIES_2: CategoryMatchCategoryConfig[] = [
  { id: 'food', example: CATEGORY_MATCH_FOOD[0] },
  { id: 'toys', example: CATEGORY_MATCH_TOYS[0] },
];

export const CATEGORY_MATCH_CATEGORIES_3: CategoryMatchCategoryConfig[] = [
  ...CATEGORY_MATCH_CATEGORIES_2,
  { id: 'clothes', example: CATEGORY_MATCH_CLOTHES[0] },
];

// The starter rule is deliberately limited to two concrete, familiar groups.
export const CATEGORY_MATCH_CATEGORIES = CATEGORY_MATCH_CATEGORIES_2;

// Memory Snap's non-animal pool contains familiar places, objects, food, and nature.
const familiarObjects = [
  { emoji: '🏠', name: 'house', color: '#FFE4C4' },
  { emoji: '🏫', name: 'school', color: '#F5DEB3' },
  { emoji: '🏰', name: 'castle', color: '#E6E6FA' },
  { emoji: '🏥', name: 'hospital', color: '#F0F8FF' },
  { emoji: '🏡', name: 'home-garden', color: '#FFE4E1' },
  { emoji: '🛖', name: 'hut', color: '#DEB887' },
  { emoji: '🚗', name: 'car', color: '#ADD8E6' },
  { emoji: '🚌', name: 'bus', color: '#FFDAB9' },
  { emoji: '🚜', name: 'tractor', color: '#F0E68C' },
  { emoji: '🚲', name: 'bike', color: '#B0E0E6' },
  { emoji: '🚤', name: 'boat', color: '#87CEEB' },
  { emoji: '🛸', name: 'ufo', color: '#E6E6FA' },
  { emoji: '🚁', name: 'helicopter', color: '#C0C0C0' },
  { emoji: '✈️', name: 'airplane', color: '#E0FFFF' },
  { emoji: '🎈', name: 'balloon', color: '#FFB6C1' },
  { emoji: '🎀', name: 'ribbon', color: '#FFC0CB' },
  { emoji: '🔔', name: 'bell', color: '#FFD700' },
  { emoji: '🎁', name: 'gift', color: '#FFB6C1' },
  { emoji: '📚', name: 'books', color: '#ADD8E6' },
  { emoji: '🖍️', name: 'crayon', color: '#FFA07A' },
  { emoji: '🧃', name: 'juice', color: '#FFFACD' },
  { emoji: '🌙', name: 'moon', color: '#E6E6FA' },
  { emoji: '☀️', name: 'sun', color: '#FFFACD' },
  { emoji: '☁️', name: 'cloud', color: '#F0F8FF' },
  { emoji: '🌸', name: 'flower', color: '#FFE4E1' },
  { emoji: '🍀', name: 'clover', color: '#98FB98' },
  { emoji: '🍁', name: 'leaf', color: '#FFDAB9' },
  { emoji: '🌈', name: 'rainbow', color: '#E6E6FA' },
  { emoji: '⚡', name: 'lightning', color: '#FFFACD' },
  { emoji: '❄️', name: 'snowflake', color: '#E0FFFF' },
  { emoji: '🎸', name: 'guitar', color: '#C7C5AB' },
  { emoji: '🥁', name: 'drum', color: '#C7C5AB' },
  { emoji: 'tambourine', name: 'tambourine', color: '#C7C5AB' },
  { emoji: 'xylophone', name: 'xylophone', color: '#C7C5AB' },
  { emoji: '🎺', name: 'trumpet', color: '#C7C5AB' },
  { emoji: '🪗', name: 'accordion', color: '#C7C5AB' },
  { emoji: '🌱', name: 'seedling', color: '#C7C5AB' },
  { emoji: 'pine-cone', name: 'pine-cone', color: '#C7C5AB' },
  { emoji: 'acorn', name: 'acorn', color: '#C7C5AB' },
  { emoji: '🌼', name: 'daisy', color: '#C7C5AB' },
  { emoji: '⭐', name: 'star', color: '#C7C5AB' },
  { emoji: 'watering-can', name: 'watering-can', color: '#C7C5AB' },
  { emoji: 'trowel', name: 'trowel', color: '#C7C5AB' },
  { emoji: 'beehive', name: 'beehive', color: '#C7C5AB' },
  { emoji: '⌛', name: 'hourglass', color: '#C7C5AB' },
  { emoji: '✏️', name: 'pencil', color: '#C7C5AB' },
  { emoji: '⏰', name: 'alarm-clock', color: '#C7C5AB' },
  { emoji: '🫧', name: 'bubbles', color: '#C7C5AB' },
];

type PictureItem = (typeof familiarObjects)[number];

function sortingGroup(
  category: CategoryMatchCategory,
  pictures: PictureItem[],
): CategoryMatchItem[] {
  return pictures.map((picture) => ({ ...picture, id: picture.name, category }));
}

const vehicles = sortingGroup(
  'vehicles',
  familiarObjects.filter((picture) =>
    ['car', 'bus', 'tractor', 'bike', 'boat', 'airplane', 'helicopter'].includes(picture.name),
  ),
);
const buildings = sortingGroup(
  'buildings',
  familiarObjects.filter((picture) =>
    ['house', 'school', 'castle', 'hospital', 'home-garden', 'hut'].includes(picture.name),
  ),
);
const instruments = sortingGroup(
  'instruments',
  familiarObjects.filter((picture) =>
    ['guitar', 'drum', 'tambourine', 'xylophone', 'trumpet', 'accordion'].includes(picture.name),
  ),
);
const animals = sortingGroup(
  'animals',
  ANIMALS.filter((picture) =>
    ['bunny', 'koala', 'fox', 'frog', 'giraffe', 'turtle', 'owl', 'butterfly'].includes(
      picture.name,
    ),
  ),
);
const plants = sortingGroup(
  'plants',
  familiarObjects.filter((picture) =>
    ['flower', 'clover', 'leaf', 'seedling', 'pine-cone', 'acorn', 'daisy'].includes(picture.name),
  ),
);
const sky = sortingGroup(
  'sky',
  familiarObjects.filter((picture) =>
    ['moon', 'sun', 'cloud', 'rainbow', 'lightning', 'snowflake', 'star'].includes(picture.name),
  ),
);

export const CATEGORY_MATCH_PACKS: Record<CategoryMatchPack, CategoryMatchCategoryConfig[]> = {
  everyday: CATEGORY_MATCH_CATEGORIES_3,
  town: [vehicles, buildings, instruments].map(([example]) => ({ id: example.category, example })),
  outdoors: [animals, plants, sky].map(([example]) => ({ id: example.category, example })),
};

export const CATEGORY_MATCH_ITEMS: CategoryMatchItem[] = [
  ...CATEGORY_MATCH_FOOD,
  ...CATEGORY_MATCH_TOYS,
  ...CATEGORY_MATCH_CLOTHES,
  ...vehicles,
  ...buildings,
  ...instruments,
  ...animals,
  ...plants,
  ...sky,
];

export const MEMORY_SNAP_OBJECTS = [
  ...CATEGORY_MATCH_FOOD,
  ...CATEGORY_MATCH_TOYS,
  ...CATEGORY_MATCH_CLOTHES,
  ...familiarObjects,
];

// Some older rounds store a symbol without a picture name.
export const pictureNameByValue = new Map(
  [...ANIMALS, ...MEMORY_SNAP_OBJECTS].map(({ emoji, name }) => [emoji, name]),
);
pictureNameByValue.set('🌟', 'star');

export const PATTERN_TRAIN_EMOJIS = ['🚂', '🌟', '🌈', '🌸', '☁️', '🫧', '🍓', '🧸'];

export const NUMBER_PICNIC_ITEMS = [
  { emoji: '🍓', name: 'berries' },
  { emoji: '🍎', name: 'apples' },
  { emoji: '🥕', name: 'carrots' },
  { emoji: '⭐', name: 'stars' },
  { emoji: '🌼', name: 'flowers' },
];

/**
 * Dedicated balloon palette for KeepyUppy with guaranteed contrast against both
 * light and dark theme backgrounds. These colors are chosen to stand out against:
 * - Light mode: primary (#A8D8EA - light blue), success (#B8E6B8 - light green)
 * - Dark mode: primary (#7FB1C1 - muted blue), success (#95C5A3 - muted green)
 *
 * Colors are warm/coral/peach/pink/purple tones that contrast well with blue backgrounds.
 */
export const BALLOON_PALETTE = [
  '#FF8B7B', // Coral - high contrast against blue
  '#FFB67B', // Peach - warm contrast
  '#FFE17B', // Soft yellow - bright contrast
  '#FFB6C1', // Pastel pink - gentle but distinct
  '#DDA0DD', // Plum - purple contrast
  '#C9B1FF', // Lavender - distinct from blue
  '#FF9E9E', // Salmon pink - warm contrast
  '#F4A460', // Sandy brown - earthy contrast
  '#98FB98', // Mint green - fresh contrast
  '#87CEFA', // Light sky blue - lighter than background
] as const;

export const PASTEL_COLORS: ThemeColors = {
  background: '#FFFEF7',
  cardBack: '#E8E4E1',
  cardFront: '#FFFFFF',
  text: '#5A5A5A',
  textLight: '#6F6F6F',
  primary: '#A8D8EA',
  secondary: '#FFB6C1',
  success: '#B8E6B8',
  matched: '#D3D3D3',
  surfaceGame: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E8E4E1',
  borderSubtle: '#F0EDE9',
  overlay: 'rgba(90, 90, 90, 0.4)',
  accent: '#D4A9E6',
  danger: '#E8A0A0',
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
  surface: '#3A3E47',
  surfaceElevated: '#44484F',
  border: '#4A4E57',
  borderSubtle: '#3F434C',
  overlay: 'rgba(0, 0, 0, 0.5)',
  accent: '#B28DC7',
  danger: '#C87878',
};
