export type AppStackParamList = {
  Home: undefined;
  Game: undefined;
  Settings: undefined;
  Drawing: undefined;
  Glitter: undefined;
  Bubble: undefined;
  CategoryMatch: undefined;
  KeepyUppy: undefined;
  BreathingGarden: undefined;
  PatternTrain: undefined;
  NumberPicnic: undefined;
};

export type AppRouteName = keyof AppStackParamList;

export const APP_ROUTES = {
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
} as const satisfies Record<AppRouteName, AppRouteName>;

export type HomeGameId =
  | 'memory-snap'
  | 'drawing'
  | 'glitter-fall'
  | 'bubble-pop'
  | 'category-match'
  | 'keepy-uppy'
  | 'breathing-garden'
  | 'pattern-train'
  | 'number-picnic';

export const HOME_GAME_ROUTES = {
  'memory-snap': APP_ROUTES.Game,
  drawing: APP_ROUTES.Drawing,
  'glitter-fall': APP_ROUTES.Glitter,
  'bubble-pop': APP_ROUTES.Bubble,
  'category-match': APP_ROUTES.CategoryMatch,
  'keepy-uppy': APP_ROUTES.KeepyUppy,
  'breathing-garden': APP_ROUTES.BreathingGarden,
  'pattern-train': APP_ROUTES.PatternTrain,
  'number-picnic': APP_ROUTES.NumberPicnic,
} as const satisfies Record<HomeGameId, AppRouteName>;

export function isAppRouteName(routeName: string | undefined): routeName is AppRouteName {
  return !!routeName && routeName in APP_ROUTES;
}
