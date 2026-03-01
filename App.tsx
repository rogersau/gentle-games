import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { LetterLanternScreen } from './src/screens/LetterLanternScreen';
import { StarPathScreen } from './src/screens/StarPathScreen';
import { initializeSounds, unloadSounds } from './src/utils/sounds';
import { installPwaBackNavigationGuard } from './src/utils/pwaBackGuard';
import { PASTEL_COLORS } from './src/types';
import { useThemeColors } from './src/utils/theme';
import { useFonts } from './src/ui/fonts';

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Unable to keep splash screen visible during app startup.', error);
});

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { resolvedMode } = useThemeColors();

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { flex: 1, minHeight: 0 },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Drawing" component={DrawingScreen} />
          <Stack.Screen name="Glitter" component={GlitterScreen} />
          <Stack.Screen name="Bubble" component={BubbleScreen} />
          <Stack.Screen name="CategoryMatch" component={CategoryMatchScreen} />
          <Stack.Screen name="KeepyUppy" component={KeepyUppyScreen} />
          <Stack.Screen name="BreathingGarden" component={BreathingGardenScreen} />
          <Stack.Screen name="PatternTrain" component={PatternTrainScreen} />
          <Stack.Screen name="NumberPicnic" component={NumberPicnicScreen} />
          <Stack.Screen name="LetterLantern" component={LetterLanternScreen} />
          <Stack.Screen name="StarPath" component={StarPathScreen} />
        </Stack.Navigator>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
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
