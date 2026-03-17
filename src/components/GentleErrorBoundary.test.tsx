import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GentleErrorBoundary } from './GentleErrorBoundary';
import { APP_ROUTES } from '../types/navigation';
import { captureScreenError } from '../utils/sentry';

const mockNavigate = jest.fn();

jest.mock('../utils/sentry', () => ({
  captureScreenError: jest.fn(),
}));

jest.mock('../ui/components', () => {
  const React = require('react');
  const ReactNative = require('react-native');

  return {
    AppButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <ReactNative.Pressable onPress={onPress}>
        <ReactNative.Text>{label}</ReactNative.Text>
      </ReactNative.Pressable>
    ),
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textLight: '#666666',
      primary: '#4A90E2',
    },
  }),
}));

const ThrowError: React.FC = () => {
  throw new Error('Boundary should not forward this text');
};

describe('GentleErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('routes boundary reporting through the shared capture helper without raw component stacks', () => {
    render(
      <GentleErrorBoundary screenName={APP_ROUTES.Settings}>
        <ThrowError />
      </GentleErrorBoundary>,
    );

    expect(captureScreenError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Boundary should not forward this text',
      }),
      {
        screen: APP_ROUTES.Settings,
        boundary: 'GentleErrorBoundary',
      },
    );
  });

  it('still renders fallback UI after reporting through the wrapper', () => {
    const { getByTestId, getByText } = render(
      <GentleErrorBoundary screenName={APP_ROUTES.Home}>
        <ThrowError />
      </GentleErrorBoundary>,
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('errorBoundary.title')).toBeTruthy();
    expect(captureScreenError).toHaveBeenCalled();
  });

  it('navigates back to the shared Home route from the fallback', () => {
    const { getByText } = render(
      <GentleErrorBoundary screenName={APP_ROUTES.Home}>
        <ThrowError />
      </GentleErrorBoundary>,
    );

    fireEvent.press(getByText('errorBoundary.goHome'));

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Home);
  });
});
