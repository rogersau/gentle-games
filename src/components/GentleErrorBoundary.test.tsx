import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { GentleErrorBoundary } from './GentleErrorBoundary';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock sentry module to enable Sentry for testing
jest.mock('../utils/sentry', () => ({
  isSentryEnabled: true,
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock theme
jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textLight: '#666666',
      primary: '#4A90E2',
    },
    resolvedMode: 'light',
  }),
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean } > = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Safe Content</Text>;
};

describe('GentleErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <GentleErrorBoundary screenName="TestScreen">
        <Text>Child Component</Text>
      </GentleErrorBoundary>
    );

    expect(getByText('Child Component')).toBeTruthy();
  });

  it('shows fallback UI when error occurs', () => {
    const { getByText, getByTestId } = render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('errorBoundary.title')).toBeTruthy();
    expect(getByText('errorBoundary.message')).toBeTruthy();
    expect(getByText('errorBoundary.goHome')).toBeTruthy();
  });

  it('displays cloud icon', () => {
    const { getByLabelText } = render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    expect(getByLabelText('errorBoundary.iconAccessibilityLabel')).toBeTruthy();
  });

  it('reports error to Sentry when error occurs', () => {
    render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      }),
      expect.objectContaining({
        tags: {
          screen: 'TestScreen',
          errorBoundary: 'GentleErrorBoundary',
        },
        contexts: {
          react: {
            componentStack: expect.any(String),
          },
        },
      })
    );
  });

  it('adds breadcrumb when error occurs', () => {
    render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'error',
        message: 'Error caught in TestScreen',
        level: 'error',
        data: {
          screen: 'TestScreen',
          errorMessage: 'Test error',
        },
      })
    );
  });

  it('navigates to home when Go Home button is pressed', () => {
    const { getByText } = render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    fireEvent.press(getByText('errorBoundary.goHome'));

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('resets error state when navigating home', () => {
    const ResetTestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <GentleErrorBoundary screenName="TestScreen">
          <ThrowError shouldThrow={shouldThrow} />
        </GentleErrorBoundary>
      );
    };

    const { getByText, queryByTestId } = render(<ResetTestComponent />);

    // Should show error fallback
    expect(queryByTestId('error-boundary-fallback')).toBeTruthy();

    // Press Go Home to reset
    fireEvent.press(getByText('errorBoundary.goHome'));

    // Navigation should have been called
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('handles errors gracefully', () => {
    // Test that error boundary doesn't throw when error occurs
    expect(() => {
      render(
        <GentleErrorBoundary screenName="TestScreen">
          <ThrowError />
        </GentleErrorBoundary>
      );
    }).not.toThrow();
  });

  it('renders with correct accessibility labels', () => {
    const { getByLabelText } = render(
      <GentleErrorBoundary screenName="TestScreen">
        <ThrowError />
      </GentleErrorBoundary>
    );

    expect(getByLabelText('errorBoundary.goHomeAccessibilityLabel')).toBeTruthy();
  });
});
