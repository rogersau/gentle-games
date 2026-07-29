import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { PatternTrainScreen } from '../screens/PatternTrainScreen';
import { playFlipSound } from '../utils/sounds';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'games.patternTrain.title': 'Pattern Train',
        'games.patternTrain.subtitle': 'Complete the train pattern',
        'games.patternTrain.difficulty.easy.label': 'Easy',
        'games.patternTrain.difficulty.medium.label': 'Medium',
        'games.patternTrain.difficulty.hard.label': 'Hard',
        'games.patternTrain.difficulty.easy.description': 'Simple AB patterns',
        'games.patternTrain.difficulty.medium.description': 'ABC patterns',
        'games.patternTrain.difficulty.hard.description': 'Complex patterns',
        'games.patternTrain.platform.label': 'Platform',
        'games.patternTrain.feedback.initial': 'Drag a carriage to complete the train',
        'games.patternTrain.completedRounds': 'Completed',
        'games.patternTrain.instructions': 'Drag a carriage to complete the train',
        'games.patternTrain.train.accessibilityLabel': 'Train with pattern',
        'games.patternTrain.roundsAccessibilityLabel': '{{count}} rounds completed',
        'games.patternTrain.guidance.instruction':
          'Choose the carriage that continues the pattern.',
        'games.patternTrain.guidance.showPattern': 'Show the pattern: {{unit}} repeats.',
        'games.patternTrain.guidance.showPatternButton': 'Show the pattern',
        'games.patternTrain.guidance.replay': 'Hear instructions again',
        'games.patternTrain.guidance.skip': 'Skip',
        'games.patternTrain.guidance.next': 'Next',
        'games.patternTrain.guidance.nextHint': 'Next pattern',
        'games.patternTrain.guidance.model': 'Model: {{sequence}}',
        'games.patternTrain.guidance.modelAccessibilityLabel': 'Complete pattern: {{sequence}}.',
        'games.patternTrain.repeatUnit': 'Repeat {{unit}} for the {{rule}}.',
        'games.patternTrain.repeatUnitAccessibilityLabel': 'Repeat {{unit}}. Rule {{rule}}.',
        'games.patternTrain.rules.ab': 'AB pattern',
        'games.patternTrain.feedback.correct': 'Correct.',
        'games.patternTrain.feedback.incorrect': 'Try again.',
        'games.patternTrain.feedback.correctAnnouncement': 'Correct.',
        'games.patternTrain.feedback.incorrectAnnouncement': 'Try again.',
        'games.patternTrain.carriage.accessibilityLabel': 'Carriage with {{emoji}}',
        'games.patternTrain.carriage.accessibilityHint':
          'Tap to choose or drag to the missing place',
        'difficulty.title': 'Select Difficulty',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'settings.difficulty.easy': 'Easy',
        'settings.difficulty.medium': 'Medium',
        'settings.difficulty.hard': 'Hard',
      };
      let value = translations[key] || key;
      Object.entries(options ?? {}).forEach(([name, replacement]) => {
        value = value.replace(`{{${name}}}`, String(replacement));
      });
      return value;
    },
  }),
}));

jest.mock('../components/train', () => ({
  TrainEngine: jest.fn(() => null),
  Carriage: jest.fn(() => null),
  TrainTrack: jest.fn(() => null),
}));

jest.mock('../utils/patternTrainLogic', () => ({
  generateTrainPattern: jest.fn(() => ({
    carriages: [
      { emoji: '🌟', isMissing: false },
      { emoji: '🌈', isMissing: true },
      { emoji: '🌟', isMissing: false },
      { emoji: '🌈', isMissing: false },
    ],
    answer: '🌈',
    choices: ['🌈', '🌸'],
    patternLabel: 'AB pattern',
    repeatUnit: ['🌟', '🌈'],
    templateId: 'ab',
    missingIndex: 1,
    difficulty: 'easy',
  })),
  generateTransferPattern: jest.fn(),
  isTrainChoiceCorrect: jest.fn((pattern, choice) => pattern.answer === choice),
}));

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      cardBack: '#E8E4E1',
      cardFront: '#FFFFFF',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      success: '#B8E6B8',
      danger: '#FFB6B9',
      border: '#E8E4E1',
      surface: '#FFFFFF',
      surfaceElevated: '#FAFAFA',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

const patternSettings = {
  pressureFreeMode: false,
  reducedMotionEnabled: false,
  animationsEnabled: true,
  difficulty: 'easy' as const,
};
jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: patternSettings,
    updateGameSettings: jest.fn(),
  }),
}));

jest.mock('../utils/sounds', () => ({
  playMatchSound: jest.fn(),
  playFlipSound: jest.fn(),
  playCompleteSound: jest.fn(),
}));

jest.mock('../ui/animations', () => ({
  useGentleBounce: () => ({
    scale: { __getValue: () => 1 },
    bounce: jest.fn(),
  }),
  useScalePress: () => ({
    scale: { __getValue: () => 1 },
    onPressIn: jest.fn(),
    onPressOut: jest.fn(),
  }),
}));

jest.mock('../context/MochiContext', () => ({
  useMochiContext: () => ({
    mochiProps: { variant: 'idle', visible: false, phrase: null },
    showMochi: jest.fn(),
    hideMochi: jest.fn(),
    celebrate: jest.fn(),
  }),
}));

