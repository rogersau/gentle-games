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
        soundVolume: 0.7,
        animationsEnabled: true,
        colorMode: 'light' as const,
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
        language: 'en-AU',
      },
      updateSettings: jest.fn(),
    }),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // Return English translations for game names and common strings
      const translations: Record<string, string> = {
        'home.title': 'Gentle Games',
        'home.subtitle': 'Calm games for little ones',
        'home.settingsButton': '⚙️  Settings',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.back': '← Back',
        'games.memorySnap.name': 'Memory Snap',
        'games.memorySnap.description': 'A calm memory matching game',
        'games.drawing.name': 'Drawing Pad',
        'games.drawing.description': 'Draw with colours and erase',
        'games.glitterFall.name': 'Glitter Fall',
        'games.glitterFall.description': 'Snow globe glitter play',
        'games.bubblePop.name': 'Bubble Pop',
        'games.bubblePop.description': 'Tap falling bubbles',
        'games.categoryMatch.name': 'Category Match',
        'games.categoryMatch.description': 'Drag to sort by category',
        'games.keepyUppy.name': 'Keepy Uppy',
        'games.keepyUppy.description': 'Tap balloons in the backyard',
        'games.breathingGarden.name': 'Breathing Garden',
        'games.patternTrain.name': 'Pattern Train',
        'games.numberPicnic.name': 'Number Picnic',
        'games.letterLanterns.name': 'Letter Lanterns',
        'games.starPath.name': 'Star Path',
        'difficulty.title': 'Select difficulty',
        'difficulty.easy.label': 'Easy',
        'difficulty.medium.label': 'Medium',
        'difficulty.hard.label': 'Hard',
        'settings.title': 'Settings',
        'settings.language.title': 'Language',
        'settings.language.description': 'Choose your preferred language',
        'settings.saveHint': 'Save settings and return home',
        'settings.backHint': 'Return to the home screen',
        'settings.appearance.title': 'Appearance',
        'settings.appearance.light': 'Light',
        'settings.appearance.dark': 'Dark',
        'settings.appearance.system': 'System',
        'settings.cardPreview.label': 'Show Card Preview',
        'settings.animations.label': 'Animations',
        'settings.keepyUppyEasyMode.label': 'Keepy Uppy Easy Mode',
        'settings.sound.label': 'Sound',
        'settings.volume.title': 'Volume',
        'settings.gamesOnHomeScreen.title': 'Games on Home Screen',
        'settings.parentTimer.title': 'Parent Timer',
        'settings.parentTimer.off': 'Off',
        'games.keepyUppy.addBalloon': '+ Balloon',
        'games.keepyUppy.subtitle': 'Keep the balloon in the air!',
        'games.categoryMatch.subtitle': 'Sort each emoji into Sky, Land, or Ocean.',
        'games.categoryMatch.startSorting': 'Start Sorting',
        'games.categoryMatch.correct': 'Correct',
        // Bubble Pop
        'games.bubblePop.title': 'Bubble Pop',
        'games.bubblePop.subtitle': 'Tap the falling bubbles to pop them.',
        'games.bubblePop.popped': 'Popped: {{count}}',
        // Glitter Fall  
        'games.glitterFall.title': 'Glitter Fall',
        'games.glitterFall.subtitle': 'Shake or swipe to make the glitter sparkle',
        'games.glitterFall.addGlitter': '⭐ Sprinkle',
        'games.glitterFall.addGlitterHint': 'Add glitter particles to the globe',
        'games.glitterFall.clearGlitter': '🧹 Clear',
        'games.glitterFall.clearGlitterHint': 'Remove all glitter from the globe',
        // Keepy Uppy
        'games.keepyUppy.title': 'Keepy Uppy',
        'games.keepyUppy.taps': 'Taps: {{count}}',
        'games.keepyUppy.balloons': 'Balloons: {{count}}',
        'games.keepyUppy.popped': 'Popped: {{count}}',
        // Category Match
        'games.categoryMatch.title': 'Category Match',
        'games.categoryMatch.quickPreview': 'Quick Preview',
        'games.categoryMatch.dragInstruction': 'Drag each item to the correct category box',
        'games.categoryMatch.startSortingHint': 'Begin the category sorting game',
        // Memory Snap
        'games.memorySnap.moves': '{{count}} moves',
        'games.memorySnap.timeLabel': 'Time: {{time}}',
        'games.memorySnap.goHome': 'Home',
        'games.memorySnap.goHomeHint': 'Return to main screen',
        'common.timerNotStarted': 'Timer not started',
      };

      const translation = translations[key] || key;

      // Simple interpolation for values like {{letter}}
      if (options && typeof options === 'object') {
        let result = translation;
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
        return result;
      }

      return translation;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en-AU',
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('posthog-react-native', () => {
  const mockPostHog = {
    capture: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
    optIn: jest.fn(),
    optOut: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockPostHog),
    PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
    usePostHog: () => mockPostHog,
  };
});

export { };
