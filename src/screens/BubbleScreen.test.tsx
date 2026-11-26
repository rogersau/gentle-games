import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BubbleScreen } from './BubbleScreen';
import { DEFAULT_GAME_SETTINGS } from '../games/settings';

const mockGoBack = jest.fn();
const mockPlayBubblePopSound = jest.fn();
let mockReducedMotion = false;
let mockBubbleProps: Record<string, unknown> = {};
const mockSettings = {
  movement: 'lively' as 'lively' | 'gentle' | 'still',
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  colorMode: 'system' as const,
  pressureFreeMode: false,
  gameSettings: DEFAULT_GAME_SETTINGS,
};

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => mockReducedMotion,
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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../context/MochiContext', () => ({
  useMochiContext: () => ({
    showMochi: jest.fn(),
    hideMochi: jest.fn(),
    celebrate: jest.fn(),
    mochiProps: { visible: false, phrase: null, variant: 'idle' },
  }),
}));

jest.mock('../utils/sounds', () => ({
  playBubblePopSound: (...args: unknown[]) => mockPlayBubblePopSound(...args),
}));

jest.mock('../components/BubbleField', () => {
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    BubbleField: (props: Record<string, unknown>) => {
      mockBubbleProps = props;
      const { onBubblePop } = props as { onBubblePop?: () => void };
      return (
        <View>
          <Text>Mock Bubble Field</Text>
          <TouchableOpacity onPress={onBubblePop}>
            <Text>Pop Mock Bubble</Text>
          </TouchableOpacity>
        </View>
      );
    },
  };
});

describe('BubbleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReducedMotion = false;
    mockBubbleProps = {};
    mockSettings.movement = 'lively';
    mockSettings.pressureFreeMode = false;
    mockSettings.gameSettings = DEFAULT_GAME_SETTINGS;
  });

  it('starts with a single still bubble when using new profile defaults', () => {
    render(<BubbleScreen />);

    expect(mockBubbleProps.motionEnabled).toBe(false);
    expect(mockBubbleProps.minActiveBubbles).toBe(1);
  });

  it('keeps gameplay motion enabled when only decorative animations are disabled', () => {
    mockSettings.movement = 'still';
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'bubble-pop': { motion: 'moving', density: 'full' },
    };
    render(<BubbleScreen />);

    expect(mockBubbleProps.motionEnabled).toBe(true);
  });

  it('uses stationary bubbles when reduced motion is enabled', () => {
    mockReducedMotion = true;
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'bubble-pop': { motion: 'moving', density: 'full' },
    };
    const screen = render(<BubbleScreen />);

    expect(mockBubbleProps.motionEnabled).toBe(false);
    expect(screen.queryByTestId('bubble-motion-toggle')).toBeNull();
  });

  it('switches to still bubbles and back without leaving the game', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByTestId('bubble-motion-toggle'));
    expect(mockBubbleProps.motionEnabled).toBe(true);
    fireEvent.press(screen.getByTestId('bubble-motion-toggle'));
    expect(mockBubbleProps.motionEnabled).toBe(false);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('goes back when the back button is pressed', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByTestId('game-home'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('increments popped count when bubble field reports a pop', () => {
    const screen = render(<BubbleScreen />);

    expect(screen.getByText('Popped: 0')).toBeTruthy();
    expect(screen.getByLabelText('Popped: 0')).toBeTruthy();
    fireEvent.press(screen.getByText('Pop Mock Bubble'));
    expect(screen.getByText('Popped: 1')).toBeTruthy();
    expect(screen.getByLabelText('Popped: 1')).toBeTruthy();
    expect(mockPlayBubblePopSound).toHaveBeenCalledWith(mockSettings);
  });

  it('hides the popped counter in pressure-free mode while the board still works', () => {
    mockSettings.pressureFreeMode = true;
    const screen = render(<BubbleScreen />);
    expect(screen.queryByText('Popped: 0')).toBeNull();
    fireEvent.press(screen.getByText('Pop Mock Bubble'));
    expect(screen.queryByText('Popped: 1')).toBeNull();
    expect(mockPlayBubblePopSound).toHaveBeenCalledWith(mockSettings);
  });
});
