import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GentleErrorBoundary } from './GentleErrorBoundary';
import { captureScreenError } from '../utils/sentry';

jest.mock('../utils/sentry', () => ({
  captureScreenError: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
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
      <GentleErrorBoundary screenName="Settings">
        <ThrowError />
      </GentleErrorBoundary>,
    );

    expect(captureScreenError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Boundary should not forward this text',
      }),
      {
        screen: 'Settings',
        boundary: 'GentleErrorBoundary',
      },
    );
  });

  it('still renders fallback UI after reporting through the wrapper', () => {
    const { getByTestId, getByText } = render(
      <GentleErrorBoundary screenName="Home">
        <ThrowError />
      </GentleErrorBoundary>,
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('errorBoundary.title')).toBeTruthy();
    expect(captureScreenError).toHaveBeenCalled();
  });
});
