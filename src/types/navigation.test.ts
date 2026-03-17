import { APP_ROUTES, HOME_GAME_ROUTES } from './navigation';

describe('navigation contract', () => {
  it('covers every audited app stack screen from one shared route module', () => {
    expect(APP_ROUTES).toEqual({
      Home: 'Home',
      Game: 'Game',
      Settings: 'Settings',
      Drawing: 'Drawing',
      Glitter: 'Glitter',
      Bubble: 'Bubble',
      CategoryMatch: 'CategoryMatch',
      KeepyUppy: 'KeepyUppy',
      BreathingGarden: 'BreathingGarden',
      PatternTrain: 'PatternTrain',
      NumberPicnic: 'NumberPicnic',
    });
    expect(APP_ROUTES.Home).toBe('Home');
  });

  it('keeps the home game launch map aligned with shared app route constants', () => {
    expect(HOME_GAME_ROUTES).toEqual({
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
  });
});
