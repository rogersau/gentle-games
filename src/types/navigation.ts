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

export function isAppRouteName(routeName: string | undefined): routeName is AppRouteName {
  return !!routeName && routeName in APP_ROUTES;
}
