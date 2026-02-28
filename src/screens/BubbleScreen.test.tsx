import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BubbleScreen } from './BubbleScreen';

const mockGoBack = jest.fn();
const mockPlayBubblePopSound = jest.fn();
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
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../utils/sounds', () => ({
  playBubblePopSound: (...args: unknown[]) => mockPlayBubblePopSound(...args),
}));

jest.mock('../components/BubbleField', () => {
  const React = require('react');
  const { Text, TouchableOpacity, View } = require('react-native');

  return {
    BubbleField: ({ onBubblePop }: { onBubblePop?: () => void }) => (
      <View>
        <Text>Mock Bubble Field</Text>
        <TouchableOpacity onPress={onBubblePop}>
          <Text>Pop Mock Bubble</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('BubbleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('goes back when the back button is pressed', () => {
    const screen = render(<BubbleScreen />);
    fireEvent.press(screen.getByText('← Back'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('increments popped count when bubble field reports a pop', () => {
    const screen = render(<BubbleScreen />);

    expect(screen.getByText('Popped: 0')).toBeTruthy();
    fireEvent.press(screen.getByText('Pop Mock Bubble'));
    expect(screen.getByText('Popped: 1')).toBeTruthy();
    expect(mockPlayBubblePopSound).toHaveBeenCalledWith(mockSettings);
  });
});

