import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { GameBoard } from './GameBoard';
import { generateTiles } from '../utils/gameLogic';

const mockSettings = {
  animationsEnabled: false,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'easy' as const,
  theme: 'animals' as const,
};

const mockPlayFlipSound = jest.fn();
const mockPlayMatchSound = jest.fn();
const mockPlayCompleteSound = jest.fn();

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
    Tile: ({ tile, onPress }: { tile: { id: string; value: string; isFlipped: boolean; isMatched: boolean }; onPress: () => void }) => (
      <TouchableOpacity testID={`tile-${tile.id}`} onPress={onPress}>
        <Text>{tile.isFlipped || tile.isMatched ? tile.value : '?'}</Text>
      </TouchableOpacity>
    ),
  };
});

describe('GameBoard', () => {
  const mockedGenerateTiles = generateTiles as jest.MockedFunction<typeof generateTiles>;

  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(screen.getByText('Moves: 2')).toBeTruthy();
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });
});
