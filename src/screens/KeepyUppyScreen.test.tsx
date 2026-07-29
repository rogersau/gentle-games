import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { KeepyUppyScreen } from './KeepyUppyScreen';
import {
  assertNoSetStateDuringRender,
  createSetStateDuringRenderSpy,
} from '../test-utils/setStateDetection';

const mockGoBack = jest.fn();
const mockUpdateGameSettings = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
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
}));

const keepySettings = { keepyUppyEasyMode: true, showMochiInGames: true, pressureFreeMode: false };
jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: keepySettings,
    updateGameSettings: mockUpdateGameSettings,
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

describe('KeepyUppyScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    consoleErrorSpy = createSetStateDuringRenderSpy();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it('renders without setState during render errors', () => {
    render(<KeepyUppyScreen />);
    assertNoSetStateDuringRender(consoleErrorSpy);
  });

  it('goes back when back button is pressed', () => {
    const screen = render(<KeepyUppyScreen />);
    fireEvent.press(screen.getByText('← Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('selects the advanced three-balloon profile without showing pressure totals', () => {
    const screen = render(<KeepyUppyScreen />);
    fireEvent.press(screen.getByRole('radio', { name: 'more balloons' }));

    expect(mockUpdateGameSettings).toHaveBeenCalledWith('keepy-uppy', {
      profile: 'more-balloons',
      balloonSize: 29,
      gravity: 220,
      targetSize: 1.8,
      balloonCount: 3,
    });
    expect(screen.queryByText('Taps: 0')).toBeNull();
    expect(screen.queryByText('Balloons: 1')).toBeNull();
    expect(screen.queryByText('Popped: 0')).toBeNull();
  });

  it('handles multiple renders without setState during render errors', () => {
    const { rerender } = render(<KeepyUppyScreen />);

    // Re-render multiple times to stress test for setState during render issues
    for (let i = 0; i < 5; i++) {
      rerender(<KeepyUppyScreen />);
    }

    assertNoSetStateDuringRender(consoleErrorSpy);
  });

  it('hides score, balloon, and popped counters by default', () => {
    const settingsModule = jest.requireMock('../context/SettingsContext') as {
      useSettings: () => { settings: { pressureFreeMode: boolean } };
    };
    settingsModule.useSettings().settings.pressureFreeMode = false;
    const screen = render(<KeepyUppyScreen />);
    expect(screen.queryByText('Taps: 0')).toBeNull();
    expect(screen.queryByText('Balloons: 1')).toBeNull();
    expect(screen.queryByText('Popped: 0')).toBeNull();
  });

  it('offers a focusable non-failure restart control', () => {
    const screen = render(<KeepyUppyScreen />);
    const restart = screen.getByRole('button', { name: 'Start again' });

    fireEvent.press(restart);

    expect(restart).toBeTruthy();
  });
});
