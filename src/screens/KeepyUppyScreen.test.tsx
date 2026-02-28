import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
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
    fireEvent.press(screen.getByText('← Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('adds balloons up to a max of three', () => {
    const screen = render(<KeepyUppyScreen />);
    const addButton = screen.getByText('+ Balloon');

    expect(screen.getByText('Balloons: 1')).toBeTruthy();
    fireEvent.press(addButton);
    expect(screen.getByText('Balloons: 2')).toBeTruthy();
    fireEvent.press(addButton);
    expect(screen.getByText('Balloons: 3')).toBeTruthy();
    fireEvent.press(addButton);
    expect(screen.getByText('Balloons: 3')).toBeTruthy();
  });
});