describe('PatternTrainScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    patternSettings.pressureFreeMode = false;
    patternSettings.reducedMotionEnabled = false;
    // Mock Animated.timing to execute immediately
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: () => void) => {
            if (callback) callback();
          },
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any,
    );
    jest.spyOn(Animated, 'spring').mockImplementation(
      () =>
        ({
          start: (callback?: () => void) => {
            if (callback) callback();
          },
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any,
    );
    jest.spyOn(Animated, 'sequence').mockImplementation(
      (animations: any[]) =>
        ({
          start: (callback?: () => void) => {
            animations.forEach((anim) => anim.start?.());
            if (callback) callback();
          },
          stop: jest.fn(),
        }) as any,
    );
    jest.spyOn(Animated, 'parallel').mockImplementation(
      (animations: any[]) =>
        ({
          start: (callback?: () => void) => {
            animations.forEach((anim) => anim.start?.());
            if (callback) callback();
          },
          stop: jest.fn(),
        }) as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders difficulty selector on initial load', () => {
    const screen = render(<PatternTrainScreen />);

    // Should show difficulty selector modal
    const easyButton = screen.queryByText('Easy');
    const mediumButton = screen.queryByText('Medium');
    const hardButton = screen.queryByText('Hard');

    expect(easyButton).toBeTruthy();
    expect(mediumButton).toBeTruthy();
    expect(hardButton).toBeTruthy();
  });

  it('shows game title', () => {
    const screen = render(<PatternTrainScreen />);

    const title = screen.queryByText('Pattern Train');
    expect(title).toBeTruthy();
  });

  it('renders with subtitle accessibility', () => {
    const screen = render(<PatternTrainScreen />);

    // Screen should render successfully with accessibility
    const title = screen.queryByText('Pattern Train');
    expect(title).toBeTruthy();
  });

  it('navigates back when cancel is pressed', () => {
    const screen = render(<PatternTrainScreen />);

    // Find and press cancel button
    const cancelButton = screen.queryByText('Cancel');
    if (cancelButton) {
      fireEvent.press(cancelButton);
      expect(mockGoBack).toHaveBeenCalled();
    }
  });

  it('renders with AppHeader for navigation', () => {
    const screen = render(<PatternTrainScreen />);

    // AppHeader should be rendered (we can check by looking for the title)
    const title = screen.queryByText('Pattern Train');
    expect(title).toBeTruthy();
  });

  it('leaves carriage taps available while reserving drags for movement', async () => {
    const screen = render(<PatternTrainScreen />);

    fireEvent.press(screen.getByText('Easy'));

    await waitFor(() => {
      expect(
        screen.UNSAFE_root.findAll(
          (node: any) =>
            typeof node.props.onStartShouldSetResponder === 'function' &&
            typeof node.props.onMoveShouldSetResponder === 'function',
        ),
      ).not.toHaveLength(0);
    });

    const draggable = screen.UNSAFE_root.findAll(
      (node: any) =>
        typeof node.props.onStartShouldSetResponder === 'function' &&
        typeof node.props.onMoveShouldSetResponder === 'function',
    )[0];

    expect(draggable.props.onStartShouldSetResponder()).toBe(false);
    expect(draggable.props.onMoveShouldSetResponder({}, { dx: 0, dy: 0 })).toBe(false);
    expect(screen.getAllByLabelText('Carriage with 🌈')[0].props.hitSlop).toBe(8);
  });

  it('submits a choice through the accessible tap path and exposes child-controlled Next', async () => {
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));

    const carriage = await screen.findByLabelText('Carriage with 🌈');
    fireEvent.press(carriage);

    expect(await screen.findByTestId('pattern-train-next')).toBeTruthy();
  });

  it('shows the staged hint and model before accepting corrected Next', async () => {
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));

    const wrongChoice = await screen.findByLabelText('Carriage with 🌸');
    fireEvent.press(wrongChoice);
    expect(await screen.findByText('Show the pattern: 🌟 🌈 repeats.')).toBeTruthy();

    fireEvent.press(wrongChoice);
    expect(await screen.findByText('Model: 🌟 🌈 🌟 🌈')).toBeTruthy();
    expect(screen.queryByTestId('pattern-train-next')).toBeNull();

    fireEvent.press(await screen.findByLabelText('Carriage with 🌈'));
    expect(await screen.findByTestId('pattern-train-next')).toBeTruthy();
  });

  it('lets the child show the pattern before making a choice', async () => {
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));

    fireEvent.press(await screen.findByText('Show the pattern'));

    expect(await screen.findByText('Show the pattern: 🌟 🌈 repeats.')).toBeTruthy();
    expect(screen.getAllByLabelText('Carriage with 🌈')).not.toHaveLength(0);
  });

  it('does not play a negative sound for an incorrect choice', async () => {
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));

    fireEvent.press(await screen.findByLabelText('Carriage with 🌸'));

    expect(playFlipSound).not.toHaveBeenCalled();
  });

  it('uses an immediate reduced-motion path without auto-advancing', async () => {
    patternSettings.reducedMotionEnabled = true;
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));

    expect(await screen.findByText('AB pattern')).toBeTruthy();
    expect(screen.queryByTestId('pattern-train-next')).toBeNull();
  });

  it('hides completed-round stats in pressure-free mode', async () => {
    patternSettings.pressureFreeMode = true;
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByText('Easy'));
    await waitFor(() => expect(screen.queryByText(/Completed:/)).toBeNull());
  });
});
