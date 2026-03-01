import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import { initializeSounds, unloadSounds } from './src/utils/sounds';
import { installPwaBackNavigationGuard } from './src/utils/pwaBackGuard';
import { useThemeColors } from './src/utils/theme';
import { useFonts } from './src/ui/fonts';

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
        </Stack.Navigator>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  const { fontsLoaded, fontError } = useFonts();

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFEF7' }}>
        <ActivityIndicator size="large" color="#A8D8EA" />
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
