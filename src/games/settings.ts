import type { Difficulty } from '../types';
import type { GameId } from './registry';

export const SETTINGS_VERSION = 2;

export type MemorySnapPairCount = 6 | 10 | 15;
export type PatternTrainLevel = 'starter' | 'growing' | 'challenge';
export type NumberPicnicMaxQuantity = 5 | 8 | 10;

export interface GameSettingsMap {
  'memory-snap': { pairCount: MemorySnapPairCount; showPreview: boolean };
  drawing: Record<string, never>;
  'glitter-fall': Record<string, never>;
  'bubble-pop': { motion: 'still' | 'moving'; density: 'sparse' | 'full' };
  'category-match': { showPreview: boolean };
  'keepy-uppy': { liftMode: 'gentle' | 'precise' };
  'breathing-garden': Record<string, never>;
  'pattern-train': { level: PatternTrainLevel };
  'number-picnic': { maxQuantity: NumberPicnicMaxQuantity };
}

export const DEFAULT_GAME_SETTINGS: GameSettingsMap = {
  'memory-snap': { pairCount: 6, showPreview: true },
  drawing: {},
  'glitter-fall': {},
  'bubble-pop': { motion: 'still', density: 'sparse' },
  'category-match': { showPreview: true },
  'keepy-uppy': { liftMode: 'gentle' },
  'breathing-garden': {},
  'pattern-train': { level: 'starter' },
  'number-picnic': { maxQuantity: 5 },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const difficultyToPairCount = (difficulty: unknown): MemorySnapPairCount =>
  difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 6;

const difficultyToPatternLevel = (difficulty: unknown): PatternTrainLevel =>
  difficulty === 'hard' ? 'challenge' : difficulty === 'medium' ? 'growing' : 'starter';

const difficultyToMaxQuantity = (difficulty: unknown): NumberPicnicMaxQuantity =>
  difficulty === 'hard' ? 10 : difficulty === 'medium' ? 8 : 5;

export const pairCountToDifficulty = (pairCount: MemorySnapPairCount): Difficulty =>
  pairCount === 15 ? 'hard' : pairCount === 10 ? 'medium' : 'easy';

export const patternLevelToDifficulty = (level: PatternTrainLevel): Difficulty =>
  level === 'challenge' ? 'hard' : level === 'growing' ? 'medium' : 'easy';

export const maxQuantityToDifficulty = (maxQuantity: NumberPicnicMaxQuantity): Difficulty =>
  maxQuantity === 10 ? 'hard' : maxQuantity === 8 ? 'medium' : 'easy';

export function sanitizeGameSettings(
  value: unknown,
  legacy: Record<string, unknown> = {},
): GameSettingsMap {
  const candidate = isObject(value) ? value : {};
  const isLegacyProfile = !isObject(value) && Object.keys(legacy).length > 0;
  const memory = isObject(candidate['memory-snap']) ? candidate['memory-snap'] : {};
  const bubble = isObject(candidate['bubble-pop']) ? candidate['bubble-pop'] : {};
  const category = isObject(candidate['category-match']) ? candidate['category-match'] : {};
  const keepy = isObject(candidate['keepy-uppy']) ? candidate['keepy-uppy'] : {};
  const pattern = isObject(candidate['pattern-train']) ? candidate['pattern-train'] : {};
  const picnic = isObject(candidate['number-picnic']) ? candidate['number-picnic'] : {};

  const pairCount = memory.pairCount;
  const level = pattern.level;
  const maxQuantity = picnic.maxQuantity;

  return {
    'memory-snap': {
      pairCount:
        pairCount === 6 || pairCount === 10 || pairCount === 15
          ? pairCount
          : difficultyToPairCount(legacy.difficulty),
      showPreview:
        typeof memory.showPreview === 'boolean'
          ? memory.showPreview
          : typeof legacy.showCardPreview === 'boolean'
            ? legacy.showCardPreview
            : DEFAULT_GAME_SETTINGS['memory-snap'].showPreview,
    },
    drawing: {},
    'glitter-fall': {},
    'bubble-pop': {
      motion:
        bubble.motion === 'moving' || bubble.motion === 'still'
          ? bubble.motion
          : isLegacyProfile
            ? 'moving'
            : 'still',
      density:
        bubble.density === 'full' || bubble.density === 'sparse'
          ? bubble.density
          : isLegacyProfile
            ? 'full'
            : 'sparse',
    },
    'category-match': {
      showPreview:
        typeof category.showPreview === 'boolean'
          ? category.showPreview
          : DEFAULT_GAME_SETTINGS['category-match'].showPreview,
    },
    'keepy-uppy': {
      liftMode:
        keepy.liftMode === 'precise' || keepy.liftMode === 'gentle'
          ? keepy.liftMode
          : legacy.keepyUppyEasyMode === false
            ? 'precise'
            : 'gentle',
    },
    'breathing-garden': {},
    'pattern-train': {
      level:
        level === 'starter' || level === 'growing' || level === 'challenge'
          ? level
          : difficultyToPatternLevel(legacy.difficulty),
    },
    'number-picnic': {
      maxQuantity:
        maxQuantity === 5 || maxQuantity === 8 || maxQuantity === 10
          ? maxQuantity
          : difficultyToMaxQuantity(legacy.difficulty),
    },
  };
}

export function getGameSettings<K extends GameId>(
  settings: {
    gameSettings?: GameSettingsMap;
    difficulty?: Difficulty;
    showCardPreview?: boolean;
    keepyUppyEasyMode?: boolean;
  },
  gameId: K,
): GameSettingsMap[K] {
  const allSettings =
    settings.gameSettings ?? sanitizeGameSettings(undefined, settings as Record<string, unknown>);
  return allSettings[gameId];
}
