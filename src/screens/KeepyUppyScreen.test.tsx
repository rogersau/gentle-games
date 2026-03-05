import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import { KeepyUppyScreen } from './KeepyUppyScreen';
import {
  assertNoSetStateDuringRender,
  createSetStateDuringRenderSpy,
} from '../test-utils/setStateDetection';

const mockGoBack = jest.fn();

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

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      keepyUppyEasyMode: true,
    },
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

  it('adds balloons up to a max of three', async () => {
    const screen = render(<KeepyUppyScreen />);
    const addButton = screen.getByText('+ Balloon');

    expect(screen.getByText('Balloons: 1')).toBeTruthy();

    await act(async () => {
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Balloons: 2')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Balloons: 3')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Balloons: 3')).toBeTruthy();
    });

    // Press button again - should stay at 3 balloons
    await act(async () => {
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Balloons: 3')).toBeTruthy();
    });
  });

  it('handles multiple renders without setState during render errors', () => {
    const { rerender } = render(<KeepyUppyScreen />);

    // Re-render multiple times to stress test for setState during render issues
    for (let i = 0; i < 5; i++) {
      rerender(<KeepyUppyScreen />);
    }

    assertNoSetStateDuringRender(consoleErrorSpy);
  });
});
