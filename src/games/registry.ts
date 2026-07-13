import { PASTEL_COLORS } from '../types';
import type { AppRouteName } from '../types/navigation';
import { APP_ROUTES } from '../types/navigation';
import type { TranslationKey } from '../i18n/types';

export type GameId =
  | 'memory-snap'
  | 'drawing'
  | 'glitter-fall'
  | 'bubble-pop'
  | 'category-match'
  | 'keepy-uppy'
  | 'breathing-garden'
  | 'pattern-train'
  | 'number-picnic';
export type GameLaunchMode = 'direct' | 'difficulty-select';

export interface VisibleGamesOptions {
  hiddenGames: readonly GameId[];
  enableUnfinishedGames: boolean;
}

export interface GameDefinition {
  id: GameId;
  route: AppRouteName;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  accentColor: string;
  isUnfinished: boolean;
  launchMode: GameLaunchMode;
}

export const GAME_REGISTRY: readonly GameDefinition[] = [
  {
    id: 'memory-snap',
    route: APP_ROUTES.Game,
    nameKey: 'games.memorySnap.name',
    descriptionKey: 'games.memorySnap.description',
    icon: '🧩',
    accentColor: PASTEL_COLORS.primary,
    isUnfinished: false,
    launchMode: 'difficulty-select',
  },
  {
    id: 'drawing',
    route: APP_ROUTES.Drawing,
    nameKey: 'games.drawing.name',
    descriptionKey: 'games.drawing.description',
    icon: '🎨',
    accentColor: PASTEL_COLORS.secondary,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'glitter-fall',
    route: APP_ROUTES.Glitter,
    nameKey: 'games.glitterFall.name',
    descriptionKey: 'games.glitterFall.description',
    icon: '✨',
    accentColor: PASTEL_COLORS.accent,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'bubble-pop',
    route: APP_ROUTES.Bubble,
    nameKey: 'games.bubblePop.name',
    descriptionKey: 'games.bubblePop.description',
    icon: '🫧',
    accentColor: PASTEL_COLORS.success,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'category-match',
    route: APP_ROUTES.CategoryMatch,
    nameKey: 'games.categoryMatch.name',
    descriptionKey: 'games.categoryMatch.description',
    icon: '🗂️',
    accentColor: PASTEL_COLORS.cardBack,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'keepy-uppy',
    route: APP_ROUTES.KeepyUppy,
    nameKey: 'games.keepyUppy.name',
    descriptionKey: 'games.keepyUppy.description',
    icon: '🎈',
    accentColor: PASTEL_COLORS.secondary,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'breathing-garden',
    route: APP_ROUTES.BreathingGarden,
    nameKey: 'games.breathingGarden.name',
    descriptionKey: 'games.breathingGarden.description',
    icon: '🌸',
    accentColor: PASTEL_COLORS.accent,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'pattern-train',
    route: APP_ROUTES.PatternTrain,
    nameKey: 'games.patternTrain.name',
    descriptionKey: 'games.patternTrain.description',
    icon: '🚂',
    accentColor: PASTEL_COLORS.primary,
    isUnfinished: false,
    launchMode: 'direct',
  },
  {
    id: 'number-picnic',
    route: APP_ROUTES.NumberPicnic,
    nameKey: 'games.numberPicnic.name',
    descriptionKey: 'games.numberPicnic.description',
    icon: '🧺',
    accentColor: PASTEL_COLORS.success,
    isUnfinished: true,
    launchMode: 'direct',
  },
] as const;

const GAME_REGISTRY_BY_ID = new Map<GameId, GameDefinition>(
  GAME_REGISTRY.map((game) => [game.id, game]),
);

export function getVisibleGames({
  hiddenGames,
  enableUnfinishedGames,
}: VisibleGamesOptions): readonly GameDefinition[] {
  return GAME_REGISTRY.filter((game) => {
    if (hiddenGames.includes(game.id)) {
      return false;
    }

    if (!enableUnfinishedGames && game.isUnfinished) {
      return false;
    }

    return true;
  });
}

export function isGameId(gameId: string | undefined): gameId is GameId {
  return !!gameId && GAME_REGISTRY_BY_ID.has(gameId as GameId);
}

export function getGameById(gameId: string): GameDefinition | undefined {
  return GAME_REGISTRY_BY_ID.get(gameId as GameId);
}

export function getGameRoute(gameId: string): AppRouteName {
  const game = getGameById(gameId);

  if (!game) {
    throw new Error(`Unknown game id: ${gameId}`);
  }

  return game.route;
}
