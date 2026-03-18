import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BreathingGardenScreen } from './BreathingGardenScreen';
import {
  assertNoInfiniteLoops,
  createInfiniteLoopSpy,
} from '../test-utils/infiniteLoopDetection';

const mockGoBack = jest.fn();
const mockToggleMusic = jest.fn();
const mockStopMusic = jest.fn();

const mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  colorMode: 'system' as const,
};

const queuedAnimations: Array<{ toValue: number; run: () => void }> = [];

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
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const cleanup = callback();
    return cleanup;
  },
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../utils/music', () => ({
  useBackgroundMusic: () => ({
    isPlaying: false,
    toggleMusic: mockToggleMusic,
    stopMusic: mockStopMusic,
  }),
}));

jest.mock('../components/BreathingBall', () => ({
  BreathingBall: ({
    onPhaseChange,
    onCycleComplete,
    onProgress,
    colorScheme,
  }: {
    onPhaseChange?: (phase: 'inhale' | 'exhale') => void;
    onCycleComplete?: (count: number) => void;
    onProgress?: (progress: number) => void;
    colorScheme?: { name: string };
  }) => {
    const { Pressable, Text, View } = require('react-native');

    return (
      <View testID="breathing-ball">
        <Text>Color: {colorScheme?.name || 'Default'}</Text>
        <Pressable testID="phase-inhale" onPress={() => onPhaseChange?.('inhale')} />
        <Pressable testID="phase-exhale" onPress={() => onPhaseChange?.('exhale')} />
        <Pressable testID="progress-25" onPress={() => onProgress?.(0.25)} />
        <Pressable testID="progress-75" onPress={() => onProgress?.(0.75)} />
        <Pressable testID="cycle-3" onPress={() => onCycleComplete?.(3)} />
      </View>
    );
  },
}));

describe('BreathingGardenScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let animatedTimingSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.animationsEnabled = true;
    queuedAnimations.length = 0;
    consoleErrorSpy = createInfiniteLoopSpy();
    animatedTimingSpy = jest
      .spyOn(Animated, 'timing')
      .mockImplementation((value: Animated.Value | Animated.ValueXY, config: Animated.TimingAnimationConfig) => ({
        start: (callback?: Animated.EndCallback) => {
          queuedAnimations.push({
            toValue: typeof config.toValue === 'number' ? config.toValue : 0,
            run: () => callback?.({ finished: true }),
          });
          return value;
        },
        stop: jest.fn(),
        reset: jest.fn(),
        _startNativeLoop: jest.fn(),
        _isUsingNativeDriver: () => config.useNativeDriver ?? false,
      }) as unknown as Animated.CompositeAnimation);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    animatedTimingSpy.mockRestore();
  });

  it('renders without infinite loop errors across repeated renders', () => {
    const { rerender } = render(React.createElement(BreathingGardenScreen));

    for (let renderCount = 0; renderCount < 5; renderCount += 1) {
      rerender(React.createElement(BreathingGardenScreen));
    }

    assertNoInfiniteLoops(consoleErrorSpy);
  });

  it('ignores stale phase animations when the phase changes again before completion', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    expect(screen.getByText('Breathe in')).toBeTruthy();

    const beforePhaseChange = queuedAnimations.length;
    fireEvent.press(screen.getByTestId('phase-exhale'));
    const phaseFadeOut = queuedAnimations
      .slice(beforePhaseChange)
      .find((animation) => animation.toValue === 0);

    expect(phaseFadeOut).toBeTruthy();

    fireEvent.press(screen.getByTestId('phase-inhale'));

    act(() => {
      phaseFadeOut?.run();
    });

    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(screen.queryByText('Breathe out')).toBeNull();
  });

  it('updates the phase and count labels with animations enabled', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    fireEvent.press(screen.getByTestId('progress-75'));
    expect(screen.getByText('3')).toBeTruthy();

    fireEvent.press(screen.getByTestId('phase-exhale'));
    act(() => {
      queuedAnimations.find((animation) => animation.toValue === 0)?.run();
    });

    expect(screen.getByText('Breathe out')).toBeTruthy();
    expect(animatedTimingSpy).toHaveBeenCalled();
  });

  it('updates the phase and count labels immediately when animations are disabled', () => {
    mockSettings.animationsEnabled = false;

    const screen = render(React.createElement(BreathingGardenScreen));

    fireEvent.press(screen.getByTestId('progress-25'));
    fireEvent.press(screen.getByTestId('phase-exhale'));

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Breathe out')).toBeTruthy();
    expect(animatedTimingSpy).not.toHaveBeenCalled();
  });

  it('cycles colors, toggles music, updates breath count, and goes back', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    expect(screen.getByText('Color: Ocean')).toBeTruthy();
    fireEvent.press(screen.getByText('Change color'));
    expect(screen.getByText('Color: Rose')).toBeTruthy();

    fireEvent.press(screen.getByText('Music on'));
    expect(mockToggleMusic).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('cycle-3'));
    expect(screen.getByText(/Breaths/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('← Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
