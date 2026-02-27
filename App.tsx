import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './src/context/SettingsContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DrawingScreen } from './src/screens/DrawingScreen';
import { GlitterScreen } from './src/screens/GlitterScreen';
import { BubbleScreen } from './src/screens/BubbleScreen';
import { initializeSounds, unloadSounds } from './src/utils/sounds';
import { useThemeColors } from './src/utils/theme';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { resolvedMode } = useThemeColors();

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Drawing" component={DrawingScreen} />
          <Stack.Screen name="Glitter" component={GlitterScreen} />
          <Stack.Screen name="Bubble" component={BubbleScreen} />
        </Stack.Navigator>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  useEffect(() => {
    initializeSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
