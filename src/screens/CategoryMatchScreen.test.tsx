import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CategoryMatchScreen } from './CategoryMatchScreen';

const mockGoBack = jest.fn();

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
}));

jest.mock('../components/CategoryMatchBoard', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    CategoryMatchBoard: ({
      onCorrectMatch,
    }: {
      onCorrectMatch?: (item: { emoji: string; name: string; color: string; category: 'animals' }, category: 'animals') => void;
    }) => (
      <View>
        <Text>Mock Category Match Board</Text>
        <TouchableOpacity
          onPress={() =>
            onCorrectMatch?.(
              { emoji: '🐰', name: 'bunny', color: '#FFB6C1', category: 'animals' },
              'animals'
            )
          }
        >
          <Text>Match Correct Item</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('CategoryMatchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('goes back when the back button is pressed', () => {
    const screen = render(<CategoryMatchScreen />);
    fireEvent.press(screen.getByText('← Back'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('increments correct count when the board reports a correct match', () => {
    const screen = render(<CategoryMatchScreen />);
    fireEvent.press(screen.getByText('Start Sorting'));

    expect(screen.getByText('Correct: 0')).toBeTruthy();
    fireEvent.press(screen.getByText('Match Correct Item'));
    expect(screen.getByText('Correct: 1')).toBeTruthy();
  });
});

