jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/context/SettingsContext', () => {
  const actual = jest.requireActual('./src/context/SettingsContext');
  return {
    ...actual,
    useSettings: () => ({
      settings: {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        soundVolume: 70,
        animationsEnabled: true,
        colorMode: 'light' as const,
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
      },
      updateSettings: jest.fn(),
    }),
  };
});

export {};
