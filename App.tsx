import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';
// Initialize i18n before app renders
import './src/i18n';
import { SettingsProvider } from './src/context/SettingsContext';
import { ParentTimerProvider } from './src/context/ParentTimerContext';
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
import { initSentry } from './src/utils/sentry';
import { initAnalytics, getPostHogClient, trackScreenView } from './src/utils/analytics';
import { PASTEL_COLORS } from './src/types';
import { useThemeColors } from './src/utils/theme';
import { useFonts } from './src/ui/fonts';
import { GentleErrorBoundary } from './src/components/GentleErrorBoundary';

// Initialize Sentry and PostHog before React mounts (production only)
void initSentry().catch((error: unknown) => {
  console.warn('Sentry initialization failed. Continuing without error monitoring.', error);
});

void initAnalytics().catch((error: unknown) => {
  console.warn('PostHog initialization failed. Continuing without analytics.', error);
});

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Unable to keep splash screen visible during app startup.', error);
});

const Stack = createStackNavigator();

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

const AppNavigator: React.FC = () => {
  const { resolvedMode } = useThemeColors();
  const routeNameRef = useRef<string | undefined>(undefined);
  const posthogClient = getPostHogClient() ?? undefined;

  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    const currentRouteName = getActiveRouteName(state);
    const previousRouteName = routeNameRef.current;

    if (currentRouteName && currentRouteName !== previousRouteName) {
      trackScreenView(currentRouteName);
    }
    routeNameRef.current = currentRouteName;
  }, []);

  return (
    <>
      <NavigationContainer
        onStateChange={handleStateChange}
      >
        <PostHogProvider
          client={posthogClient}
          autocapture={{
            captureScreens: false, // We handle screen tracking manually for react-navigation v7+
            captureTouches: false, // Keep the UI uncluttered for accessibility
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { flex: 1, minHeight: 0 },
            }}
          >
            <Stack.Screen name="Home">
              {() => (
                <GentleErrorBoundary screenName="Home">
                  <HomeScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="Game">
              {() => (
                <GentleErrorBoundary screenName="Game">
                  <GameScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {() => (
                <GentleErrorBoundary screenName="Settings">
                  <SettingsScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="Drawing">
              {() => (
                <GentleErrorBoundary screenName="Drawing">
                  <DrawingScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="Glitter">
              {() => (
                <GentleErrorBoundary screenName="Glitter">
                  <GlitterScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="Bubble">
              {() => (
                <GentleErrorBoundary screenName="Bubble">
                  <BubbleScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="CategoryMatch">
              {() => (
                <GentleErrorBoundary screenName="CategoryMatch">
                  <CategoryMatchScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="KeepyUppy">
              {() => (
                <GentleErrorBoundary screenName="KeepyUppy">
                  <KeepyUppyScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="BreathingGarden">
              {() => (
                <GentleErrorBoundary screenName="BreathingGarden">
                  <BreathingGardenScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="PatternTrain">
              {() => (
                <GentleErrorBoundary screenName="PatternTrain">
                  <PatternTrainScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="NumberPicnic">
              {() => (
                <GentleErrorBoundary screenName="NumberPicnic">
                  <NumberPicnicScreen />
                </GentleErrorBoundary>
              )}
            </Stack.Screen>
          </Stack.Navigator>
          <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        </PostHogProvider>
      </NavigationContainer>
    </>
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
        <ParentTimerProvider>
          <AppNavigator />
        </ParentTimerProvider>
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
