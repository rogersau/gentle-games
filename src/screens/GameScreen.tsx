import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GameBoard } from '../components/GameBoard';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGameComplete = (time: number) => {
    // Game completion is handled within GameBoard
    // This callback can be used for analytics or additional features
    console.log('Game completed in:', time);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
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
