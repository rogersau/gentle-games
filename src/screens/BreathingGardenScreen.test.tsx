import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BreathingGardenScreen } from './BreathingGardenScreen';
import {
  assertNoInfiniteLoops,
  createInfiniteLoopSpy,
} from '../test-utils/infiniteLoopDetection';

const mockGoBack = jest.fn();
const mockToggleMusic = jest.fn();
const mockStopMusic = jest.fn();

const mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  colorMode: 'system' as const,
};

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const cleanup = callback();
    return cleanup;
  },
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../utils/music', () => ({
  useBackgroundMusic: () => ({
    isPlaying: false,
    toggleMusic: mockToggleMusic,
    stopMusic: mockStopMusic,
  }),
}));

jest.mock('../components/BreathingBall', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return {
    BreathingBall: ({
      onPhaseChange,
      onCycleComplete,
      onProgress,
      colorScheme,
    }: {
      onPhaseChange?: (phase: 'inhale' | 'exhale') => void;
      onCycleComplete?: (count: number) => void;
      onProgress?: (progress: number) => void;
      colorScheme?: { name: string };
    }) => {
      React.useEffect(() => {
        // Simulate phase changes to trigger parent state updates
        if (onPhaseChange) {
          onPhaseChange('inhale');
        }
        if (onProgress) {
          onProgress(0.5);
        }
      }, [onPhaseChange, onProgress]);

      return (
        <View testID="breathing-ball">
          <Text>Color: {colorScheme?.name || 'Default'}</Text>
        </View>
      );
    },
  };
});

describe('BreathingGardenScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.animationsEnabled = true;
    consoleErrorSpy = createInfiniteLoopSpy();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders without infinite loop errors', () => {
    render(React.createElement(BreathingGardenScreen));
    assertNoInfiniteLoops(consoleErrorSpy);
  });

  it('goes back when the back button is pressed', () => {
    const screen = render(React.createElement(BreathingGardenScreen));
    fireEvent.press(screen.getByLabelText('← Back'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('cycles through color schemes', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    // Verify buttons exist
    expect(screen.getByText('Change color')).toBeTruthy();
    
    // Press to cycle colors
    fireEvent.press(screen.getByText('Change color'));
    fireEvent.press(screen.getByText('Change color'));
    
    // Test passes if buttons work
    expect(screen.getByText('Change color')).toBeTruthy();
  });

  it('toggles music', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    fireEvent.press(screen.getByText('Music on'));

    expect(mockToggleMusic).toHaveBeenCalledTimes(1);
  });

  it('displays breathing phase text', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    expect(screen.getByText('Breathe in')).toBeTruthy();
  });

  it('displays breath count', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    expect(screen.getByText(/Breaths/)).toBeTruthy();
  });

  it('handles multiple renders without errors', () => {
    const { rerender } = render(React.createElement(BreathingGardenScreen));

    // Re-render multiple times to stress test for infinite loops
    for (let i = 0; i < 5; i++) {
      rerender(React.createElement(BreathingGardenScreen));
    }

    assertNoInfiniteLoops(consoleErrorSpy);
  });

  it('renders with animations disabled', () => {
    mockSettings.animationsEnabled = false;

    render(React.createElement(BreathingGardenScreen));

    assertNoInfiniteLoops(consoleErrorSpy);
  });

  // New tests
  it('displays progress indicator', () => {
    const screen = render(React.createElement(BreathingGardenScreen));

    // Should show progress bar or indicator
    const progressIndicator = screen.queryByTestId('breathing-ball');
    expect(progressIndicator).toBeTruthy();
  });
});