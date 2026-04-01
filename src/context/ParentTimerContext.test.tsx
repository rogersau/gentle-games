import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ParentTimerProvider, useParentTimer } from './ParentTimerContext';

// Mock SettingsContext
const mockSettings = {
  parentTimerMinutes: 1, // 1 minute for testing
  animationsEnabled: true,
};

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
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
      cardFront: '#FFFFFF',
      cardBack: '#F0F0F0',
      secondary: '#E74C3C',
    },
    resolvedMode: 'light',
  }),
}));

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { secondsRemaining, isLocked } = useParentTimer();

  return (
    <View>
      <Text testID='seconds'>{secondsRemaining}</Text>
      <Text testID='locked'>{isLocked ? 'locked' : 'unlocked'}</Text>
    </View>
  );
};

describe('ParentTimerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSettings.parentTimerMinutes = 1;
    mockSettings.animationsEnabled = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with correct timer value based on settings', () => {
    const { getByTestId } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    expect(getByTestId('seconds').props.children).toBe(60);
    expect(getByTestId('locked').props.children).toBe('unlocked');
  });

  it('initializes with 0 when timer is disabled', () => {
    mockSettings.parentTimerMinutes = 0;

    const { getByTestId } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    expect(getByTestId('seconds').props.children).toBe(0);
  });

  it('counts down every second', () => {
    const { getByTestId } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    expect(getByTestId('seconds').props.children).toBe(60);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByTestId('seconds').props.children).toBe(59);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByTestId('seconds').props.children).toBe(57);
  });

  it('locks screen when timer reaches zero', () => {
    const { getByTestId } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    expect(getByTestId('locked').props.children).toBe('unlocked');

    // Advance timer to 0
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(getByTestId('locked').props.children).toBe('locked');
    expect(getByTestId('seconds').props.children).toBe(0);
  });

  it('stops countdown when screen is locked', () => {
    const { getByTestId } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    // Lock the screen
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(getByTestId('locked').props.children).toBe('locked');
    expect(getByTestId('seconds').props.children).toBe(0);

    // Timer should not go negative
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByTestId('seconds').props.children).toBe(0);
  });

  it('resets timer when parentTimerMinutes setting changes', () => {
    const { getByTestId, rerender } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    // Advance timer partially
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(getByTestId('seconds').props.children).toBe(30);

    // Change settings to 2 minutes
    mockSettings.parentTimerMinutes = 2;

    rerender(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    expect(getByTestId('seconds').props.children).toBe(120);
    expect(getByTestId('locked').props.children).toBe('unlocked');
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    unmount();

    // Should not throw or cause issues
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });

  it('displays unlock modal when locked', () => {
    const { getByText, queryByText } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    // Should not show lock screen initially
    expect(queryByText('parentTimer.lockTitle')).toBeNull();

    // Lock the screen
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should now show lock screen
    expect(getByText('parentTimer.lockTitle')).toBeTruthy();
    expect(getByText('parentTimer.lockSubtitle')).toBeTruthy();
    expect(getByText('parentTimer.challengeLabel')).toBeTruthy();
  });

  it('shows math challenge in lock screen', () => {
    const { getByText } = render(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    // Lock the screen
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should show a math problem
    const mathProblem = getByText(/\d+ [+−] \d+ = \?/);
    expect(mathProblem).toBeTruthy();
  });
});
