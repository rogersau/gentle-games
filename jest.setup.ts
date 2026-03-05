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

const originalConsoleInfo = console.info;
console.info = (...args: Parameters<typeof console.info>) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('i18next is maintained with support from Locize')
  ) {
    return;
  }
  originalConsoleInfo(...args);
};

// Suppress expected warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args: Parameters<typeof console.warn>) => {
  // Suppress DrawingScreen error messages during intentional error testing
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Error loading saved drawing:') ||
      args[0].includes('Error saving drawing:') ||
      args[0].includes('Error clearing saved drawing:') ||
      args[0].includes('Error auto-saving drawing:'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Suppress React act() warnings in test environment
const originalConsoleError = console.error;
console.error = (...args: Parameters<typeof console.error>) => {
  // Suppress React act() warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('was not wrapped in act') ||
      args[0].includes('An update to') ||
      args[0].includes('inside a test was not wrapped in act'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

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
        'games.drawing.title': 'Drawing',
        'games.drawing.welcomeBack': 'Welcome Back',
        'games.drawing.continuePrompt': 'Continue where you left off?',
        'games.drawing.newDrawing': 'New Drawing',
        'games.drawing.continueDrawing': 'Continue',
        'games.drawing.newDrawingHint': 'Start a new drawing',
        'games.drawing.continueHint': 'Continue with saved drawing',
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
        // Pattern Train
        'games.patternTrain.title': 'Pattern Train',
        'games.patternTrain.subtitle': 'Complete the train pattern',
        'games.patternTrain.train.arrived': 'The train has arrived with pattern: {{pattern}}',
        'games.patternTrain.feedback.initial': 'Drag a carriage to complete the train',
        'games.patternTrain.feedback.correct': 'Correct! Well done!',
        'games.patternTrain.feedback.incorrect': 'Not quite right. Try again!',
        'games.patternTrain.feedback.correctOptions': 'Great job! Wonderful! Perfect!',
        'games.patternTrain.feedback.incorrectOptions': 'Try again! Keep trying! Almost!',
        'games.patternTrain.feedback.reveal': 'The answer was {{answer}}',
        'games.patternTrain.milestone.default': 'Amazing! You completed 5 patterns!',
        'games.patternTrain.milestone.messages': 'Fantastic work! Keep it up!',
        'games.patternTrain.difficulty.easy.label': 'Easy',
        'games.patternTrain.difficulty.easy.description': 'Simple AB patterns',
        'games.patternTrain.difficulty.medium.label': 'Medium',
        'games.patternTrain.difficulty.medium.description': 'ABC and AAB patterns',
        'games.patternTrain.difficulty.hard.label': 'Hard',
        'games.patternTrain.difficulty.hard.description': 'Complex patterns',
        // Common UI strings
        'common.selectOption': 'Select an option',
        'common.openOptions': 'Open options',
        'common.close': 'Close',
        'common.on': 'On',
        'common.off': 'Off',
        // Settings volume
        'settings.volume.decrease': 'Decrease volume',
        'settings.volume.increase': 'Increase volume',
        // Accessibility
        'accessibility.gameCardHint': 'Tap to play this game',
        // Glitter Fall accessibility
        'games.glitterFall.accessibility': 'Glitter globe, shake or swipe to interact',
        // Breathing Garden
        'games.breathingGarden.title': 'Breathing Garden',
        'games.breathingGarden.description': 'Gentle breathing exercise',
        'games.breathingGarden.changeColor': 'Change color',
        'games.breathingGarden.musicOn': 'Music on',
        'games.breathingGarden.musicOff': 'Music off',
        'games.breathingGarden.inhale': 'Breathe in',
        'games.breathingGarden.exhale': 'Breathe out',
        'games.breathingGarden.breaths': 'Breaths',
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

// Mock sounds
jest.mock('./src/utils/sounds', () => ({
  playMatchSound: jest.fn(() => Promise.resolve()),
  playFlipSound: jest.fn(() => Promise.resolve()),
  playCompleteSound: jest.fn(() => Promise.resolve()),
}));

export { };

// Animation mocks for GlitterGlobe
let mockRafId = 0;
(global as unknown as Record<string, unknown>).requestAnimationFrame = jest.fn((callback: (time: number) => void) => {
  mockRafId += 1;
  return setTimeout(() => callback(mockRafId * 16), 16);
});

(global as unknown as Record<string, unknown>).cancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

// Mock performance.now()
let mockPerformanceNow = 0;
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => {
      mockPerformanceNow += 16;
      return mockPerformanceNow;
    }),
  },
});

// Mock expo-sensors Accelerometer
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

// Note: ui/animations module is not mocked globally to allow tests to use real implementation
// Individual tests can mock specific hooks as needed

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      sentryDsn: 'https://test-dsn.sentry.io/12345',
      sentryDebug: false,
    },
  },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  flush: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  createAudioPlayer: jest.fn((source) => ({
    source,
    volume: 0.5,
    loop: false,
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock @expo-google-fonts/nunito
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: jest.fn(() => [true, null]),
}));
