import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '../components/GameBoard';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGameComplete = (_time: number) => {
    // Extension point for future analytics
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <GameBoard onGameComplete={handleGameComplete} onBackPress={handleBackPress} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  content: {
    flex: 1,
  },
});
