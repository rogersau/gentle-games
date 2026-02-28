import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

const mockGoBack = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
const mockGetItem = jest.fn(async () => null);
const mockDrawingCanvas = jest.fn();
const mockInsets = { top: 500, bottom: 500, left: 0, right: 0 };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    dispatch: mockDispatch,
    addListener: mockAddListener,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: () => mockGetItem(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../components/DrawingCanvas', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    DrawingCanvas: React.forwardRef((props: unknown, _ref: React.ForwardedRef<unknown>) => {
      mockDrawingCanvas(props);
      return <View testID="drawing-canvas" />;
    }),
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
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => mockInsets,
  };
});

import {
  DrawingScreen,
  DRAWING_HEADER_HEIGHT,
  DRAWING_TOOLBAR_HEIGHT,
  DRAWING_LAYOUT_PADDING,
} from './DrawingScreen';

describe('DrawingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsets.top = 500;
    mockInsets.bottom = 500;
  });

  it('uses remaining space for canvas height on small screens', async () => {
    render(<DrawingScreen />);

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = mockDrawingCanvas.mock.calls[mockDrawingCanvas.mock.calls.length - 1][0] as {
      height: number;
    };

    const screenHeight = Dimensions.get('window').height;
    const expectedRemainingHeight = Math.max(
      0,
      screenHeight - 500 - 500 - DRAWING_HEADER_HEIGHT - DRAWING_TOOLBAR_HEIGHT - DRAWING_LAYOUT_PADDING
    );

    expect(latestProps.height).toBe(expectedRemainingHeight);
    expect(latestProps.height).toBeLessThan(260);
  });

  it('keeps larger remaining space when insets are realistic', async () => {
    mockInsets.top = 44;
    mockInsets.bottom = 34;

    render(<DrawingScreen />);

    await waitFor(() => {
      expect(mockDrawingCanvas).toHaveBeenCalled();
    });

    const latestProps = mockDrawingCanvas.mock.calls[mockDrawingCanvas.mock.calls.length - 1][0] as {
      height: number;
    };

    const screenHeight = Dimensions.get('window').height;
    const expectedRemainingHeight = Math.max(
      0,
      screenHeight - 44 - 34 - DRAWING_HEADER_HEIGHT - DRAWING_TOOLBAR_HEIGHT - DRAWING_LAYOUT_PADDING
    );

    expect(latestProps.height).toBe(expectedRemainingHeight);
    expect(latestProps.height).toBeGreaterThanOrEqual(260);
  });
});
