import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { GameBoard } from './GameBoard';
import { calculateGridDimensions, generateTiles } from '../utils/gameLogic';

const mockSettings = {
  animationsEnabled: false,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'easy' as const,
  theme: 'animals' as const,
  showCardPreview: false,
  colorMode: 'system' as const,
};

const mockPlayFlipSound = jest.fn();
const mockPlayMatchSound = jest.fn();
const mockPlayCompleteSound = jest.fn();
let renderedTileSize = 0;

const baseTiles = [
  { id: '1a', value: '🐰', type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '1b', value: '🐰', type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '2a', value: '🐶', type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '2b', value: '🐶', type: 'animal' as const, isFlipped: false, isMatched: false },
];

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../utils/sounds', () => ({
  playFlipSound: (...args: unknown[]) => mockPlayFlipSound(...args),
  playMatchSound: (...args: unknown[]) => mockPlayMatchSound(...args),
  playCompleteSound: (...args: unknown[]) => mockPlayCompleteSound(...args),
}));

jest.mock('../utils/gameLogic', () => {
  const actual = jest.requireActual('../utils/gameLogic');
  return {
    ...actual,
    generateTiles: jest.fn(),
    calculateGridDimensions: jest.fn(() => ({ cols: 2, rows: 2 })),
  };
});

jest.mock('./Tile', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Tile: ({ tile, onPress, size }: { tile: { id: string; value: string; isFlipped: boolean; isMatched: boolean }; onPress: () => void; size: number }) => {
      renderedTileSize = size;
      return (
        <TouchableOpacity testID={`tile-${tile.id}`} style={{ width: size, height: size }} onPress={onPress}>
        <Text>{tile.isFlipped || tile.isMatched ? tile.value : '?'}</Text>
      </TouchableOpacity>
      );
    },
  };
});

describe('GameBoard', () => {
  const mockedGenerateTiles = generateTiles as jest.MockedFunction<typeof generateTiles>;
  const mockedCalculateGridDimensions = calculateGridDimensions as jest.MockedFunction<
    typeof calculateGridDimensions
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    renderedTileSize = 0;
    mockedCalculateGridDimensions.mockReturnValue({ cols: 2, rows: 2 });
    mockedGenerateTiles.mockImplementation(() => baseTiles.map((tile) => ({ ...tile })));
  });

  it('starts timer on first tile flip', async () => {
    const screen = render(
      <GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />
    );

    expect(screen.getByText('—')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1a'));
    });

    await waitFor(() => {
      expect(screen.queryByText('—')).toBeNull();
    });
  });

  it('shows completion state and calls onGameComplete after all matches', async () => {
    const onGameComplete = jest.fn();
    jest.useFakeTimers();

    try {
      const screen = render(
        <GameBoard onGameComplete={onGameComplete} onBackPress={jest.fn()} />
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-1a'));
      });
      await waitFor(() => expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0));
      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-1b'));
      });
      await act(async () => {
        jest.advanceTimersByTime(650);
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-2a'));
      });
      await waitFor(() => expect(screen.queryAllByText('🐶').length).toBeGreaterThan(0));
      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-2b'));
      });
      await act(async () => {
        jest.advanceTimersByTime(650);
      });

      await waitFor(() => {
        expect(screen.getByText(/You finished in/)).toBeTruthy();
      });
      expect(onGameComplete).toHaveBeenCalledTimes(1);
      // Verify move counter is still visible
      const movesElement = screen.root.findAll(
        (node: any) => node.props?.accessibilityLabel === '2 moves'
      );
      expect(movesElement.length).toBeGreaterThan(0);
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  it('keeps full tile grid height within the board bounds', () => {
    mockedCalculateGridDimensions.mockReturnValue({ cols: 3, rows: 4 });
    const screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

    const boardStyle = StyleSheet.flatten(screen.getByTestId('memory-board').props.style);
    expect(boardStyle.height).toBeGreaterThanOrEqual(renderedTileSize * 4);
  });
});
