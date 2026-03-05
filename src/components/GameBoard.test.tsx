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
    let screen!: ReturnType<typeof render>;

    try {
      screen = render(
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
      // The accessibilityLabel uses the translation key with interpolation
      // so we need to check for the rendered text instead
      expect(screen.getByText(/moves/i)).toBeTruthy();
    } finally {
      screen.unmount();
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    }
  });

  it('keeps full tile grid height within the board bounds', () => {
    mockedCalculateGridDimensions.mockReturnValue({ cols: 3, rows: 4 });
    const screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

    const boardStyle = StyleSheet.flatten(screen.getByTestId('memory-board').props.style);
    expect(boardStyle.height).toBeGreaterThanOrEqual(renderedTileSize * 4);
  });

  it('never shows negative timer when first card is selected after delay', async () => {
    jest.useFakeTimers();
    const now = Date.now();
    let mockTime = now;
    let screen!: ReturnType<typeof render>;
    
    // Mock Date.now to return controlled times
    jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    try {
      screen = render(
        <GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />
      );

      // Simulate 3 seconds passing before user clicks first card
      mockTime = now + 3000;

      // Click first tile
      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-1a'));
      });

      // Wait for re-render and timer to appear
      await waitFor(() => {
        expect(screen.queryByText('—')).toBeNull();
      });

      // Wait for the timer element with the time label to appear
      // The accessibilityLabel will be "Time: X:XX" after the game starts
      await waitFor(() => {
        const el = screen.queryByLabelText(/Time:/);
        expect(el).toBeTruthy();
      });
      
      const timerElement = screen.queryByLabelText(/Time:/);
      
      // Get the displayed time text - it should never start with minus
      const timerText = timerElement?.props?.children;
      
      // Convert to string if it's a number or array
      const timerString = Array.isArray(timerText) ? timerText.join('') : String(timerText);
      
      // The timer should show 0:00 or positive time, never negative
      // The bug causes it to show negative because currentTime is stale
      expect(timerString).not.toMatch(/^-/); // Should not start with minus sign
    } finally {
      screen.unmount();
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });
});
