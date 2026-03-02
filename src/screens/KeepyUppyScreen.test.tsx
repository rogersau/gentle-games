import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import { KeepyUppyScreen } from './KeepyUppyScreen';

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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('goes back when back button is pressed', () => {
    const screen = render(<KeepyUppyScreen />);
    fireEvent.press(screen.getByText('Back to Home'));
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
});
