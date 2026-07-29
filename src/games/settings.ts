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

export const SETTINGS_VERSION = 5;

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

export interface BubblePopSettings {
  motion: 'still' | 'moving';
  speed: 'slow' | 'medium' | 'fast';
  density: 'sparse' | 'medium' | 'full';
  size: 'small' | 'medium' | 'large';
  sound: boolean;
}

export interface DrawingSettings {
  mode: 'free-draw' | 'gentle-trails' | 'copy-and-continue' | 'prompted-drawing';
  trailPattern: 'straight' | 'wave' | 'spiral' | 'zigzag' | 'shape' | 'road';
  copyActivity: 'copy-line' | 'complete-picture' | 'continue-pattern';
  tolerance: 24 | 40 | 56;
  pathWidth: 48 | 68 | 88;
  strokeWidth: 3 | 5 | 8;
  smoothing: boolean;
}

export type KeepyUppyProfile =
  | 'large-and-slow'
  | 'tap-anywhere'
  | 'direct-touch'
  | 'target-zones'
  | 'left-and-right'
  | 'more-balloons';

export interface KeepyUppySettings {
  liftMode: 'gentle' | 'precise';
  profile: KeepyUppyProfile;
  balloonSize: number;
  gravity: number;
  targetSize: number;
  balloonCount: 1 | 2 | 3;
}

export interface GameSettingsMap {
  'memory-snap': MemorySnapSettings;
  drawing: DrawingSettings;
  'glitter-fall': GlitterFallSettings;
  'bubble-pop': BubblePopSettings;
  'category-match': CategoryMatchSettings;
  'keepy-uppy': KeepyUppySettings;
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
  drawing: {
    mode: 'free-draw',
    trailPattern: 'straight',
    copyActivity: 'copy-line',
    tolerance: 40,
    pathWidth: 68,
    strokeWidth: 5,
    smoothing: true,
  },
  'glitter-fall': DEFAULT_GLITTER_SETTINGS,
  'bubble-pop': {
    motion: 'still',
    speed: 'slow',
    density: 'sparse',
    size: 'large',
    sound: true,
  },
  'category-match': { categoryCount: 2, showPreview: true },
  'keepy-uppy': {
    liftMode: 'gentle',
    profile: 'large-and-slow',
    balloonSize: 46,
    gravity: 82,
    targetSize: 1.8,
    balloonCount: 1,
  },
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
  const drawing = isObject(candidate.drawing) ? candidate.drawing : {};
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
    drawing: {
      mode:
        drawing.mode === 'free-draw' ||
        drawing.mode === 'gentle-trails' ||
        drawing.mode === 'copy-and-continue' ||
        drawing.mode === 'prompted-drawing'
          ? drawing.mode
          : DEFAULT_GAME_SETTINGS.drawing.mode,
      trailPattern:
        drawing.trailPattern === 'straight' ||
        drawing.trailPattern === 'wave' ||
        drawing.trailPattern === 'spiral' ||
        drawing.trailPattern === 'zigzag' ||
        drawing.trailPattern === 'shape' ||
        drawing.trailPattern === 'road'
          ? drawing.trailPattern
          : DEFAULT_GAME_SETTINGS.drawing.trailPattern,
      copyActivity:
        drawing.copyActivity === 'copy-line' ||
        drawing.copyActivity === 'complete-picture' ||
        drawing.copyActivity === 'continue-pattern'
          ? drawing.copyActivity
          : DEFAULT_GAME_SETTINGS.drawing.copyActivity,
      tolerance:
        drawing.tolerance === 24 || drawing.tolerance === 40 || drawing.tolerance === 56
          ? drawing.tolerance
          : DEFAULT_GAME_SETTINGS.drawing.tolerance,
      pathWidth:
        drawing.pathWidth === 48 || drawing.pathWidth === 68 || drawing.pathWidth === 88
          ? drawing.pathWidth
          : DEFAULT_GAME_SETTINGS.drawing.pathWidth,
      strokeWidth:
        drawing.strokeWidth === 3 || drawing.strokeWidth === 5 || drawing.strokeWidth === 8
          ? drawing.strokeWidth
          : DEFAULT_GAME_SETTINGS.drawing.strokeWidth,
      smoothing:
        typeof drawing.smoothing === 'boolean'
          ? drawing.smoothing
          : DEFAULT_GAME_SETTINGS.drawing.smoothing,
    },
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
        bubble.density === 'full' || bubble.density === 'medium' || bubble.density === 'sparse'
          ? bubble.density
          : isLegacyProfile
            ? 'full'
            : DEFAULT_GAME_SETTINGS['bubble-pop'].density,
      speed:
        bubble.speed === 'slow' || bubble.speed === 'medium' || bubble.speed === 'fast'
          ? bubble.speed
          : DEFAULT_GAME_SETTINGS['bubble-pop'].speed,
      size:
        bubble.size === 'small' || bubble.size === 'medium' || bubble.size === 'large'
          ? bubble.size
          : DEFAULT_GAME_SETTINGS['bubble-pop'].size,
      sound:
        typeof bubble.sound === 'boolean'
          ? bubble.sound
          : DEFAULT_GAME_SETTINGS['bubble-pop'].sound,
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
      profile:
        keepy.profile === 'large-and-slow' ||
        keepy.profile === 'tap-anywhere' ||
        keepy.profile === 'direct-touch' ||
        keepy.profile === 'target-zones' ||
        keepy.profile === 'left-and-right' ||
        keepy.profile === 'more-balloons'
          ? keepy.profile
          : keepy.liftMode === 'precise' || legacy.keepyUppyEasyMode === false
            ? 'direct-touch'
            : DEFAULT_GAME_SETTINGS['keepy-uppy'].profile,
      balloonSize:
        typeof keepy.balloonSize === 'number' && keepy.balloonSize >= 24 && keepy.balloonSize <= 52
          ? keepy.balloonSize
          : DEFAULT_GAME_SETTINGS['keepy-uppy'].balloonSize,
      gravity:
        typeof keepy.gravity === 'number' && keepy.gravity >= 60 && keepy.gravity <= 260
          ? keepy.gravity
          : DEFAULT_GAME_SETTINGS['keepy-uppy'].gravity,
      targetSize:
        typeof keepy.targetSize === 'number' && keepy.targetSize >= 1 && keepy.targetSize <= 3
          ? keepy.targetSize
          : DEFAULT_GAME_SETTINGS['keepy-uppy'].targetSize,
      balloonCount:
        keepy.balloonCount === 1 || keepy.balloonCount === 2 || keepy.balloonCount === 3
          ? keepy.balloonCount
          : DEFAULT_GAME_SETTINGS['keepy-uppy'].balloonCount,
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
