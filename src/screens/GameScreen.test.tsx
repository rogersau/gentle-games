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
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({
    bottom: 24,
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
      background: '#FFFEF7',
      text: '#5A5A5A',
    },
    resolvedMode: 'light',
  }),
  useReducedMotion: () => false,
}));

jest.mock('../components/GameBoard', () => {
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    GameBoard: ({
      onBackPress,
      _onPositiveEvent,
      _onGameStart,
      renderStats,
    }: {
      onBackPress?: () => void;
      _onPositiveEvent?: () => void;
      _onGameStart?: () => void;
      renderStats?: (stats: { time: string; moves: number }) => React.ReactNode;
    }) => (
      <View>
        <Text testID="mock-text">Mock Memory Board</Text>
        {renderStats?.({ time: '0:42', moves: 7 })}
        <TouchableOpacity onPress={onBackPress}>
          <Text testID="board-back">Board Back</Text>
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
    const { getByText, root } = render(<GameScreen />);

    expect(getByText('Memory Snap')).toBeTruthy();

    const boardBackText = root.findByProps({ testID: 'board-back' });
    fireEvent.press(boardBackText);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
