import type {
  CategoryMatchCategoryCount,
  Difficulty,
  NumberPicnicMode,
  NumberPicnicStage,
} from '../types';
import type { GameId } from './registry';
import {
  DEFAULT_GLITTER_SETTINGS,
  GLITTER_PRESETS,
  GlitterFallSettings,
  resolveGlitterSettings,
} from './glitterSettings';

export const SETTINGS_VERSION = 4;

export type MemorySnapPairCount = 2 | 3 | 4 | 6 | 10 | 15;
export type MemorySnapPreviewMode = 'none' | 'until-ready' | '4-seconds' | '8-seconds';
export type MemorySnapMismatchDuration = 1000 | 2000 | 3000;

export interface MemorySnapSettings {
  pairCount: MemorySnapPairCount;
  previewMode: MemorySnapPreviewMode;
  mismatchDuration: MemorySnapMismatchDuration;
  hintEnabled: boolean;
}
export type PatternTrainLevel = 'starter' | 'growing' | 'challenge';
export type NumberPicnicMaxQuantity = 3 | 5 | 8 | 10;
export type BreathingSessionLength = 3 | 5 | 10 | 'open-ended';
export interface CategoryMatchSettings {
  categoryCount: CategoryMatchCategoryCount;
  showPreview: boolean;
}

export interface BreathingGardenSettings {
  sessionLength: BreathingSessionLength;
  visualCue: boolean;
}

export interface GameSettingsMap {
  'memory-snap': MemorySnapSettings;
  drawing: Record<string, never>;
  'glitter-fall': GlitterFallSettings;
  'bubble-pop': { motion: 'still' | 'moving'; density: 'sparse' | 'full' };
  'category-match': CategoryMatchSettings;
  'keepy-uppy': { liftMode: 'gentle' | 'precise' };
  'breathing-garden': BreathingGardenSettings;
  'pattern-train': { level: PatternTrainLevel };
  'number-picnic': {
    maxQuantity: NumberPicnicMaxQuantity;
    stage: NumberPicnicStage;
    mode: NumberPicnicMode;
    spokenCounting: boolean;
  };
}

