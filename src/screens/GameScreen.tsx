import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameBoard } from '../components/GameBoard';
import { AppScreen } from '../ui/components';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGameComplete = (_time: number) => {
    // Extension point for future analytics
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <AppScreen>
      <View style={styles.content}>
        <GameBoard
          onGameComplete={handleGameComplete}
          onBackPress={handleBackPress}
          bottomInset={insets.bottom}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
