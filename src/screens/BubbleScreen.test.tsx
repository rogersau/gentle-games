import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BubbleScreen } from './BubbleScreen';

const mockGoBack = jest.fn();
const mockPlayBubblePopSound = jest.fn();
const mockUpdateGameSettings = jest.fn().mockResolvedValue(undefined);
let mockReducedMotion = false;
let mockBubbleProps: Record<string, unknown> = {};
const mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  colorMode: 'system' as const,
  pressureFreeMode: false,
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
    updateGameSettings: mockUpdateGameSettings,
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
    mockSettings.animationsEnabled = true;
    mockSettings.pressureFreeMode = false;
  });

  it('keeps gameplay motion enabled when only decorative animations are disabled', () => {
    mockSettings.animationsEnabled = false;
    render(<BubbleScreen />);

    expect(mockBubbleProps.motionEnabled).toBe(true);
  });

  it('uses stationary bubbles when reduced motion is enabled', () => {
    mockReducedMotion = true;
    render(<BubbleScreen />);

    expect(mockBubbleProps.motionEnabled).toBe(false);
  });

  it('goes back when the back button is pressed', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByText('← Back'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('keeps free play free of totals while the board still works', () => {
    const screen = render(<BubbleScreen />);

    expect(screen.queryByText('Popped: 0')).toBeNull();
    fireEvent.press(screen.getByText('Pop Mock Bubble'));
    expect(mockPlayBubblePopSound).toHaveBeenCalledWith(mockSettings);
  });

  it('shows the guided mode choices separately from free play', () => {
    const screen = render(<BubbleScreen />);

    expect(screen.getByText('games.bubblePop.freePlayTitle')).toBeTruthy();
    expect(screen.getByText('games.bubblePop.guided.count.label')).toBeTruthy();
  });

  it('locks an exact-count round and waits for a deliberate next or exit action', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByText('games.bubblePop.guided.count.label'));
    const bubble = {
      id: 'count-bubble',
      x: 100,
      y: 100,
      radius: 28,
      targetRadius: 28,
      growthPerSecond: 0,
      speed: 0,
      color: '#A8D8EA',
      opacity: 1,
    };

    let accepted = false;
    for (let count = 0; count < 3; count += 1) {
      act(() => {
        accepted = (mockBubbleProps.onBubblePop as (value: typeof bubble) => boolean)(bubble);
      });
      expect(accepted).toBe(true);
    }

    act(() => {
      accepted = (mockBubbleProps.onBubblePop as (value: typeof bubble) => boolean)(bubble);
    });
    expect(accepted).toBe(false);
    expect(screen.getByTestId('bubble-next-round')).toBeTruthy();
    expect(screen.getByTestId('bubble-exit-guided')).toBeTruthy();
    expect(screen.getByTestId('bubble-guidance-announcement').props.accessibilityLabel).toBe(
      'games.bubblePop.guided.count.locked',
    );
  });

  it('persists independent motion, speed, density, and size choices', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByRole('radio', { name: 'games.bubblePop.sensory.floating' }));
    fireEvent.press(screen.getByRole('radio', { name: 'games.bubblePop.sensory.fast' }));
    fireEvent.press(screen.getByRole('radio', { name: 'games.bubblePop.sensory.full' }));
    fireEvent.press(screen.getByRole('radio', { name: 'games.bubblePop.sensory.large' }));

    expect(mockUpdateGameSettings).toHaveBeenCalledWith('bubble-pop', { motion: 'moving' });
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('bubble-pop', { speed: 'fast' });
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('bubble-pop', { density: 'full' });
    expect(mockUpdateGameSettings).toHaveBeenCalledWith('bubble-pop', { size: 'large' });
  });
});
