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
      0,
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
      0,
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

  it('loads saved drawing and shows continue modal', async () => {
    const savedDrawing = [{ paths: ['path1'], color: '#000000', width: 5 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedDrawing));

    const { getByText } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByText('Continue where you left off?')).toBeTruthy();
    });
  });

  it('continues with saved drawing when continue button pressed', async () => {
    const savedDrawing = [{ paths: ['path1'], color: '#000000', width: 5 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedDrawing));

    const { getByText, queryByText } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(getByText('Continue')).toBeTruthy();
    });

    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(queryByText('Welcome Back')).toBeNull();
    });
  });

  it('starts new drawing when new button pressed', async () => {
    const savedDrawing = [{ paths: ['path1'], color: '#000000', width: 5 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedDrawing));

    const { getByText } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(getByText('New Drawing')).toBeTruthy();
    });

    fireEvent.press(getByText('New Drawing'));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@gentle_match_saved_drawing');
    });
    expect(mockClearCanvas).toHaveBeenCalled();
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
    const savedDrawing = [{ paths: ['path1'], color: '#000000', width: 5 }];
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
    const { getByLabelText } = render(React.createElement(DrawingScreen));

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
      expect(getByLabelText('← Back')).toBeTruthy();
    });

    const latestProps = getLatestCanvasProps();

    act(() => {
      latestProps.onHistoryChange(historyA);
      jest.advanceTimersByTime(DRAWING_SAVE_DEBOUNCE_MS - 1);
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByLabelText('← Back'));
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
});
