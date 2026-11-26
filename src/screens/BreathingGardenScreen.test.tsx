import React from 'react';
import { AppState, AppStateStatus, ScrollView } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { BreathingGardenScreen } from './BreathingGardenScreen';
import {
  BREATHING_CYCLE_DURATION_MS,
  BREATHING_PHASE_DURATION_MS,
} from '../utils/breathingGardenLogic';

const mockGoBack = jest.fn();
const mockToggleMusic = jest.fn();
const mockStopMusic = jest.fn();
const mockUpdateSettings = jest.fn();
const mockUpdateGameSettings = jest.fn();
let appStateHandlers: ((state: AppStateStatus) => void)[] = [];

const mockSettings: any = {
  movement: 'lively' as 'lively' | 'gentle' | 'still',
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
  useReducedMotion: () => true,
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
  useAnimationEnabled: () => false,
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
    isPlaying: false,
    toggleMusic: mockToggleMusic,
    stopMusic: mockStopMusic,
  }),
}));

const advance = (duration: number) => act(() => jest.advanceTimersByTime(duration));

describe('BreathingGardenScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSettings.soundEnabled = true;
    mockSettings.gameSettings['breathing-garden'] = {
      sessionLength: 'open-ended',
      visualCue: true,
    };
    appStateHandlers = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'change') appStateHandlers.push(handler);
      return {
        remove: () => {
          appStateHandlers = appStateHandlers.filter((listener) => listener !== handler);
        },
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('opens without starting a paced cycle and offers every autonomy choice', () => {
    const screen = render(<BreathingGardenScreen />);

    expect(screen.queryByTestId('breathing-ball')).toBeNull();
    expect(screen.getByTestId('breathing-start')).toBeTruthy();
    expect(screen.queryByTestId('breathing-watch-first')).toBeNull();
    fireEvent.press(screen.getByTestId('game-more'));
    expect(screen.getByTestId('breathing-watch-first')).toBeTruthy();
    expect(screen.getByTestId('breathing-normal')).toBeTruthy();
    expect(screen.queryByTestId('breathing-exit')).toBeNull();
    expect(screen.getByRole('switch', { name: 'games.breathingGarden.visualLabel' })).toBeChecked();
  });

  it('keeps pause and stop outside scrolling content and pauses music with the session', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));
    const scrollContent = within(screen.UNSAFE_getByType(ScrollView));
    expect(screen.getByText('Breathe in')).toBeTruthy();
    expect(scrollContent.queryByTestId('breathing-pause')).toBeNull();
    expect(scrollContent.queryByTestId('breathing-stop')).toBeNull();

    fireEvent.press(screen.getByTestId('breathing-pause'));
    expect(mockStopMusic).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('breathing-resume')).toBeTruthy();
    expect(screen.getByText('games.breathingGarden.paused')).toBeTruthy();
    expect(screen.queryByText('Breathe in')).toBeNull();

    fireEvent.press(screen.getByTestId('breathing-resume'));
    expect(screen.getByText('Breathe in')).toBeTruthy();
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-stop'));
    expect(screen.getByTestId('breathing-complete')).toBeTruthy();
  });

  it('resumes Watch first in the same breath and returns to the choices after one cycle', () => {
    mockSettings.gameSettings['breathing-garden'].sessionLength = 3;
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-watch-first'));
    advance(BREATHING_PHASE_DURATION_MS);
    expect(screen.getByText('Breathe out')).toBeTruthy();

    fireEvent.press(screen.getByTestId('breathing-pause'));
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('games.breathingGarden.watching')).toBeTruthy();
    advance(BREATHING_CYCLE_DURATION_MS);
    expect(screen.queryByTestId('breathing-start')).toBeNull();

    fireEvent.press(screen.getByTestId('breathing-resume'));
    expect(screen.getByText('Breathe out')).toBeTruthy();
    advance(BREATHING_PHASE_DURATION_MS - 250);
    expect(screen.queryByTestId('breathing-start')).toBeNull();
    advance(250);
    expect(screen.getByTestId('breathing-start')).toBeTruthy();
    expect(mockStopMusic).toHaveBeenCalledTimes(2);

    fireEvent.press(screen.getByTestId('breathing-start'));
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 3, now: 0 });
  });

  it('lets the child leave a paused preview and return to their choices', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-watch-first'));
    fireEvent.press(screen.getByTestId('breathing-pause'));
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-stop'));

    expect(screen.getByTestId('breathing-start')).toBeTruthy();
    expect(screen.queryByTestId('breathing-complete')).toBeNull();
  });

  it.each([3, 5, 10] as const)('finishes a %i-breath session on the exact cycle', (length) => {
    mockSettings.gameSettings['breathing-garden'].sessionLength = length;
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    advance((length - 1) * BREATHING_CYCLE_DURATION_MS);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
      min: 0,
      max: length,
      now: length - 1,
    });
    advance(BREATHING_CYCLE_DURATION_MS - 250);
    expect(screen.queryByTestId('breathing-complete')).toBeNull();
    advance(250);
    expect(screen.getByTestId('breathing-complete')).toBeTruthy();
  });

  it('keeps an open-ended session child-controlled', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));
    advance(12 * BREATHING_CYCLE_DURATION_MS);
    expect(screen.queryByTestId('breathing-complete')).toBeNull();
    fireEvent.press(screen.getByTestId('game-more'));
    expect(screen.getByTestId('breathing-stop')).toBeTruthy();
  });

  it('offers an unpaced breathe-normally state with persistent controls', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-normal'));

    expect(screen.getByTestId('breathing-normal-state')).toBeTruthy();
    expect(screen.queryByTestId('breathing-ball')).toBeNull();
    expect(screen.getByTestId('breathing-stop')).toBeTruthy();
    expect(screen.getByTestId('game-sound')).toBeTruthy();
    fireEvent.press(screen.getByTestId('game-more'));
    expect(screen.getByTestId('breathing-music')).toBeTruthy();
    expect(screen.queryByTestId('breathing-pause')).toBeNull();
    advance(12 * BREATHING_CYCLE_DURATION_MS);
    expect(screen.queryByTestId('breathing-complete')).toBeNull();
  });

  it('uses a static visual with progress dots when reduced motion is active', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    expect(screen.getByTestId('breathing-ball', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('breathing-static-progress')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('can hide the ball before starting and still follow the phase words', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-visual-cue'));
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('breathing-garden', { visualCue: false });
    mockSettings.gameSettings['breathing-garden'].visualCue = false;
    screen.rerender(<BreathingGardenScreen />);
    expect(screen.getByTestId('breathing-visual-cue')).not.toBeChecked();
    fireEvent.press(screen.getByText('Close'));

    fireEvent.press(screen.getByTestId('breathing-start'));
    expect(screen.queryByTestId('breathing-ball', { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByTestId('breathing-static-progress')).toBeNull();
    expect(screen.getByText('Breathe in')).toBeTruthy();
    advance(BREATHING_PHASE_DURATION_MS);
    expect(screen.getByText('Breathe out')).toBeTruthy();
  });

  it('persists sound, visual cue, and session choices while respecting global sound', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-session-length'));
    fireEvent.press(
      screen.getAllByRole('radio', { name: /games.breathingGarden.session.breaths/ })[0],
    );
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('breathing-garden', {
      sessionLength: 3,
    });

    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-normal'));
    fireEvent.press(screen.getByTestId('game-sound'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
    fireEvent.press(screen.getByTestId('game-more'));
    fireEvent.press(screen.getByTestId('breathing-music'));
    expect(mockToggleMusic).toHaveBeenCalled();
    mockSettings.soundEnabled = false;
    screen.rerender(<BreathingGardenScreen />);
    expect(screen.getByTestId('breathing-music')).toBeDisabled();
  });

  it('pauses and stops audio on backgrounding, exit, and teardown', () => {
    const screen = render(<BreathingGardenScreen />);
    fireEvent.press(screen.getByTestId('breathing-start'));

    act(() => appStateHandlers.forEach((handler) => handler('background')));
    expect(mockStopMusic).toHaveBeenCalled();
    expect(screen.getByTestId('breathing-resume')).toBeTruthy();
    act(() => appStateHandlers.forEach((handler) => handler('active')));
    advance(BREATHING_CYCLE_DURATION_MS);
    expect(screen.getByTestId('breathing-resume')).toBeTruthy();
    expect(screen.queryByText('Breathe in')).toBeNull();

    mockStopMusic.mockClear();
    fireEvent.press(screen.getByTestId('game-home'));
    expect(mockGoBack).toHaveBeenCalled();
    expect(mockStopMusic).toHaveBeenCalled();
    mockStopMusic.mockClear();
    screen.unmount();
    expect(mockStopMusic).toHaveBeenCalled();
  });
});
