import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { GameScreen } from './GameScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    bottom: 24,
  }),
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.back': '← Back',
        'games.memorySnap.title': 'Memory Snap',
      };
      return translations[key] ?? key;
    },
  }),
}));

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      text: '#5A5A5A',
    },
  }),
}));

jest.mock('../components/GameBoard', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    GameBoard: ({
      onBackPress,
      renderStats,
    }: {
      onBackPress?: () => void;
      renderStats?: (stats: { time: string; moves: number }) => React.ReactNode;
    }) => (
      <View>
        <Text>Mock Memory Board</Text>
        {renderStats?.({ time: '0:42', moves: 7 })}
        <TouchableOpacity onPress={onBackPress}>
          <Text>Board Back</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('GameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Memory Snap header, exposes the stats label, and wires board back presses', () => {
    const screen = render(<GameScreen />);

    expect(screen.getByText('Memory Snap')).toBeTruthy();
    expect(screen.getByText('Mock Memory Board')).toBeTruthy();
    expect(screen.getByTestId('memory-snap-stats').props.accessibilityLabel).toBe('Time 0:42, 7 moves');

    fireEvent.press(screen.getByText('Board Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