export const DEFAULT_GAME_SETTINGS: GameSettingsMap = {
  'memory-snap': {
    pairCount: 2,
    previewMode: 'none',
    mismatchDuration: 2000,
    hintEnabled: true,
  },
  drawing: {},
  'glitter-fall': DEFAULT_GLITTER_SETTINGS,
  'bubble-pop': { motion: 'still', density: 'sparse' },
  'category-match': { categoryCount: 2, showPreview: true },
  'keepy-uppy': { liftMode: 'gentle' },
  'breathing-garden': { sessionLength: 'open-ended', visualCue: true },
  'pattern-train': { level: 'starter' },
  'number-picnic': {
    maxQuantity: 5,
    stage: '1-5',
    mode: 'make-amount',
    spokenCounting: false,
  },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const difficultyToPairCount = (difficulty: unknown): MemorySnapPairCount =>
  difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 6;

const difficultyToPatternLevel = (difficulty: unknown): PatternTrainLevel =>
  difficulty === 'hard' ? 'challenge' : difficulty === 'medium' ? 'growing' : 'starter';

const difficultyToMaxQuantity = (difficulty: unknown): NumberPicnicMaxQuantity =>
  difficulty === 'hard' ? 10 : difficulty === 'medium' ? 8 : 5;

export const maxQuantityToStage = (maxQuantity: NumberPicnicMaxQuantity): NumberPicnicStage =>
  maxQuantity === 3 ? '1-3' : maxQuantity === 5 ? '1-5' : '6-10';

export const stageToMaxQuantity = (stage: NumberPicnicStage): NumberPicnicMaxQuantity =>
  stage === '1-3' ? 3 : stage === '1-5' ? 5 : 10;

const isNumberPicnicStage = (value: unknown): value is NumberPicnicStage =>
  value === '1-3' || value === '1-5' || value === '6-10';

const isNumberPicnicMode = (value: unknown): value is NumberPicnicMode =>
  value === 'make-amount' ||
  value === 'find-amount' ||
  value === 'match-numeral' ||
  value === 'more-fewer' ||
  value === 'add-one-more';

const isStageModeAvailable = (stage: NumberPicnicStage, mode: NumberPicnicMode): boolean =>
  mode !== 'add-one-more' || stage === '6-10';

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
  const isLegacyProfile =
    !isObject(value) &&
    (legacy.settingsVersion === undefined ||
      (typeof legacy.settingsVersion === 'number' && legacy.settingsVersion < 2)) &&
    Object.keys(legacy).length > 0;
  const memory = isObject(candidate['memory-snap']) ? candidate['memory-snap'] : {};
  const glitter = isObject(candidate['glitter-fall']) ? candidate['glitter-fall'] : {};
  const bubble = isObject(candidate['bubble-pop']) ? candidate['bubble-pop'] : {};
  const category = isObject(candidate['category-match']) ? candidate['category-match'] : {};
  const keepy = isObject(candidate['keepy-uppy']) ? candidate['keepy-uppy'] : {};
  const breathing = isObject(candidate['breathing-garden']) ? candidate['breathing-garden'] : {};
  const pattern = isObject(candidate['pattern-train']) ? candidate['pattern-train'] : {};
  const picnic = isObject(candidate['number-picnic']) ? candidate['number-picnic'] : {};

  const pairCount = memory.pairCount;
  const level = pattern.level;
  const maxQuantity = picnic.maxQuantity;
  const stage = picnic.stage;
  const mode = picnic.mode;
  const previewMode = memory.previewMode;
  const mismatchDuration = memory.mismatchDuration;
  const categoryCount = category.categoryCount;
  const candidateMaxQuantity =
    maxQuantity === 3 || maxQuantity === 5 || maxQuantity === 8 || maxQuantity === 10
      ? maxQuantity
      : difficultyToMaxQuantity(legacy.difficulty);
  const resolvedStage = isNumberPicnicStage(stage)
    ? stage
    : maxQuantityToStage(candidateMaxQuantity);
  const resolvedMaxQuantity = isNumberPicnicStage(stage)
    ? stageToMaxQuantity(stage)
    : candidateMaxQuantity;

  return {
    'memory-snap': {
      pairCount:
        pairCount === 2 ||
        pairCount === 3 ||
        pairCount === 4 ||
        pairCount === 6 ||
        pairCount === 10 ||
        pairCount === 15
          ? pairCount
          : isLegacyProfile
            ? difficultyToPairCount(legacy.difficulty)
            : DEFAULT_GAME_SETTINGS['memory-snap'].pairCount,
      previewMode:
        previewMode === 'none' ||
        previewMode === 'until-ready' ||
        previewMode === '4-seconds' ||
        previewMode === '8-seconds'
          ? previewMode
          : typeof memory.showPreview === 'boolean'
            ? memory.showPreview
              ? '4-seconds'
              : 'none'
            : typeof legacy.showCardPreview === 'boolean'
              ? legacy.showCardPreview
                ? '4-seconds'
                : 'none'
              : DEFAULT_GAME_SETTINGS['memory-snap'].previewMode,
      mismatchDuration:
        mismatchDuration === 1000 || mismatchDuration === 2000 || mismatchDuration === 3000
          ? mismatchDuration
          : DEFAULT_GAME_SETTINGS['memory-snap'].mismatchDuration,
      hintEnabled:
        typeof memory.hintEnabled === 'boolean'
          ? memory.hintEnabled
          : DEFAULT_GAME_SETTINGS['memory-snap'].hintEnabled,
    },
    drawing: {},
    'glitter-fall': isLegacyProfile
      ? resolveGlitterSettings({ ...GLITTER_PRESETS.explore, shakeResponse: true })
      : resolveGlitterSettings(glitter),
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
      categoryCount:
        categoryCount === 2 || categoryCount === 3
          ? categoryCount
          : DEFAULT_GAME_SETTINGS['category-match'].categoryCount,
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
    'breathing-garden': {
      sessionLength:
        breathing.sessionLength === 3 ||
        breathing.sessionLength === 5 ||
        breathing.sessionLength === 10 ||
        breathing.sessionLength === 'open-ended'
          ? breathing.sessionLength
          : 'open-ended',
      visualCue: typeof breathing.visualCue === 'boolean' ? breathing.visualCue : true,
    },
    'pattern-train': {
      level:
        level === 'starter' || level === 'growing' || level === 'challenge'
          ? level
          : difficultyToPatternLevel(legacy.difficulty),
    },
    'number-picnic': {
      maxQuantity: resolvedMaxQuantity,
      stage: resolvedStage,
      mode:
        isNumberPicnicMode(mode) && isStageModeAvailable(resolvedStage, mode)
          ? mode
          : DEFAULT_GAME_SETTINGS['number-picnic'].mode,
      spokenCounting:
        typeof picnic.spokenCounting === 'boolean'
          ? picnic.spokenCounting
          : DEFAULT_GAME_SETTINGS['number-picnic'].spokenCounting,
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
