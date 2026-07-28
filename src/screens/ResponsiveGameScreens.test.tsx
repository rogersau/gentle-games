import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { BubbleScreen } from './BubbleScreen';
import { CategoryMatchScreen } from './CategoryMatchScreen';
import { GlitterScreen } from './GlitterScreen';
import { KeepyUppyScreen } from './KeepyUppyScreen';

const mockGoBack = jest.fn();
let mockBubbleProps: Record<string, unknown> = {};
let mockCategoryProps: Record<string, unknown> = {};
let mockKeepyProps: Record<string, unknown> = {};
let mockGlitterProps: Record<string, unknown> = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

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
      surface: '#FFFFFF',
      border: '#DDD',
      borderSubtle: '#EEE',
      danger: '#D66',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      animationsEnabled: false,
      reducedMotionEnabled: false,
      soundEnabled: false,
      soundVolume: 0.5,
      showMochiInGames: false,
      keepyUppyEasyMode: true,
    },
  }),
}));

jest.mock('../hooks/useMochi', () => ({
  useMochi: () => ({ showMochi: jest.fn() }),
}));
jest.mock('../ui/animations', () => ({
  useAnimationEnabled: () => false,
  useScalePress: () => ({
    scale: 1,
    onPressIn: jest.fn(),
    onPressOut: jest.fn(),
  }),
}));
jest.mock('../utils/sounds', () => ({
  playBubblePopSound: jest.fn(),
  playMatchSound: jest.fn(),
  playFlipSound: jest.fn(),
}));

jest.mock('../components/BubbleField', () => ({
  BubbleField: (props: Record<string, unknown>) => {
    mockBubbleProps = props;
    const { View: MockView } = require('react-native');
    return <MockView testID='bubble-board' />;
  },
}));
jest.mock('../components/CategoryMatchBoard', () => ({
  CategoryMatchBoard: (props: Record<string, unknown>) => {
    mockCategoryProps = props;
    const { View: MockView } = require('react-native');
    return <MockView testID='category-board' />;
  },
}));
jest.mock('../components/KeepyUppyBoard', () => ({
  KeepyUppyBoard: (props: Record<string, unknown>) => {
    mockKeepyProps = props;
    const { View: MockView } = require('react-native');
    return <MockView testID='keepy-board' />;
  },
}));
jest.mock('../components/GlitterGlobe', () => {
  const ReactModule = require('react');
  return {
    GlitterGlobe: ReactModule.forwardRef((props: Record<string, unknown>, _ref: unknown) => {
      mockGlitterProps = props;
      const { View: MockView } = require('react-native');
      return <MockView testID='glitter-board' />;
    }),
  };
});

const layout = (screen: ReturnType<typeof render>, width: number, height: number) => {
  fireEvent(screen.UNSAFE_getByType(ScrollView), 'layout', {
    nativeEvent: { layout: { width, height } },
  });
};

describe('responsive game screens', () => {
  beforeEach(() => {
    mockBubbleProps = {};
    mockCategoryProps = {};
    mockKeepyProps = {};
    mockGlitterProps = {};
  });

  it('fits Bubble Pop to a short narrow measured viewport', () => {
    const screen = render(<BubbleScreen />);
    layout(screen, 240, 300);
    expect(mockBubbleProps.width).toBe(216);
    expect(mockBubbleProps.height).toBe(220);
  });

  it('fits Category Match to a landscape measured viewport after starting', () => {
    const screen = render(<CategoryMatchScreen />);
    fireEvent.press(screen.getByText('Start Sorting'));
    layout(screen, 480, 320);
    expect(mockCategoryProps.width).toBe(456);
    expect(mockCategoryProps.height).toBe(240);
  });

  it('fits Keepy Uppy to a compact measured viewport', () => {
    const screen = render(<KeepyUppyScreen />);
    layout(screen, 260, 320);
    const bounds = mockKeepyProps.bounds as { width: number; height: number };
    expect(bounds.width).toBe(236);
    expect(bounds.height).toBe(220);
  });

  it('keeps Glitter controls rendered while the globe shrinks', () => {
    const screen = render(<GlitterScreen />);
    layout(screen, 240, 300);
    expect(mockGlitterProps.width).toBe(180);
    expect(screen.getByTestId('glitter-controls')).toBeTruthy();
    expect(screen.getByTestId('glitter-clear-button')).toBeTruthy();
    expect(screen.getByTestId('glitter-add-button')).toBeTruthy();
  });
});
