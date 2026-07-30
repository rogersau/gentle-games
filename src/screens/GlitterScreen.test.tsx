import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { GlitterScreen } from './GlitterScreen';
import { GLITTER_PRESETS } from '../games/glitterSettings';

const mockGoBack = jest.fn();
const mockAddGlitter = jest.fn();
const mockSwirl = jest.fn();
const mockSettle = jest.fn();
const mockPlayBubblePopSound = jest.fn();
const mockUpdateGameSettings = jest.fn().mockResolvedValue(undefined);
let mockSettings: any;

jest.mock('../utils/sounds', () => ({
  playBubblePopSound: (...args: unknown[]) => mockPlayBubblePopSound(...args),
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
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
  useReducedMotion: () => false,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateGameSettings: mockUpdateGameSettings,
  }),
}));

jest.mock('../components/GlitterGlobe', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const GlitterGlobe = React.forwardRef((_props: unknown, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      addGlitter: (count?: number) => mockAddGlitter(count),
      clearGlitter: jest.fn(),
      swirl: () => mockSwirl(),
      settle: () => mockSettle(),
    }));
    return (
      <View>
        <Text>Mock Globe</Text>
      </View>
    );
  });

  return { GlitterGlobe };
});

describe('GlitterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSettings = {
      settingsVersion: 2,
      animationsEnabled: false,
      reducedMotionEnabled: false,
      showMochiInGames: true,
      soundEnabled: true,
      soundVolume: 0.5,
      gameSettings: { 'glitter-fall': GLITTER_PRESETS.settle },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('goes back when back button is pressed', () => {
    const screen = render(<GlitterScreen />);
    fireEvent.press(screen.getByText('← Back'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('offers explicit add, swirl, and settle controls', () => {
    const screen = render(<GlitterScreen />);

    fireEvent.press(screen.getByTestId('glitter-add-few-button'));
    fireEvent.press(screen.getByTestId('glitter-swirl-button'));
    fireEvent.press(screen.getByTestId('glitter-settle-button'));

    expect(mockAddGlitter).toHaveBeenCalledWith(6);
    expect(mockSwirl).toHaveBeenCalledTimes(1);
    expect(mockSettle).toHaveBeenCalledTimes(1);
    expect(mockPlayBubblePopSound).not.toHaveBeenCalled();
  });

  it('persists a deterministic preset selection', () => {
    const screen = render(<GlitterScreen />);

    fireEvent.press(screen.getByTestId('glitter-preset-explore'));

    expect(mockUpdateGameSettings).toHaveBeenCalledWith('glitter-fall', {
      preset: 'explore',
      particleDensity: 'medium',
      fallSpeed: 'slow',
      colorCount: 3,
      ripples: true,
      shakeResponse: false,
      backgroundMotion: true,
      sound: false,
    });
  });

  it('plays optional Glitter sound when the game setting enables it', () => {
    mockSettings.gameSettings['glitter-fall'] = GLITTER_PRESETS.full;
    const screen = render(<GlitterScreen />);

    fireEvent.press(screen.getByTestId('glitter-add-few-button'));

    expect(mockPlayBubblePopSound).toHaveBeenCalledWith(mockSettings);
  });

  it('exposes presets as selectable radio controls', () => {
    const screen = render(<GlitterScreen />);

    const settle = screen.getByRole('radio', { name: 'games.glitterFall.preset.settle' });
    expect(settle.props.accessibilityState.checked).toBe(true);
  });

  it('does not prompt after a long period without interaction', () => {
    const screen = render(<GlitterScreen />);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(screen.queryByText(/mascot|Mochi|check in/i)).toBeNull();
  });
});
