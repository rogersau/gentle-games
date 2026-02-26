import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { GlitterScreen } from './GlitterScreen';

const mockGoBack = jest.fn();
const mockAddGlitter = jest.fn();
const mockClearGlitter = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../components/GlitterGlobe', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const GlitterGlobe = React.forwardRef((_props: unknown, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      addGlitter: (count?: number) => mockAddGlitter(count),
      clearGlitter: () => mockClearGlitter(),
    }));
    return (
      <View>
        <Text>Mock Globe</Text>
      </View>
    );
  });

  return { GlitterGlobe };
});

describe('GlitterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('goes back when back button is pressed', () => {
    const screen = render(<GlitterScreen />);
    fireEvent.press(screen.getByText('←'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('calls globe controls from the action buttons', () => {
    const screen = render(<GlitterScreen />);

    fireEvent.press(screen.getByText('⭐ Sprinkle'));
    fireEvent.press(screen.getByText('🧹 Clear'));

    expect(mockAddGlitter).toHaveBeenCalledWith(12);
    expect(mockClearGlitter).toHaveBeenCalledTimes(1);
  });
});
