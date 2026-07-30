import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { GameBoard } from './GameBoard';
import { calculateGridDimensions, generateTiles } from '../utils/gameLogic';

const mockSettings = {
  animationsEnabled: false,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  theme: 'animals' as const,
  showCardPreview: false,
  colorMode: 'system' as const,
  pressureFreeMode: false,
  gameSettings: {
    'memory-snap': {
      pairCount: 2,
      previewMode: 'none' as 'none' | 'until-ready' | '4-seconds' | '8-seconds',
      mismatchDuration: 2000 as 1000 | 2000 | 3000,
      hintEnabled: true,
    },
  },
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

const createTiles = (values: [string, string]) => [
  { id: '1a', value: values[0], type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '1b', value: values[0], type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '2a', value: values[1], type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '2b', value: values[1], type: 'animal' as const, isFlipped: false, isMatched: false },
];

const singlePairTiles = [
  { id: '1a', value: '🐰', type: 'animal' as const, isFlipped: false, isMatched: false },
  { id: '1b', value: '🐰', type: 'animal' as const, isFlipped: false, isMatched: false },
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
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Tile: ({
      tile,
      onPress,
      size,
    }: {
      tile: { id: string; value: string; isFlipped: boolean; isMatched: boolean };
      onPress: () => void;
      size: number;
    }) => {
      renderedTileSize = size;
      return (
        <TouchableOpacity
          testID={`tile-${tile.id}`}
          style={{ width: size, height: size }}
          onPress={onPress}
        >
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
    mockSettings.difficulty = 'easy';
    mockSettings.theme = 'animals';
    mockSettings.showCardPreview = false;
    mockSettings.pressureFreeMode = false;
    mockSettings.gameSettings['memory-snap'] = {
      pairCount: 2,
      previewMode: 'none',
      mismatchDuration: 2000,
      hintEnabled: true,
    };
    mockedCalculateGridDimensions.mockReturnValue({ cols: 2, rows: 2 });
    mockedGenerateTiles.mockImplementation(() => baseTiles.map((tile) => ({ ...tile })));
  });

  it('starts timer on first tile flip', async () => {
    const screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

    expect(screen.getByText('—')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1a'));
    });

    await waitFor(() => {
      expect(screen.queryByText('—')).toBeNull();
    });
  });

  it('locks two rapid selections together without stranding a face-up card', () => {
    jest.useFakeTimers();
    const screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

    try {
      fireEvent.press(screen.getByTestId('tile-1a'));
      fireEvent.press(screen.getByTestId('tile-2a'));

      expect(
        screen.getByTestId('tile-1a').findByType(require('react-native').Text).props.children,
      ).toBe('🐰');
      expect(
        screen.getByTestId('tile-2a').findByType(require('react-native').Text).props.children,
      ).toBe('🐶');

      act(() => jest.advanceTimersByTime(2000));
      expect(screen.getAllByText('?')).toHaveLength(4);
    } finally {
      screen.unmount();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  it('shows completion state and calls onGameComplete after all matches', async () => {
    const onGameComplete = jest.fn();
    jest.useFakeTimers();
    let screen!: ReturnType<typeof render>;

    try {
      screen = render(<GameBoard onGameComplete={onGameComplete} onBackPress={jest.fn()} />);

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
    mockSettings.gameSettings['memory-snap'].pairCount = 6;
    const screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

    const boardStyle = StyleSheet.flatten(screen.getByTestId('memory-board').props.style);
    expect(boardStyle.height).toBeGreaterThanOrEqual(renderedTileSize * 4);
  });

  it('uses neutral completion copy in pressure-free mode', async () => {
    mockSettings.pressureFreeMode = true;
    mockedGenerateTiles.mockReturnValue(singlePairTiles);
    jest.useFakeTimers();
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

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

    expect(screen.getByText('All pairs are together.')).toBeTruthy();
    expect(screen.queryByText(/games\.memorySnap\.completedIn/)).toBeNull();
    screen.unmount();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockSettings.pressureFreeMode = false;
  });

  it('never shows negative timer when first card is selected after delay', async () => {
    jest.useFakeTimers();
    const now = Date.now();
    let mockTime = now;
    let screen!: ReturnType<typeof render>;

    // Mock Date.now to return controlled times
    jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    try {
      screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

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
        const el = screen.queryByTestId('memory-snap-timer');
        expect(el).toBeTruthy();
      });

      const timerElement = screen.queryByTestId('memory-snap-timer');

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

  it('clears the previous preview timeout before starting a replacement preview', async () => {
    jest.useFakeTimers();
    mockSettings.gameSettings['memory-snap'].previewMode = '4-seconds';
    mockSettings.gameSettings = {
      ...mockSettings.gameSettings,
      'memory-snap': { ...mockSettings.gameSettings['memory-snap'] },
    };
    mockedGenerateTiles
      .mockImplementationOnce(() => createTiles(['🐰', '🐶']))
      .mockImplementationOnce(() => createTiles(['🦊', '🐻']));

    let screen!: ReturnType<typeof render>;

    try {
      screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

      expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('?').length).toBe(0);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      mockSettings.difficulty = 'medium';
      mockSettings.gameSettings = {
        ...mockSettings.gameSettings,
        'memory-snap': { ...mockSettings.gameSettings['memory-snap'] },
      };

      screen.rerender(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

      expect(screen.queryAllByText('🦊').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('?').length).toBe(0);

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryAllByText('🦊').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('?').length).toBe(0);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryAllByText('?').length).toBe(4);
    } finally {
      screen?.unmount();
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    }
  });

  it('does not let stale mismatch timers flip tiles in the next round preview', async () => {
    jest.useFakeTimers();
    mockedGenerateTiles
      .mockImplementationOnce(() => createTiles(['🐰', '🐶']))
      .mockImplementationOnce(() => createTiles(['🦊', '🐻']));

    let screen!: ReturnType<typeof render>;

    try {
      screen = render(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-1a'));
      });
      await waitFor(() => expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0));

      await act(async () => {
        fireEvent.press(screen.getByTestId('tile-2a'));
      });

      mockSettings.gameSettings['memory-snap'].previewMode = '4-seconds';
      mockSettings.difficulty = 'medium';
      mockSettings.gameSettings = {
        ...mockSettings.gameSettings,
        'memory-snap': { ...mockSettings.gameSettings['memory-snap'] },
      };

      await act(async () => {
        screen.rerender(<GameBoard onGameComplete={jest.fn()} onBackPress={jest.fn()} />);
      });

      await waitFor(() => {
        expect(screen.queryAllByText('🦊').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('🐻').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('?').length).toBe(0);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryAllByText('🦊').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('🐻').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('?').length).toBe(0);
    } finally {
      screen?.unmount();
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    }
  });

  it('shows no preview when preview mode is none', () => {
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

    expect(screen.queryAllByText('?')).toHaveLength(4);
    expect(screen.queryByTestId('memory-snap-ready')).toBeNull();
  });

  it('keeps until-ready preview open until Ready is pressed', async () => {
    jest.useFakeTimers();
    mockSettings.gameSettings['memory-snap'].previewMode = 'until-ready';
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);

    fireEvent.press(screen.getByTestId('memory-snap-ready'));
    expect(screen.queryAllByText('?')).toHaveLength(4);
    screen.unmount();
    jest.useRealTimers();
  });

  it.each([
    ['4-seconds', 4000],
    ['8-seconds', 8000],
  ] as const)('ends %s preview at its exact duration', async (previewMode, duration) => {
    jest.useFakeTimers();
    mockSettings.gameSettings['memory-snap'].previewMode = previewMode;
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(duration - 1);
    });
    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryAllByText('?')).toHaveLength(4);
    screen.unmount();
    jest.useRealTimers();
  });

  it('uses the configured mismatch duration independently of preview', async () => {
    jest.useFakeTimers();
    mockSettings.gameSettings['memory-snap'].mismatchDuration = 1000;
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1a'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-2a'));
    });
    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
    await act(async () => {
      jest.advanceTimersByTime(999);
    });
    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryAllByText('?')).toHaveLength(4);
    screen.unmount();
    jest.useRealTimers();
  });

  it('reveals one previously seen card as a hint without adding a move', async () => {
    jest.useFakeTimers();
    const screen = render(<GameBoard onGameComplete={jest.fn()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1a'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-2a'));
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('memory-snap-hint').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByTestId('memory-snap-hint'));
    expect(screen.queryAllByText('🐰').length).toBeGreaterThan(0);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.queryAllByText('?')).toHaveLength(4);
    screen.unmount();
    jest.useRealTimers();
  });

  it('settles matched cards visibly and presents neutral pressure-free completion', async () => {
    jest.useFakeTimers();
    mockSettings.pressureFreeMode = true;
    mockedGenerateTiles.mockReturnValue(singlePairTiles.map((tile) => ({ ...tile })));
    const onGameComplete = jest.fn();
    const screen = render(<GameBoard onGameComplete={onGameComplete} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1a'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('tile-1b'));
    });

    expect(onGameComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('All pairs are together.')).toBeTruthy();
    expect(screen.queryByText(/moves/i)).toBeNull();
    screen.unmount();
    mockSettings.pressureFreeMode = false;
    jest.useRealTimers();
  });
});
