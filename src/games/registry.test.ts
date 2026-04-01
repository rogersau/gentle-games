import { PASTEL_COLORS } from '../types';
import { APP_ROUTES } from '../types/navigation';
import {
  GAME_REGISTRY,
  getGameById,
  getGameRoute,
  getVisibleGames,
  isGameId,
} from './registry';

describe('game registry', () => {
  it('filters hidden and unfinished games from visible games', () => {
    const visibleGames = getVisibleGames({
      hiddenGames: ['drawing'],
      enableUnfinishedGames: false,
    });

    expect(visibleGames.map((game) => game.id)).not.toContain('drawing');
    expect(visibleGames.map((game) => game.id)).not.toContain('number-picnic');
    expect(visibleGames.map((game) => game.id)).toContain('memory-snap');
  });

  it('keeps every game route aligned with the registry contract', () => {
    expect(
      Object.fromEntries(GAME_REGISTRY.map((game) => [game.id, game.route])) as Record<
        string,
        string
      >,
    ).toEqual({
      'memory-snap': APP_ROUTES.Game,
      drawing: APP_ROUTES.Drawing,
      'glitter-fall': APP_ROUTES.Glitter,
      'bubble-pop': APP_ROUTES.Bubble,
      'category-match': APP_ROUTES.CategoryMatch,
      'keepy-uppy': APP_ROUTES.KeepyUppy,
      'breathing-garden': APP_ROUTES.BreathingGarden,
      'pattern-train': APP_ROUTES.PatternTrain,
      'number-picnic': APP_ROUTES.NumberPicnic,
    });

    for (const game of GAME_REGISTRY) {
      expect(game.route).toBe(APP_ROUTES[game.route]);
    }
  });

  it('returns routes for direct game id lookups', () => {
    expect(getGameRoute('memory-snap')).toBe(APP_ROUTES.Game);
    expect(getGameRoute('drawing')).toBe(APP_ROUTES.Drawing);
    expect(getGameRoute('number-picnic')).toBe(APP_ROUTES.NumberPicnic);
  });

  it('returns the full game definition for direct id lookups', () => {
    expect(getGameById('memory-snap')).toEqual({
      id: 'memory-snap',
      route: APP_ROUTES.Game,
      nameKey: 'games.memorySnap.name',
      descriptionKey: 'games.memorySnap.description',
      icon: '🧩',
      accentColor: PASTEL_COLORS.primary,
      isUnfinished: false,
      launchMode: 'difficulty-select',
    });
  });

  it('throws for invalid route lookups', () => {
    expect(() => getGameRoute('not-a-game')).toThrow("Unknown game id: not-a-game");
  });

  it('returns undefined for unknown game ids', () => {
    expect(getGameById('not-a-game')).toBeUndefined();
  });

  it('recognizes valid and invalid game ids', () => {
    expect(isGameId('memory-snap')).toBe(true);
    expect(isGameId('number-picnic')).toBe(true);
    expect(isGameId('not-a-game')).toBe(false);
    expect(isGameId('toString')).toBe(false);
    expect(isGameId('constructor')).toBe(false);
    expect(isGameId(undefined)).toBe(false);
  });

  it('rejects prototype-chain keys during route lookup', () => {
    expect(() => getGameRoute('toString')).toThrow('Unknown game id: toString');
    expect(() => getGameRoute('constructor')).toThrow('Unknown game id: constructor');
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
    ]);
  });
});
