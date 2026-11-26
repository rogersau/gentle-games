import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  View,
} from 'react-native';
import { PatternTrainScreen } from '../screens/PatternTrainScreen';
import { playFlipSound, playMatchSound } from '../utils/sounds';

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
        'common.playAgain': 'Play again',
        'common.home': 'Home',
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
        'games.patternTrain.instructions':
          'Tap a carriage or drag it onto the train to fill the gap.',
        'games.patternTrain.train.accessibilityLabel': 'Train carriages in order. {{sequence}}.',
        'games.patternTrain.roundsAccessibilityLabel': '{{count}} rounds completed',
        'games.patternTrain.guidance.instruction':
          'Choose the carriage that continues the pattern.',
        'games.patternTrain.guidance.showPattern': 'Show the pattern: {{unit}} repeats.',
        'games.patternTrain.guidance.showPatternButton': 'Show the pattern',
        'games.patternTrain.guidance.replay': 'Show instructions',
        'games.patternTrain.guidance.hideInstructions': 'Hide instructions',
        'games.patternTrain.guidance.skip': 'Skip',
        'games.patternTrain.guidance.matchCue':
          'Tap the {{picture}} to match the picture in the gap.',
        'games.patternTrain.guidance.modelAccessibilityLabel': 'Complete pattern: {{sequence}}.',
        'games.patternTrain.repeatUnit': 'Repeat {{unit}} for the {{rule}}.',
        'games.patternTrain.repeatUnitAccessibilityLabel': 'Repeat {{unit}}. Rule {{rule}}.',
        'games.patternTrain.rules.ab': 'AB pattern',
        'games.patternTrain.missingCarriage': 'missing carriage',
        'games.patternTrain.feedback.correct': 'Correct.',
        'games.patternTrain.feedback.incorrect': 'Try again.',
        'games.patternTrain.carriage.accessibilityLabel': 'Carriage with {{picture}}',
        'games.patternTrain.pictures.star': 'star',
        'games.patternTrain.pictures.rainbow': 'rainbow',
        'games.patternTrain.pictures.flower': 'flower',
        'games.patternTrain.milestone.rounds': "You've completed {{count}} trains",
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
  generateTransferPattern: jest.fn((pattern) => ({ ...pattern })),
  isTrainChoiceCorrect: jest.fn((pattern, choice) => pattern.answer === choice),
}));

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
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
  osReducedMotion: false,
  movement: 'gentle',
  autoAdvance: true,
  difficulty: 'easy' as const,
};

const dragGesture = (dx: number, dy: number) =>
  ({ dx, dy, numberActiveTouches: 1 }) as PanResponderGestureState;

