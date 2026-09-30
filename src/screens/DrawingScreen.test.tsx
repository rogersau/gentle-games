import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Dimensions, ScaledSize } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGoBack = jest.fn();
const mockDispatch = jest.fn();
const mockClearCanvas = jest.fn();
const mockDrawingCanvas = jest.fn();
const mockInsets = { top: 500, bottom: 500, left: 0, right: 0 };
let mockCanvasHistory: unknown[] = [];
let beforeRemoveListener:
  | ((event: { preventDefault: () => void; data: { action: unknown } }) => void | Promise<void>)
  | undefined;

const mockAddListener = jest.fn((eventName: string, listener: unknown) => {
  if (eventName === 'beforeRemove') {
    beforeRemoveListener = listener as typeof beforeRemoveListener;
  }

  return jest.fn();
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    dispatch: mockDispatch,
    addListener: mockAddListener,
  }),
}));

jest.mock('../components/DrawingCanvas', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    DrawingCanvas: React.forwardRef(
      (props: Record<string, unknown>, ref: React.ForwardedRef<unknown>) => {
        React.useImperativeHandle(ref, () => ({
          clear: mockClearCanvas,
          getHistory: () => mockCanvasHistory,
        }));

        mockDrawingCanvas(props);
        return React.createElement(View, { testID: 'drawing-canvas' });
      },
    ),
  };
});

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
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

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => mockInsets,
  };
});

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      animationsEnabled: false,
      reducedMotionEnabled: false,
      showMochiInGames: true,
    },
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

import {
  DrawingScreen,
  DRAWING_HEADER_HEIGHT,
  DRAWING_LAYOUT_PADDING,
  DRAWING_TOOLBAR_HEIGHT,
  DRAWING_SAVE_DEBOUNCE_MS,
} from './DrawingScreen';

const historyA = [
  { kind: 'shape', id: 'shape-a', type: 'circle', x: 10, y: 20, size: 20, color: '#000', width: 5 },
];
const historyB = [
  { kind: 'shape', id: 'shape-b', type: 'square', x: 30, y: 40, size: 24, color: '#f00', width: 5 },
];

const getLatestCanvasProps = () =>
  mockDrawingCanvas.mock.calls[mockDrawingCanvas.mock.calls.length - 1][0] as {
    width: number;
    height: number;
    bottomInset: number;
    initialHistory: typeof historyA;
    onHistoryChange: (history: typeof historyA) => void;
  };

