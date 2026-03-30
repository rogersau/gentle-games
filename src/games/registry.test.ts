import { PASTEL_COLORS, UNFINISHED_GAMES } from '../types';
import { APP_ROUTES, HOME_GAME_ROUTES } from '../types/navigation';
import {
  GAME_REGISTRY,
  getGameById,
  getGameRoute,
  getVisibleGames,
  isGameId,
} from './registry';

describe('game registry', () => {
  it('filters hidden and unfinished games from visible games', () => {
    const visibleGames = getVisibleGames(['drawing'], false);

    expect(visibleGames.map((game) => game.id)).not.toContain('drawing');

    for (const unfinishedGameId of UNFINISHED_GAMES) {
      expect(visibleGames.map((game) => game.id)).not.toContain(unfinishedGameId);
    }

    expect(visibleGames.map((game) => game.id)).toContain('memory-snap');
  });

  it('keeps every game route aligned with the shared navigation map', () => {
    expect(
      Object.fromEntries(GAME_REGISTRY.map((game) => [game.id, game.route])) as Record<
        string,
        string
      >,
    ).toEqual(HOME_GAME_ROUTES);

    for (const game of GAME_REGISTRY) {
      expect(game.route).toBe(APP_ROUTES[game.route]);
    }
  });

  it('returns routes for direct game id lookups', () => {
    expect(getGameRoute('memory-snap')).toBe(APP_ROUTES.Game);
    expect(getGameRoute('drawing')).toBe(APP_ROUTES.Drawing);
    expect(getGameRoute('number-picnic')).toBe(APP_ROUTES.NumberPicnic);
  });

  it('throws for invalid route lookups', () => {
    expect(() => getGameRoute('not-a-game')).toThrow("Unknown game id: not-a-game");
    expect(() => getGameById('not-a-game')).toThrow("Unknown game id: not-a-game");
  });

  it('recognizes valid and invalid game ids', () => {
    expect(isGameId('memory-snap')).toBe(true);
    expect(isGameId('number-picnic')).toBe(true);
    expect(isGameId('not-a-game')).toBe(false);
    expect(isGameId(undefined)).toBe(false);
  });

  it('does not include duplicate game ids', () => {
    const ids = GAME_REGISTRY.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes required metadata for every game', () => {
    expect(GAME_REGISTRY).toEqual([
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
    ]);
  });
});
