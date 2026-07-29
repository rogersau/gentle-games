import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BreathingGardenScreen } from './BreathingGardenScreen';

const mockGoBack = jest.fn();
const mockToggleMusic = jest.fn();
const mockStopMusic = jest.fn();
const mockUpdateSettings = jest.fn();
const mockUpdateGameSettings = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockReset = jest.fn();
let mockIsPlaying = false;
let mockMotionEnabled = true;
let appStateHandler: ((state: string) => void) | undefined;

const mockSettings: any = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium',
  theme: 'mixed',
  showCardPreview: true,
  colorMode: 'system',
  pressureFreeMode: true,
  showMochiInGames: false,
  gameSettings: {
    'breathing-garden': { sessionLength: 'open-ended', visualCue: true },
  },
};

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      accent: '#D4A9E6',
    },
  }),
}));

jest.mock('../ui/animations', () => ({
  ...jest.requireActual('../ui/animations'),
  useAnimationEnabled: () => mockMotionEnabled,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require('react');
    useEffect(callback, [callback]);
  },
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
    updateGameSettings: mockUpdateGameSettings,
  }),
}));

jest.mock('../utils/music', () => ({
  useBackgroundMusic: () => ({
    isPlaying: mockIsPlaying,
    toggleMusic: mockToggleMusic,
    stopMusic: mockStopMusic,
  }),
}));

jest.mock('../components/BreathingBall', () => {
  const ReactModule = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    BreathingBall: ReactModule.forwardRef(
      (
        {
          onPhaseChange,
          onCycleComplete,
          onProgress,
          reducedMotion,
          autoStart,
        }: {
          onPhaseChange?: (phase: 'inhale' | 'exhale') => void;
          onCycleComplete?: (count: number) => void;
          onProgress?: (progress: number) => void;
          reducedMotion?: boolean;
          autoStart?: boolean;
        },
        ref: React.Ref<unknown>,
      ) => {
        ReactModule.useImperativeHandle(ref, () => ({
          pause: mockPause,
          resume: mockResume,
          reset: mockReset,
          getPhase: () => 'inhale',
          getCycleCount: () => 0,
          getElapsedMs: () => 0,
        }));
        return (
          <View
            testID='breathing-ball'
            accessibilityLabel={`motion-${String(!reducedMotion)}-auto-${String(autoStart)}`}
          >
            <Text>Breathing visual</Text>
            <Pressable testID='phase-exhale' onPress={() => onPhaseChange?.('exhale')} />
            <Pressable testID='progress-75' onPress={() => onProgress?.(0.75)} />
            <Pressable testID='cycle-complete' onPress={() => onCycleComplete?.(1)} />
          </View>
        );
      },
    ),
  };
});

describe('BreathingGardenScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPlaying = false;
    mockMotionEnabled = true;
    mockSettings.soundEnabled = true;
    mockSettings.gameSettings['breathing-garden'] = {
      sessionLength: 'open-ended',
      visualCue: true,
    };
    appStateHandler = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler: any) => {
      if (event === 'change') appStateHandler = handler;
      return { remove: jest.fn() } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens without starting a paced cycle and offers every autonomy choice', () => {
    const screen = render(<BreathingGardenScreen />);

    expect(screen.queryByTestId('breathing-ball')).toBeNull();
    expect(screen.getByTestId('breathing-start')).toBeTruthy();
    expect(screen.getByTestId('breathing-watch-first')).toBeTruthy();
    expect(screen.getByTestId('breathing-normal')).toBeTruthy();
    expect(screen.getByTestId('breathing-exit')).toBeTruthy();
  });

  it('starts, pauses, resumes, and stops only through explicit controls', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));
    expect(screen.getByTestId('breathing-ball')).toBeTruthy();

    fireEvent.press(screen.getByTestId('breathing-pause'));
    expect(mockPause).toHaveBeenCalled();
    expect(screen.getByTestId('breathing-resume')).toBeTruthy();

    fireEvent.press(screen.getByTestId('breathing-resume'));
    expect(mockResume).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('breathing-stop'));
    expect(screen.getByTestId('breathing-complete')).toBeTruthy();
  });

  it('demonstrates one watch-first cycle without adding session progress', () => {
    mockSettings.gameSettings['breathing-garden'].sessionLength = 3;
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-watch-first'));

    expect(screen.queryByTestId('breathing-session-dot-0')).toBeNull();
    fireEvent.press(screen.getByTestId('cycle-complete'));
    expect(screen.getByTestId('breathing-start')).toBeTruthy();
  });

  it.each([3, 5, 10] as const)('finishes a %i-breath session on the exact cycle', (length) => {
    mockSettings.gameSettings['breathing-garden'].sessionLength = length;
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    for (let count = 0; count < length - 1; count += 1) {
      fireEvent.press(screen.getByTestId('cycle-complete'));
      expect(screen.queryByTestId('breathing-complete')).toBeNull();
    }
    fireEvent.press(screen.getByTestId('cycle-complete'));
    expect(screen.getByTestId('breathing-complete')).toBeTruthy();
  });

  it('keeps an open-ended session child-controlled', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));
    for (let count = 0; count < 12; count += 1) {
      fireEvent.press(screen.getByTestId('cycle-complete'));
    }
    expect(screen.queryByTestId('breathing-complete')).toBeNull();
    expect(screen.getByTestId('breathing-stop')).toBeTruthy();
  });

  it('offers an unpaced breathe-normally state with persistent controls', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-normal'));

    expect(screen.getByTestId('breathing-normal-state')).toBeTruthy();
    expect(screen.queryByTestId('breathing-ball')).toBeNull();
    expect(screen.getByTestId('breathing-stop')).toBeTruthy();
    expect(screen.getByTestId('breathing-sound')).toBeTruthy();
    expect(screen.getByTestId('breathing-music')).toBeTruthy();
    expect(screen.getByTestId('breathing-visual-cue')).toBeTruthy();
  });

  it('uses a static visual with progress dots when reduced motion is active', () => {
    mockMotionEnabled = false;
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    expect(screen.getByTestId('breathing-ball').props.accessibilityLabel).toContain('motion-false');
    expect(screen.getByTestId('breathing-static-progress')).toBeTruthy();
  });

  it('persists sound, visual cue, and session choices while respecting global sound', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(
      screen.getAllByRole('radio', { name: /games.breathingGarden.session.breaths/ })[0],
    );
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('breathing-garden', {
      sessionLength: 3,
    });

    fireEvent.press(screen.getByTestId('breathing-normal'));
    fireEvent.press(screen.getByTestId('breathing-sound'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
    fireEvent.press(screen.getByTestId('breathing-visual-cue'));
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('breathing-garden', {
      visualCue: false,
    });
    fireEvent.press(screen.getByTestId('breathing-music'));
    expect(mockToggleMusic).toHaveBeenCalled();
  });

  it('pauses and stops audio on backgrounding, exit, and teardown', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    act(() => appStateHandler?.('background'));
    expect(mockPause).toHaveBeenCalled();
    expect(mockStopMusic).toHaveBeenCalled();
    expect(screen.getByTestId('breathing-resume')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('← Back'));
    expect(mockGoBack).toHaveBeenCalled();
    screen.unmount();
    expect(mockStopMusic).toHaveBeenCalled();
  });
});