describe('DrawingScreen', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    beforeRemoveListener = undefined;
    mockCanvasHistory = [];
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 390,
      height: 844,
      scale: 2,
      fontScale: 2,
    } as ScaledSize);
    mockInsets.top = 500;
    mockInsets.bottom = 500;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses remaining space for canvas height on small screens', async () => {
    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();
    const screenHeight = Dimensions.get('window').height;
    const expectedRemainingHeight = Math.max(
      160,
      screenHeight -
        500 -
        500 -
        DRAWING_HEADER_HEIGHT -
        DRAWING_TOOLBAR_HEIGHT -
        DRAWING_LAYOUT_PADDING,
    );

    expect(latestProps.height).toBe(expectedRemainingHeight);
    expect(latestProps.height).toBeLessThan(260);
  });

  it('keeps larger remaining space when insets are realistic', async () => {
    mockInsets.top = 44;
    mockInsets.bottom = 34;

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();
    const screenHeight = Dimensions.get('window').height;
    const expectedRemainingHeight = Math.max(
      160,
      screenHeight -
        44 -
        34 -
        DRAWING_HEADER_HEIGHT -
        DRAWING_TOOLBAR_HEIGHT -
        DRAWING_LAYOUT_PADDING,
    );

    expect(latestProps.height).toBe(expectedRemainingHeight);
    expect(latestProps.height).toBeGreaterThanOrEqual(260);
  });

  it('shows loading state initially', () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    const { getByText } = render(React.createElement(DrawingScreen));
    expect(getByText('common.loading')).toBeTruthy();
  });

  it('reopens the saved drawing without a blocking dialog', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(historyA));
    const screen = render(<DrawingScreen />);
    await waitFor(() => expect(getLatestCanvasProps().initialHistory).toEqual(historyA));
    expect(screen.queryByText('Welcome Back')).toBeNull();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    screen.rerender(<DrawingScreen />);
    expect(getLatestCanvasProps().initialHistory).toEqual(historyA);
  });

  it('keeps low marks in an existing drawing reachable below the larger toolbar', async () => {
    const saved = [
      { kind: 'shape', id: 'low-mark', type: 'circle', x: 80, y: 700, size: 60, color: '#FF6B6B' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(saved));
    render(<DrawingScreen />);
    await waitFor(() => expect(getLatestCanvasProps().height).toBeGreaterThanOrEqual(730));
  });

  it('handles no saved drawing gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { queryByText } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(queryByText('Welcome Back')).toBeNull();
    });
  });

  it('handles invalid saved drawing data', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  it('clears valid JSON that is not a drawable history', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([{ kind: 'stroke', id: 'broken-stroke' }]),
    );

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@gentle_match_saved_drawing');
      expect(getLatestCanvasProps().initialHistory).toEqual([]);
    });
  });

  it('passes canvas dimensions to DrawingCanvas', async () => {
    mockInsets.top = 44;
    mockInsets.bottom = 34;

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();
    const screenWidth = Dimensions.get('window').width;

    expect(latestProps.width).toBe(screenWidth - DRAWING_LAYOUT_PADDING);
    expect(latestProps.bottomInset).toBe(34);
  });

  it('passes saved history to canvas when continuing', async () => {
    const savedDrawing = historyA;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedDrawing));

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();
    expect(latestProps.initialHistory).toEqual(savedDrawing);
  });

  it('debounces history writes instead of saving on every edit', async () => {
    jest.useFakeTimers();
    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();

    act(() => {
      latestProps.onHistoryChange(historyA);
      latestProps.onHistoryChange(historyB);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS - 1);
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@gentle_match_saved_drawing',
      JSON.stringify(historyB),
    );
  });

  it('flushes the latest history before navigating back', async () => {
    jest.useFakeTimers();
    mockCanvasHistory = historyB;
    const { getByTestId } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
      expect(getByTestId('game-home')).toBeTruthy();
    });

    const latestProps = getLatestCanvasProps();

    act(() => {
      latestProps.onHistoryChange(historyA);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS - 1);
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByTestId('game-home'));
      await Promise.resolve();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@gentle_match_saved_drawing',
      JSON.stringify(historyB),
    );
    expect(mockGoBack).toHaveBeenCalled();
    expect((AsyncStorage.setItem as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      mockGoBack.mock.invocationCallOrder[0],
    );
  });

  it('flushes pending history during beforeRemove before dispatching the intercepted action', async () => {
    jest.useFakeTimers();
    mockCanvasHistory = historyB;
    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
      expect(beforeRemoveListener).toBeDefined();
    });

    const latestProps = getLatestCanvasProps();
    const preventDefault = jest.fn();
    const action = { type: 'GO_BACK' };

    act(() => {
      latestProps.onHistoryChange(historyA);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS - 1);
    });

    await act(async () => {
      await beforeRemoveListener?.({
        preventDefault,
        data: { action },
      });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@gentle_match_saved_drawing',
      JSON.stringify(historyB),
    );
    expect(mockDispatch).toHaveBeenCalledWith(action);
    expect((AsyncStorage.setItem as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      mockDispatch.mock.invocationCallOrder[0],
    );
  });

  it('removes saved drawing after the debounce window when history is cleared', async () => {
    jest.useFakeTimers();
    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = getLatestCanvasProps();

    act(() => {
      latestProps.onHistoryChange([]);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS - 1);
    });

    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('@gentle_match_saved_drawing');

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@gentle_match_saved_drawing');
  });

  it('handles storage errors gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('shows a localized save notice while retaining the current canvas after quota failure', async () => {
    jest.useFakeTimers();
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('quota'));
    const screen = render(React.createElement(DrawingScreen));
    await waitFor(() => expect(mockDrawingCanvas).toHaveBeenCalled());
    const latestProps = getLatestCanvasProps();
    act(() => {
      latestProps.onHistoryChange(historyA);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockClearCanvas).not.toHaveBeenCalled();
    expect(screen.getByTestId('drawing-save-notice')).toBeTruthy();

    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    act(() => {
      latestProps.onHistoryChange(historyB);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId('drawing-save-notice')).toBeNull();
  });
});
