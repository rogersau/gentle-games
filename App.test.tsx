import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppContent } from './App';
import { useSettings } from './src/context/SettingsContext';
import { reconcileObservability } from './src/utils/observabilityBootstrap';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/i18n', () => ({}));

jest.mock('./src/context/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useSettings: jest.fn(),
}));

jest.mock('./src/context/ParentTimerContext', () => ({
  ParentTimerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./src/ui/fonts', () => ({
  useFonts: jest.fn(() => ({ fontsLoaded: true, fontError: null })),
}));

jest.mock('./src/utils/theme', () => ({
  useThemeColors: jest.fn(() => ({
    resolvedMode: 'light',
    colors: {
      background: '#ffffff',
      text: '#000000',
      textLight: '#666666',
      primary: '#4A90E2',
    },
  })),
}));

jest.mock('./src/utils/sounds', () => ({
  initializeSounds: jest.fn(),
  unloadSounds: jest.fn(),
}));

jest.mock('./src/utils/pwaBackGuard', () => ({
  installPwaBackNavigationGuard: jest.fn(() => jest.fn()),
}));

jest.mock('./src/utils/pwaInteractionGuards', () => ({
  installPwaInteractionGuards: jest.fn(() => jest.fn()),
}));

jest.mock('./src/utils/analytics', () => ({
  getPostHogClient: jest.fn(() => null),
  trackScreenView: jest.fn(),
}));

jest.mock('./src/utils/observabilityBootstrap', () => ({
  reconcileObservability: jest.fn(() => Promise.resolve()),
}));

jest.mock('posthog-react-native', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: () => React.ReactNode }) => children(),
  }),
}));

jest.mock('./src/components/GentleErrorBoundary', () => ({
  GentleErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./src/screens/HomeScreen', () => ({
  HomeScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text testID="app-shell">Home</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/GameScreen', () => ({
  GameScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>Game</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/SettingsScreen', () => ({
  SettingsScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>Settings</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/DrawingScreen', () => ({
  DrawingScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>Drawing</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/GlitterScreen', () => ({
  GlitterScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>Glitter</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/BubbleScreen', () => ({
  BubbleScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>Bubble</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/CategoryMatchScreen', () => ({
  CategoryMatchScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>CategoryMatch</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/KeepyUppyScreen', () => ({
  KeepyUppyScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>KeepyUppy</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/BreathingGardenScreen', () => ({
  BreathingGardenScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>BreathingGarden</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/PatternTrainScreen', () => ({
  PatternTrainScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>PatternTrain</ReactNative.Text>;
  },
}));

jest.mock('./src/screens/NumberPicnicScreen', () => ({
  NumberPicnicScreen: () => {
    const ReactNative = require('react-native');
    return <ReactNative.Text>NumberPicnic</ReactNative.Text>;
  },
}));

const mockedUseSettings = jest.mocked(useSettings);
const mockedReconcileObservability = jest.mocked(reconcileObservability);

describe('AppContent observability bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSettings.mockReturnValue({
      settings: {
        animationsEnabled: true,
        soundEnabled: true,
        soundVolume: 0.5,
        difficulty: 'medium',
        theme: 'mixed',
        showCardPreview: true,
        keepyUppyEasyMode: true,
        colorMode: 'system',
        hiddenGames: [],
        parentTimerMinutes: 0,
        enableUnfinishedGames: true,
        language: 'en-US',
        reducedMotionEnabled: false,
        telemetryEnabled: false,
      },
      updateSettings: jest.fn(),
      isLoading: false,
    });
  });

  it('does not reconcile observability until settings finish loading', () => {
    mockedUseSettings.mockReturnValue({
      settings: {
        animationsEnabled: true,
        soundEnabled: true,
        soundVolume: 0.5,
        difficulty: 'medium',
        theme: 'mixed',
        showCardPreview: true,
        keepyUppyEasyMode: true,
        colorMode: 'system',
        hiddenGames: [],
        parentTimerMinutes: 0,
        enableUnfinishedGames: true,
        language: 'en-US',
        reducedMotionEnabled: false,
        telemetryEnabled: true,
      },
      updateSettings: jest.fn(),
      isLoading: true,
    });

    const { queryByTestId } = render(<AppContent />);

    expect(mockedReconcileObservability).not.toHaveBeenCalled();
    expect(queryByTestId('app-shell')).toBeNull();
  });

  it('renders the app shell and reconciles with telemetry disabled', async () => {
    const { getByTestId } = render(<AppContent />);

    await waitFor(() => {
      expect(mockedReconcileObservability).toHaveBeenCalledWith(false);
    });

    expect(getByTestId('app-shell')).toBeTruthy();
  });

  it('logs a warning and keeps rendering when bootstrap fails', async () => {
    const warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockedReconcileObservability.mockRejectedValueOnce(new Error('bootstrap failed'));

    const { getByTestId } = render(<AppContent />);

    await waitFor(() => {
      expect(warningSpy).toHaveBeenCalledWith(
        'Observability bootstrap failed. Continuing without analytics or crash reporting.',
        expect.any(Error),
      );
    });

    expect(getByTestId('app-shell')).toBeTruthy();
    warningSpy.mockRestore();
  });
});
