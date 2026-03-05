import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppScreen } from './AppScreen';

jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

describe('AppScreen', () => {
  it('renders children in non-scroll mode', () => {
    const { getByText } = render(
      <AppScreen>
        <Text>Test Content</Text>
      </AppScreen>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders children in scroll mode', () => {
    const { getByText } = render(
      <AppScreen scroll>
        <Text>Scrollable Content</Text>
      </AppScreen>
    );
    expect(getByText('Scrollable Content')).toBeTruthy();
  });

  it('applies custom testID', () => {
    const { getByTestId } = render(
      <AppScreen testID="screen-test">
        <Text>Content</Text>
      </AppScreen>
    );
    expect(getByTestId('screen-test')).toBeTruthy();
  });

  it('renders with custom edges', () => {
    const { getByText } = render(
      <AppScreen edges={['top']} testID="screen-edges">
        <Text>Content with custom edges</Text>
      </AppScreen>
    );
    expect(getByText('Content with custom edges')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByTestId } = render(
      <AppScreen testID="screen-style" style={{ padding: 20 }}>
        <Text>Styled Content</Text>
      </AppScreen>
    );
    expect(getByTestId('screen-style')).toBeTruthy();
  });

  it('applies content container style in scroll mode', () => {
    const { getByText } = render(
      <AppScreen scroll contentContainerStyle={{ padding: 10 }}>
        <Text>Content with container style</Text>
      </AppScreen>
    );
    expect(getByText('Content with container style')).toBeTruthy();
  });

  it('handles multiple children', () => {
    const { getByText } = render(
      <AppScreen>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
        <Text>Child 3</Text>
      </AppScreen>
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    expect(getByText('Child 3')).toBeTruthy();
  });

  it('renders on web platform', () => {
    const originalOS = require('react-native').Platform.OS;
    Object.defineProperty(require('react-native').Platform, 'OS', { value: 'web' });

    const { getByText } = render(
      <AppScreen>
        <Text>Web Content</Text>
      </AppScreen>
    );
    expect(getByText('Web Content')).toBeTruthy();

    Object.defineProperty(require('react-native').Platform, 'OS', { value: originalOS });
  });

  it('renders scroll mode on web platform', () => {
    const originalOS = require('react-native').Platform.OS;
    Object.defineProperty(require('react-native').Platform, 'OS', { value: 'web' });

    const { getByText } = render(
      <AppScreen scroll>
        <Text>Web Scroll Content</Text>
      </AppScreen>
    );
    expect(getByText('Web Scroll Content')).toBeTruthy();

    Object.defineProperty(require('react-native').Platform, 'OS', { value: originalOS });
  });
});