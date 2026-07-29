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
        reducedMotionEnabled: false,
        telemetryEnabled: false,
      },
      updateSettings: jest.fn(),
      updateGameSettings: jest.fn(),
      resetGameSettings: jest.fn(),
      resetAllSettings: jest.fn(),
    }),
  };
});

jest.mock('./src/context/PracticeHistoryContext', () => {
  const actual = jest.requireActual('./src/context/PracticeHistoryContext');
  return {
    ...actual,
    usePracticeHistory: () => ({
      records: [],
      settings: { enabled: false, retentionDays: 30 },
      recordResult: jest.fn().mockResolvedValue(undefined),
      updateSettings: jest.fn().mockResolvedValue(undefined),
      deleteAllRecords: jest.fn().mockResolvedValue(undefined),
      clearHistory: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
      isSaving: false,
      persistenceError: null,
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
        'home.subtitle': 'Choose something gentle',
        'home.emptyGames': 'All games are hidden. Enable one in Settings.',
        'home.settingsButton': '⚙️  Settings',
        'home.settingsHint': 'Opens app settings',
        'home.websiteLink': 'Visit gentlegames.org',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.back': '← Back',
        'games.memorySnap.name': 'Memory Snap',
        'games.memorySnap.description': 'Find matching pairs',
        'games.drawing.name': 'Drawing Pad',
        'games.drawing.description': 'Draw and make shapes',
        'games.drawing.title': 'Drawing',
        'games.drawing.welcomeBack': 'Welcome Back',
        'games.drawing.continuePrompt': 'Continue where you left off?',
        'games.drawing.newDrawing': 'New Drawing',
        'games.drawing.continueDrawing': 'Continue',
        'games.drawing.newDrawingHint': 'Start a new drawing',
        'games.drawing.continueHint': 'Continue with saved drawing',
        'games.drawing.addColour': 'Add a custom colour',
        'games.drawing.addColourHint': 'Open colour choices',
        'games.drawing.colourButtonHint': 'Choose this colour for drawing',
        'games.drawing.colourButtonEraserHint': 'Choose this colour and switch back to the pen',
        'games.drawing.colourPickerPresetHint': 'Choose this colour',
        'games.drawing.customColour': 'Custom colour {{hex}}',
        'games.drawing.penActivatedAnnouncement': 'Pen tool is now active',
        'games.drawing.colors.coral': 'Coral',
        'games.drawing.colors.red': 'Red',
        'games.drawing.colors.orangeRed': 'Orange-red',
        'games.glitterFall.name': 'Glitter Fall',
        'games.glitterFall.description': 'Watch sparkles drift',
        'games.bubblePop.name': 'Bubble Pop',
        'games.bubblePop.description': 'Pop bubbles slowly',
        'games.categoryMatch.name': 'Category Match',
        'games.categoryMatch.description': 'Sort pictures into groups',
        'games.keepyUppy.name': 'Keepy Uppy',
        'games.keepyUppy.description': 'Keep the balloon floating',
        'games.breathingGarden.name': 'Breathing Garden',
        'games.patternTrain.name': 'Pattern Train',
        'games.patternTrain.description': 'Complete cosy patterns',
        'games.numberPicnic.name': 'Number Picnic',
        'games.numberPicnic.description': 'Count and fill the basket',
        'games.numberPicnic.undo': 'Undo',
        'games.numberPicnic.reset': 'Reset',
        'games.numberPicnic.nextPicnic': 'Next Picnic',
        'games.numberPicnic.undoHint': 'Remove the last item you placed',
        'games.numberPicnic.resetHint': 'Clear this picnic and keep the same target',
        'games.numberPicnic.nextPicnicHint': 'Continue to the next picnic challenge',
        'games.numberPicnic.removeItemAccessibilityLabel':
          'Remove {{item}} {{index}} from the basket',
        'games.numberPicnic.removeItemAccessibilityHint': 'Tap to return this item to the blanket',
        'games.letterLanterns.name': 'Letter Lanterns',
        'games.starPath.name': 'Star Path',
        'difficulty.title': 'Select difficulty',
        'difficulty.optionLabel': '{{label}}  ·  {{description}}',
        'difficulty.accessibilityLabel': '{{label}} difficulty',
        'difficulty.easy.label': 'Easy',
        'difficulty.medium.label': 'Medium',
        'difficulty.hard.label': 'Hard',
        'settings.title': 'Settings',
        'settings.saving': 'Saving…',
        'settings.saved': 'Saved',
        'settings.persistenceError':
          'Settings could not be saved. Your changes are still shown, but may be lost if you close the app.',
        'settings.language.title': 'Language',
        'settings.language.description': 'Choose your preferred language',
        'settings.appearance.title': 'Appearance',
        'settings.appearance.light': 'Light',
        'settings.appearance.dark': 'Dark',
        'settings.appearance.system': 'System',
        'settings.appearance.description':
          'Soft pastel tones are used in both light and dark modes',
        'settings.cardPreview.label': 'Show Card Preview',
        'settings.memorySnap.title': 'Memory Snap',
        'settings.numberPicnic.title': 'Number Picnic',
        'settings.numberPicnic.maximumQuantity.title': 'Largest number',
        'settings.numberPicnic.maximumQuantity.description':
          'Choose the largest target number. Each picnic has only a few extra items.',
        'settings.numberPicnic.maximumQuantity.five': 'Up to 5',
        'settings.numberPicnic.maximumQuantity.eight': 'Up to 8',
        'settings.numberPicnic.maximumQuantity.ten': 'Up to 10',
        'settings.numberPicnic.stage.title': 'Number stage',
        'settings.numberPicnic.stage.description': 'Choose a calm range of numbers to explore',
        'settings.numberPicnic.stage.oneToThree': '1–3',
        'settings.numberPicnic.stage.oneToFive': '1–5',
        'settings.numberPicnic.stage.sixToTen': '6–10',
        'settings.numberPicnic.mode.title': 'Learning mode',
        'settings.numberPicnic.mode.description': 'Choose one clear idea to practise',
        'settings.numberPicnic.modes.makeAmount': 'Make the amount',
        'settings.numberPicnic.modes.findAmount': 'Find the amount',
        'settings.numberPicnic.modes.matchNumeral': 'Match numeral and amount',
        'settings.numberPicnic.modes.moreFewer': 'More or fewer',
        'settings.numberPicnic.modes.addOneMore': 'Add one more',
        'settings.numberPicnic.spokenCounting.label': 'Speak each count',
        'settings.numberPicnic.spokenCounting.description':
          'Speak the new count after each item is placed. Sound must also be on.',
        'settings.memorySnap.pairs.title': 'Pairs',
        'settings.memorySnap.pairs.description': 'Choose a board that feels comfortable',
        'settings.memorySnap.pairs.two': '2 pairs · 2×2',
        'settings.memorySnap.pairs.three': '3 pairs · 2×3',
        'settings.memorySnap.pairs.four': '4 pairs · 2×4',
        'settings.memorySnap.pairs.six': '6 pairs · 3×4',
        'settings.memorySnap.pairs.ten': '10 pairs · 4×5',
        'settings.memorySnap.pairs.fifteen': '15 pairs · 5×6',
        'settings.memorySnap.pairs.twoDescription': 'A small 2×2 board',
        'settings.memorySnap.pairs.threeDescription': 'A calm 2×3 board',
        'settings.memorySnap.pairs.fourDescription': 'A gentle 2×4 board',
        'settings.memorySnap.pairs.sixDescription': 'A 3×4 board',
        'settings.memorySnap.pairs.tenDescription': 'A 4×5 board',
        'settings.memorySnap.pairs.fifteenDescription': 'A 5×6 board',
        'settings.memorySnap.preview.title': 'Preview',
        'settings.memorySnap.preview.description':
          'Choose whether to see the cards before you begin',
        'settings.memorySnap.preview.none': 'None',
        'settings.memorySnap.preview.untilReady': 'Until ready',
        'settings.memorySnap.preview.fourSeconds': '4 seconds',
        'settings.memorySnap.preview.eightSeconds': '8 seconds',
        'settings.memorySnap.mismatch.title': 'Mismatched cards',
        'settings.memorySnap.mismatch.description': 'Choose how long mismatched cards stay visible',
        'settings.memorySnap.mismatch.oneSecond': '1 second',
        'settings.memorySnap.mismatch.twoSeconds': '2 seconds',
        'settings.memorySnap.mismatch.threeSeconds': '3 seconds',
        'settings.memorySnap.hint.label': 'One-card hint',
        'settings.memorySnap.hint.description':
          'Allow a quiet look at one card you have seen before',
        'settings.animations.label': 'Animations',
        'settings.keepyUppyEasyMode.label': 'Keepy Uppy Easy Mode',
        'settings.sound.label': 'Sound',
        'settings.telemetry.label': 'Share anonymous app updates',
        'settings.telemetry.description':
          'Analytics and crash reports stay off until you turn this on.',
        'settings.volume.title': 'Volume',
        'settings.gamesOnHomeScreen.title': 'Games on Home Screen',
        'settings.parentTimer.title': 'Parent Timer',
        'settings.parentTimer.off': 'Off',
        'settings.parentTimer.duration': '{{count}} min',
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
        'games.categoryMatch.previewInstruction':
          'The sorting rule is item type. Choose the matching group.',
        'games.categoryMatch.categories.food': 'Food',
        'games.categoryMatch.categories.toys': 'Toys',
        'games.categoryMatch.categories.clothes': 'Clothes',
        'settings.categoryMatch.title': 'Category Match',
        'settings.categoryMatch.categories.title': 'Number of groups',
        'settings.categoryMatch.categories.two': '2 groups: Food and Toys',
        'settings.categoryMatch.categories.three': '3 groups: Food, Toys, and Clothes',
        'settings.categoryMatch.categories.description':
          'Start with two clear groups. Three groups adds Clothes for later practice.',
        // Memory Snap
        'games.memorySnap.moves': '{{count}} moves',
        'games.memorySnap.wellDone': 'Well Done! 🎉',
        'games.memorySnap.completedIn': 'You finished in {{time}}!',
        'games.memorySnap.completedTitle': 'All pairs are together',
        'games.memorySnap.completed': 'All pairs are together.',
        'games.memorySnap.notStarted': '—',
        'games.memorySnap.previewShowing': 'Take a quiet look at the cards',
        'games.memorySnap.previewUntilReady': 'Look at the cards until you feel ready',
        'games.memorySnap.ready': 'Ready',
        'games.memorySnap.readyHint': 'Hide the preview and begin',
        'games.memorySnap.hint': 'Show one card',
        'games.memorySnap.hintHint': 'Reveal one card you have seen before without making a move',
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
        'home.websiteLinkFallback.title': 'Website unavailable',
        'home.websiteLinkFallback.message':
          "We couldn't open the Gentle Games website right now. Please try again later.",
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
        'games.breathingGarden.description': 'Follow a calm breathing rhythm',
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

export {};

// Animation mocks for GlitterGlobe
let mockRafId = 0;
(global as unknown as Record<string, unknown>).requestAnimationFrame = jest.fn(
  (callback: (time: number) => void) => {
    mockRafId += 1;
    return setTimeout(() => callback(mockRafId * 16), 16);
  },
);

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
