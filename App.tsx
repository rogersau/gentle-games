import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';
// Initialize i18n before app renders
import './src/i18n';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { ParentTimerProvider } from './src/context/ParentTimerContext';
import { MochiProvider } from './src/context/MochiContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DrawingScreen } from './src/screens/DrawingScreen';
import { GlitterScreen } from './src/screens/GlitterScreen';
import { BubbleScreen } from './src/screens/BubbleScreen';
import { CategoryMatchScreen } from './src/screens/CategoryMatchScreen';
import { KeepyUppyScreen } from './src/screens/KeepyUppyScreen';
import { BreathingGardenScreen } from './src/screens/BreathingGardenScreen';
import { PatternTrainScreen } from './src/screens/PatternTrainScreen';
import { NumberPicnicScreen } from './src/screens/NumberPicnicScreen';
import { initializeSounds, unloadSounds } from './src/utils/sounds';
import { installPwaBackNavigationGuard } from './src/utils/pwaBackGuard';
import { getPostHogClient, trackScreenView } from './src/utils/analytics';
import { PASTEL_COLORS } from './src/types';
import { useThemeColors } from './src/utils/theme';
import { useFonts } from './src/ui/fonts';
import { GentleErrorBoundary } from './src/components/GentleErrorBoundary';
import { installPwaInteractionGuards } from './src/utils/pwaInteractionGuards';
import { reconcileObservability } from './src/utils/observabilityBootstrap';
import { APP_ROUTES, AppRouteName, AppStackParamList, isAppRouteName } from './src/types/navigation';

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Unable to keep splash screen visible during app startup.', error);
});

const Stack = createStackNavigator<AppStackParamList>();

/**
 * Extract the active route name from the navigation state.
 */
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  // Dive into nested navigators
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

// Conditional PostHogProvider wrapper - only renders provider if client exists
const ConditionalPostHogProvider: React.FC<{ client: ReturnType<typeof getPostHogClient>; children: React.ReactNode }> = ({
  client,
  children,
}) => {
  if (!client) {
    // No PostHog client (no API key configured) - render children without provider
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      client={client}
      autocapture={{
        captureScreens: false, // We handle screen tracking manually for react-navigation v7+
        captureTouches: false, // Keep the UI uncluttered for accessibility
      }}
    >
      {children}
    </PostHogProvider>
  );
};

const AppNavigator: React.FC = () => {
  const { resolvedMode } = useThemeColors();
  const routeNameRef = useRef<AppRouteName | undefined>(undefined);
  const posthogClient = getPostHogClient();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const themeColor = resolvedMode === 'dark' ? '#2F333B' : '#FFFEF7';
      const metaTag = document.querySelector('meta[name="theme-color"]');
      if (metaTag) {
        metaTag.setAttribute('content', themeColor);
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = themeColor;
        document.head.appendChild(newMeta);
      }
    }
  }, [resolvedMode]);

  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    const currentRouteName = getActiveRouteName(state);
    const typedRouteName = isAppRouteName(currentRouteName) ? currentRouteName : undefined;
    const previousRouteName = routeNameRef.current;

    if (typedRouteName && typedRouteName !== previousRouteName) {
      trackScreenView(typedRouteName);
    }
    routeNameRef.current = typedRouteName;
  }, []);

  return (
    <>
      <NavigationContainer
        onStateChange={handleStateChange}
      >
        <ConditionalPostHogProvider client={posthogClient}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { flex: 1, minHeight: 0 },
            }}
          >
            <Stack.Screen name={APP_ROUTES.Home}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Home}>
                  <HomeScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.Game}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Game}>
                  <GameScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.Settings}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Settings}>
                  <SettingsScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.Drawing}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Drawing}>
                  <DrawingScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.Glitter}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Glitter}>
                  <GlitterScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.Bubble}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.Bubble}>
                  <BubbleScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.CategoryMatch}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.CategoryMatch}>
                  <CategoryMatchScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.KeepyUppy}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.KeepyUppy}>
                  <KeepyUppyScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.BreathingGarden}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.BreathingGarden}>
                  <BreathingGardenScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.PatternTrain}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.PatternTrain}>
                  <PatternTrainScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name={APP_ROUTES.NumberPicnic}>
              {() => (
                <GentleErrorBoundary screenName={APP_ROUTES.NumberPicnic}>
                  <NumberPicnicScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
          </Stack.Navigator>
          <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        </ConditionalPostHogProvider>
      </NavigationContainer>
    </>
  );
};

export const AppContent: React.FC = () => {
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void reconcileObservability(settings.telemetryEnabled).catch((error: unknown) => {
      console.warn(
        'Observability bootstrap failed. Continuing without analytics or crash reporting.',
        error,
      );
    });
  }, [isLoading, settings.telemetryEnabled]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PASTEL_COLORS.primary} />
      </View>
    );
  }

  return (
    <ParentTimerProvider>
      <MochiProvider>
        <AppNavigator />
      </MochiProvider>
    </ParentTimerProvider>
  );
};

export default function App() {
  const { fontsLoaded, fontError } = useFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Unable to hide splash screen after startup.', error);
      });
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initializeSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  useEffect(() => {
    return installPwaBackNavigationGuard();
  }, []);

  useEffect(() => {
    return installPwaInteractionGuards();
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PASTEL_COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PASTEL_COLORS.background,
  },
});
