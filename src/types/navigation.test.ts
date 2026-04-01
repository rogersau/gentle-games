import * as navigation from './navigation';

const { APP_ROUTES, isAppRouteName } = navigation;

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

  it('exports only the shared app route surface', () => {
    expect(Object.keys(navigation).sort()).toEqual(['APP_ROUTES', 'isAppRouteName']);
  });

  it('recognizes valid app route names', () => {
    expect(isAppRouteName(APP_ROUTES.Home)).toBe(true);
    expect(isAppRouteName(APP_ROUTES.Settings)).toBe(true);
    expect(isAppRouteName('NotARoute')).toBe(false);
    expect(isAppRouteName(undefined)).toBe(false);
  });
});