const touchEvent = (pageX: number, pageY: number) =>
  ({ nativeEvent: { pageX, pageY } }) as GestureResponderEvent;
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
  useAnimationEnabled: () =>
    patternSettings.movement === 'lively' && !patternSettings.osReducedMotion,
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
    patternSettings.osReducedMotion = false;
    patternSettings.movement = 'gentle';
    patternSettings.autoAdvance = true;
    // Mock Animated.timing to execute immediately
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) => {
            callback?.({ finished: true });
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
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens with a playable pattern and keeps level choices optional', () => {
    const screen = render(<PatternTrainScreen />);
    expect(screen.queryByText('Easy')).toBeNull();
    expect(screen.getByRole('button', { name: 'Carriage with rainbow' })).toBeTruthy();
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('pattern-train-level'));
    expect(screen.getByText('Easy')).toBeTruthy();
    expect(screen.getByText('Medium')).toBeTruthy();
    expect(screen.getByText('Hard')).toBeTruthy();
    fireEvent.press(screen.getByText('Medium'));
    expect(screen.queryByText('Medium')).toBeNull();
  });

  it('shows game title', () => {
    const screen = render(<PatternTrainScreen />);

    const title = screen.queryAllByText('Pattern Train')[0];
    expect(title).toBeTruthy();
  });

  it('renders with subtitle accessibility', () => {
    const screen = render(<PatternTrainScreen />);

    // Screen should render successfully with accessibility
    const title = screen.queryAllByText('Pattern Train')[0];
    expect(title).toBeTruthy();
  });

  it('returns to the same pattern when level selection is cancelled', () => {
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('pattern-train-level'));
    fireEvent.press(screen.getAllByText('common.close').at(-1)!);
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(screen.queryByText('Easy')).toBeNull();
    expect(screen.getByLabelText('Carriage with rainbow')).toBeTruthy();
  });

  it('renders with AppHeader for navigation', () => {
    const screen = render(<PatternTrainScreen />);

    // AppHeader should be rendered (we can check by looking for the title)
    const title = screen.queryAllByText('Pattern Train')[0];
    expect(title).toBeTruthy();
  });

  it('leaves carriage taps available while reserving drags for deliberate movement', () => {
    const responders = jest.spyOn(PanResponder, 'create');
    const screen = render(<PatternTrainScreen />);
    const [drag] = responders.mock.calls[0];

    expect(drag.onStartShouldSetPanResponderCapture?.(touchEvent(1, 1), dragGesture(0, 0))).toBe(
      false,
    );
    expect(drag.onMoveShouldSetPanResponder?.(touchEvent(1, 1), dragGesture(0, -5))).toBe(false);
    expect(drag.onMoveShouldSetPanResponder?.(touchEvent(1, 1), dragGesture(0, -12))).toBe(true);
    expect(screen.getByRole('button', { name: 'Carriage with rainbow' })).toBeEnabled();
  });

  it('measures the train at release and accepts a drop after the screen scrolls', () => {
    const responders = jest.spyOn(PanResponder, 'create');
    let zoneTop = 220;
    const screen = render(<PatternTrainScreen />);
    const zone = screen
      .UNSAFE_getAllByType(View)
      .find(({ props }) => props.testID === 'pattern-train-zone');
    const measure = jest.spyOn(zone?.instance as View, 'measure').mockImplementation((callback) => {
      callback(0, 0, 220, 64, 20, zoneTop);
    });
    const [drag] = responders.mock.calls[0];
    const release = touchEvent(100, 135);
    const movement = dragGesture(0, -110);

    act(() => drag.onPanResponderGrant?.(touchEvent(100, 245), movement));
    act(() => drag.onPanResponderRelease?.(release, movement));
    fireEvent.press(screen.getByLabelText('Carriage with rainbow'), { nativeEvent: { detail: 1 } });
    expect(screen.queryByText('Correct.')).toBeNull();
    expect(screen.queryByText('Try again.')).toBeNull();

    zoneTop = 110;
    act(() => drag.onPanResponderGrant?.(touchEvent(100, 245), movement));
    act(() => drag.onPanResponderRelease?.(release, movement));
    expect(measure).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Correct.')).toBeTruthy();
    expect(playMatchSound).toHaveBeenCalledTimes(1);
  });

  it('returns a cancelled drag home without submitting a choice', () => {
    const responders = jest.spyOn(PanResponder, 'create');
    const setPosition = jest.spyOn(Animated.ValueXY.prototype, 'setValue');
    const screen = render(<PatternTrainScreen />);
    const [drag] = responders.mock.calls[0];
    const movement = dragGesture(15, -35);
    const event = touchEvent(100, 135);

    act(() => drag.onPanResponderGrant?.(event, movement));
    act(() => drag.onPanResponderMove?.(event, movement));
    expect(setPosition).toHaveBeenLastCalledWith({ x: 15, y: -35 });
    act(() => drag.onPanResponderTerminate?.(event, movement));
    expect(setPosition).toHaveBeenLastCalledWith({ x: 0, y: 0 });
    expect(screen.queryByText('Correct.')).toBeNull();
    expect(playMatchSound).not.toHaveBeenCalled();
  });

  it('keeps the missing carriage label from overflowing across the train', async () => {
    const screen = render(<PatternTrainScreen />);

    await waitFor(() => expect(screen.queryByText('missing carriage')).toBeNull());

    const carriageMock = jest.requireMock('../components/train').Carriage as jest.Mock;
    expect(
      carriageMock.mock.calls.some(([props]) => props.content === '?' && props.isMissing === true),
    ).toBe(true);
  });

  it('automatically advances to the next train after a gentle pause by default', () => {
    jest.useFakeTimers();
    const screen = render(<PatternTrainScreen />);

    expect(
      screen.getByRole('image', {
        name: 'Train carriages in order. star, missing carriage, star, rainbow.',
      }),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Carriage with rainbow' }));

    expect(screen.getByText('Correct.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull();
    expect(
      screen.getByRole('image', {
        name: 'Train carriages in order. star, rainbow, star, rainbow.',
      }),
    ).toBeTruthy();
    act(() => jest.advanceTimersByTime(1600));
    expect(screen.getByRole('button', { name: 'Carriage with rainbow' })).toBeEnabled();
    expect(screen.queryByText('Correct.')).toBeNull();
  });

  it('fills the gap and waits for Play again when automatic next round is off', () => {
    jest.useFakeTimers();
    patternSettings.autoAdvance = false;
    const screen = render(<PatternTrainScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Carriage with rainbow' }));
    expect(screen.getByText('Correct.')).toBeTruthy();
    act(() => jest.advanceTimersByTime(2400));
    expect(screen.getByText('Correct.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('button', { name: 'Carriage with rainbow' })).toBeEnabled();
    expect(screen.queryByText('Correct.')).toBeNull();
  });

  it('shows the staged hint and model before accepting the correct choice', async () => {
    const screen = render(<PatternTrainScreen />);

    const wrongChoice = await screen.findByLabelText('Carriage with flower');
    fireEvent.press(wrongChoice);
    expect(await screen.findByText('Show the pattern: star, rainbow repeats.')).toBeTruthy();

    fireEvent.press(wrongChoice);
    expect(
      await screen.findByText('Tap the rainbow to match the picture in the gap.'),
    ).toBeTruthy();
    const carriage = jest.requireMock('../components/train').Carriage as jest.Mock;
    expect(carriage.mock.calls.some(([props]) => props.isMissing && props.content === '🌈')).toBe(
      true,
    );
    expect(screen.queryByText('Correct.')).toBeNull();

    fireEvent.press(await screen.findByLabelText('Carriage with rainbow'));
    expect(screen.getByText('Correct.')).toBeTruthy();
  });

  it('lets the child show the pattern before making a choice', async () => {
    const screen = render(<PatternTrainScreen />);

    fireEvent.press(await screen.findByText('Show the pattern'));

    expect(await screen.findByText('Show the pattern: star, rainbow repeats.')).toBeTruthy();
    expect(screen.getByLabelText('Carriage with rainbow')).toBeEnabled();
  });

  it('lets the child show and hide the play instructions', () => {
    const screen = render(<PatternTrainScreen />);
    const instructions = 'Tap a carriage or drag it onto the train to fill the gap.';

    expect(screen.queryByText(instructions)).toBeNull();
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByRole('button', { name: 'Show instructions' }));
    expect(screen.getByText(instructions)).toBeTruthy();
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByRole('button', { name: 'Hide instructions' }));
    expect(screen.queryByText(instructions)).toBeNull();
  });

  it.each([false, true])(
    'advances at milestones with pressure-free mode set to %s',
    (pressureFreeMode) => {
      jest.useFakeTimers();
      patternSettings.pressureFreeMode = pressureFreeMode;
      patternSettings.autoAdvance = false;
      const screen = render(<PatternTrainScreen />);

      for (let round = 0; round < 5; round += 1) {
        fireEvent.press(screen.getByRole('button', { name: 'Carriage with rainbow' }));
        if (round < 4) fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
      }

      expect(screen.queryByText("You've completed 5 trains") !== null).toBe(!pressureFreeMode);
      expect(screen.queryByRole('button', { name: 'Carriage with rainbow' })).toBeNull();
      fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
      expect(screen.getByRole('button', { name: 'Carriage with rainbow' })).toBeEnabled();
    },
  );

  it('does not play a negative sound for an incorrect choice', async () => {
    const screen = render(<PatternTrainScreen />);

    fireEvent.press(await screen.findByLabelText('Carriage with flower'));

    expect(screen.getByTestId('pattern-train-retry-cue')).toBeTruthy();
    expect(playFlipSound).not.toHaveBeenCalled();
  });

  it.each([false, true])('respects reduced motion set to %s during departure', (reducedMotion) => {
    jest.useFakeTimers();
    patternSettings.movement = 'lively';
    patternSettings.osReducedMotion = reducedMotion;
    patternSettings.autoAdvance = false;
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Carriage with rainbow' }));
    expect(Animated.timing).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1200));
    if (reducedMotion) {
      expect(Animated.timing).not.toHaveBeenCalled();
    } else {
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({ toValue: 1, duration: 750 }),
      );
    }
    expect(screen.getByRole('button', { name: 'Play again' })).toBeEnabled();
  });

  it('holds departure while the level picker is open', () => {
    jest.useFakeTimers();
    const screen = render(<PatternTrainScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Carriage with rainbow' }));
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('pattern-train-level'));

    const { generateTransferPattern } = jest.requireMock('../utils/patternTrainLogic');
    act(() => jest.advanceTimersByTime(2400));
    expect(generateTransferPattern).not.toHaveBeenCalled();
    fireEvent.press(screen.getAllByText('common.close').at(-1)!);
    act(() => jest.advanceTimersByTime(1600));
    expect(generateTransferPattern).toHaveBeenCalledTimes(1);
  });

  it('hides completed-round stats in pressure-free mode', async () => {
    patternSettings.pressureFreeMode = true;
    const screen = render(<PatternTrainScreen />);
    await waitFor(() => expect(screen.queryByText(/Completed:/)).toBeNull());
  });
});
