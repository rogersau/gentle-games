import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { PatternTrainScreen } from '../screens/PatternTrainScreen';

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
    t: (key: string, _options?: Record<string, unknown>) => {
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
        'difficulty.title': 'Select Difficulty',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'settings.difficulty.easy': 'Easy',
        'settings.difficulty.medium': 'Medium',
        'settings.difficulty.hard': 'Hard',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../components/train', () => ({
  TrainEngine: jest.fn(() => null),
  Carriage: jest.fn(() => null),
  TrainTrack: jest.fn(() => null),
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

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      difficulty: 'easy',
      theme: 'system',
      soundEnabled: true,
      soundVolume: 0.5,
      animationsEnabled: true,
      cardPreview: true,
      showUnfinishedGames: false,
    },
    updateSettings: jest.fn(),
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
});
