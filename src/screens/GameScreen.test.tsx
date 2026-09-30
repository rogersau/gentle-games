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

const mockUpdateGameSettings = jest.fn();
const mockUpdateSettings = jest.fn();
const memorySettings = { pressureFreeMode: false };
jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: memorySettings,
    updateGameSettings: mockUpdateGameSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.back': '← Back',
        'games.memorySnap.title': 'Memory Snap',
        'games.memorySnap.timeLabel': `Elapsed ${String(options?.time)}`,
        'games.memorySnap.moves': `Turns ${String(options?.count)}`,
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
      renderStats,
    }: {
      onBackPress?: () => void;
      _onPositiveEvent?: () => void;
      renderStats?: (stats: { time: string; moves: number }) => React.ReactNode;
    }) => (
      <View>
        <Text testID='mock-text'>Mock Memory Board</Text>
        {renderStats?.({ time: '0:42', moves: 7 })}
        <TouchableOpacity onPress={onBackPress}>
          <Text testID='board-back'>Board Back</Text>
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
    const { getByText, getByTestId } = render(<GameScreen />);

    expect(getByText('Memory Snap')).toBeTruthy();
    expect(getByText('Elapsed 0:42 · Turns 7')).toBeTruthy();

    const boardBackText = getByTestId('board-back');
    fireEvent.press(boardBackText);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('offers all board sizes on request and remembers the chosen size', () => {
    const screen = render(<GameScreen />);
    expect(screen.queryByTestId('memory-pairs-2')).toBeNull();
    fireEvent.press(screen.getByTestId('memory-change-board'));
    for (const count of [2, 3, 4, 6, 10, 15])
      expect(screen.getByTestId(`memory-pairs-${count}`)).toBeTruthy();
    fireEvent.press(screen.getByTestId('memory-pairs-3'));
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('memory-snap', { pairCount: 3 });
    expect(screen.queryByTestId('memory-pairs-3')).toBeNull();
  });

  it('exposes Home and an in-game global sound switch', () => {
    const screen = render(<GameScreen />);
    fireEvent.press(screen.getByTestId('game-sound'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: true });
    expect(screen.getByTestId('game-sound').props.accessibilityRole).toBe('switch');
    expect(screen.getByTestId('game-sound').props.accessibilityState.checked).toBe(false);
    fireEvent.press(screen.getByTestId('game-home'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('hides Memory Snap timer and moves from the accessibility tree in pressure-free mode', () => {
    memorySettings.pressureFreeMode = true;
    const screen = render(<GameScreen />);
    expect(screen.queryByText('Elapsed 0:42 · Turns 7')).toBeNull();
    expect(screen.queryByTestId('memory-snap-stats')).toBeNull();
  });
});
