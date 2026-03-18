import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppContent } from './App';
import { useSettings } from './src/context/SettingsContext';
import { APP_ROUTES } from './src/types/navigation';
import { trackScreenView } from './src/utils/analytics';
import { reconcileObservability } from './src/utils/observabilityBootstrap';

const mockNavigationContainer = jest.fn();
const renderedScreenNames: string[] = [];

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
  NavigationContainer: (props: { children: React.ReactNode }) => {
    mockNavigationContainer(props);
    return props.children;
  },
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => {
    return {
      Navigator: ({ children }: { children: React.ReactNode }) => children,
      Screen: ({ name, children }: { name: string; children: () => React.ReactNode }) => {
        renderedScreenNames.push(name);
        return children();
      },
    };
  },
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
const mockedTrackScreenView = jest.mocked(trackScreenView);
const mockedReconcileObservability = jest.mocked(reconcileObservability);

const createSettingsValue = (overrides?: Partial<ReturnType<typeof useSettings>>) => ({
  settings: {
    animationsEnabled: true,
    soundEnabled: true,
    soundVolume: 0.5,
    difficulty: 'medium' as const,
    theme: 'mixed' as const,
    showCardPreview: true,
    keepyUppyEasyMode: true,
    colorMode: 'system' as const,
    hiddenGames: [],
    parentTimerMinutes: 0,
    enableUnfinishedGames: true,
    language: 'en-US',
    reducedMotionEnabled: false,
    telemetryEnabled: false,
    ...overrides?.settings,
  },
  updateSettings: jest.fn(),
  isLoading: false,
  ...overrides,
});

describe('AppContent observability bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    renderedScreenNames.length = 0;
    mockedUseSettings.mockReturnValue(createSettingsValue());
  });

  it('does not reconcile observability until settings finish loading, then reconciles once when ready', async () => {
    let currentSettings = createSettingsValue({
      isLoading: true,
      settings: {
        telemetryEnabled: true,
      },
    });
    mockedUseSettings.mockImplementation(() => currentSettings);

    const { queryByTestId, rerender, getByTestId } = render(<AppContent />);

    expect(mockedReconcileObservability).not.toHaveBeenCalled();
    expect(queryByTestId('app-shell')).toBeNull();

    currentSettings = createSettingsValue({
      isLoading: false,
      settings: {
        telemetryEnabled: true,
      },
    });

    rerender(<AppContent />);

    await waitFor(() => {
      expect(mockedReconcileObservability).toHaveBeenCalledTimes(1);
      expect(mockedReconcileObservability).toHaveBeenCalledWith(true);
    });

    rerender(<AppContent />);

    expect(mockedReconcileObservability).toHaveBeenCalledTimes(1);
    expect(getByTestId('app-shell')).toBeTruthy();
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

  it('reconciles disabled startup first and then enabled telemetry after consent changes', async () => {
    let currentSettings = createSettingsValue({
      settings: {
        telemetryEnabled: false,
      },
    });
    mockedUseSettings.mockImplementation(() => currentSettings);

    const { rerender, getByTestId } = render(<AppContent />);

    await waitFor(() => {
      expect(mockedReconcileObservability).toHaveBeenNthCalledWith(1, false);
    });

    currentSettings = createSettingsValue({
      settings: {
        telemetryEnabled: true,
      },
    });

    rerender(<AppContent />);

    await waitFor(() => {
      expect(mockedReconcileObservability).toHaveBeenCalledTimes(2);
      expect(mockedReconcileObservability).toHaveBeenNthCalledWith(2, true);
    });

    expect(getByTestId('app-shell')).toBeTruthy();
  });

  it('anchors stack screens and route tracking to the shared app route contract', () => {
    render(<AppContent />);

    expect(renderedScreenNames).toEqual(Object.values(APP_ROUTES));

    const navigationContainerProps = mockNavigationContainer.mock.calls.at(-1)?.[0];
    expect(navigationContainerProps).toBeTruthy();

    navigationContainerProps?.onStateChange?.({
      index: 0,
      routes: [{ key: 'home', name: APP_ROUTES.Home }],
    });
    navigationContainerProps?.onStateChange?.({
      index: 0,
      routes: [{ key: 'unknown', name: 'SurpriseRoute' }],
    });
    navigationContainerProps?.onStateChange?.({
      index: 0,
      routes: [{ key: 'settings', name: APP_ROUTES.Settings }],
    });

    expect(mockedTrackScreenView).toHaveBeenCalledTimes(2);
    expect(mockedTrackScreenView).toHaveBeenNthCalledWith(1, APP_ROUTES.Home);
    expect(mockedTrackScreenView).toHaveBeenNthCalledWith(2, APP_ROUTES.Settings);
  });
});
