import { PASTEL_COLORS, UNFINISHED_GAMES } from '../types';
import type { AppRouteName, HomeGameId } from '../types/navigation';
import { APP_ROUTES } from '../types/navigation';
import type { TranslationKey } from '../i18n/types';

export type GameId = HomeGameId;

export interface GameDefinition {
  id: GameId;
  route: AppRouteName;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  accentColor: string;
}

export const GAME_REGISTRY: readonly GameDefinition[] = [
  {
    id: 'memory-snap',
    route: APP_ROUTES.Game,
    nameKey: 'games.memorySnap.name',
    descriptionKey: 'games.memorySnap.description',
    icon: '🧩',
    accentColor: PASTEL_COLORS.primary,
  },
  {
    id: 'drawing',
    route: APP_ROUTES.Drawing,
    nameKey: 'games.drawing.name',
    descriptionKey: 'games.drawing.description',
    icon: '🎨',
    accentColor: PASTEL_COLORS.secondary,
  },
  {
    id: 'glitter-fall',
    route: APP_ROUTES.Glitter,
    nameKey: 'games.glitterFall.name',
    descriptionKey: 'games.glitterFall.description',
    icon: '✨',
    accentColor: PASTEL_COLORS.accent,
  },
  {
    id: 'bubble-pop',
    route: APP_ROUTES.Bubble,
    nameKey: 'games.bubblePop.name',
    descriptionKey: 'games.bubblePop.description',
    icon: '🫧',
    accentColor: PASTEL_COLORS.success,
  },
  {
    id: 'category-match',
    route: APP_ROUTES.CategoryMatch,
    nameKey: 'games.categoryMatch.name',
    descriptionKey: 'games.categoryMatch.description',
    icon: '🗂️',
    accentColor: PASTEL_COLORS.cardBack,
  },
  {
    id: 'keepy-uppy',
    route: APP_ROUTES.KeepyUppy,
    nameKey: 'games.keepyUppy.name',
    descriptionKey: 'games.keepyUppy.description',
    icon: '🎈',
    accentColor: PASTEL_COLORS.secondary,
  },
  {
    id: 'breathing-garden',
    route: APP_ROUTES.BreathingGarden,
    nameKey: 'games.breathingGarden.name',
    descriptionKey: 'games.breathingGarden.description',
    icon: '🌸',
    accentColor: PASTEL_COLORS.accent,
  },
  {
    id: 'pattern-train',
    route: APP_ROUTES.PatternTrain,
    nameKey: 'games.patternTrain.name',
    descriptionKey: 'games.patternTrain.description',
    icon: '🚂',
    accentColor: PASTEL_COLORS.primary,
  },
  {
    id: 'number-picnic',
    route: APP_ROUTES.NumberPicnic,
    nameKey: 'games.numberPicnic.name',
    descriptionKey: 'games.numberPicnic.description',
    icon: '🧺',
    accentColor: PASTEL_COLORS.success,
  },
] as const;

const GAME_REGISTRY_BY_ID: Readonly<Record<GameId, GameDefinition>> = Object.fromEntries(
  GAME_REGISTRY.map((game) => [game.id, game]),
) as Record<GameId, GameDefinition>;

export function getVisibleGames(
  hiddenGames: readonly string[],
  includeUnfinishedGames = true,
): readonly GameDefinition[] {
  return GAME_REGISTRY.filter((game) => {
    if (hiddenGames.includes(game.id)) {
      return false;
    }

    if (!includeUnfinishedGames && UNFINISHED_GAMES.includes(game.id)) {
      return false;
    }

    return true;
  });
}

export function isGameId(gameId: string | undefined): gameId is GameId {
  return !!gameId && gameId in GAME_REGISTRY_BY_ID;
}

export function getGameById(gameId: string): GameDefinition {
  if (!isGameId(gameId)) {
    throw new Error(`Unknown game id: ${gameId}`);
  }

  return GAME_REGISTRY_BY_ID[gameId];
}

export function getGameRoute(gameId: string): AppRouteName {
  return getGameById(gameId).route;
}
