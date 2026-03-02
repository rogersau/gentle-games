import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '../components/GameBoard';
import { AppScreen, AppHeader } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useThemeColors } from '../utils/theme';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { t } = useTranslation();

  const handleGameComplete = (_time: number) => {
    // Extension point for future analytics
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <AppScreen>
      <AppHeader title={t('games.memorySnap.title')} onBack={handleBackPress} />
      <View style={styles.content}>
        <GameBoard
          onGameComplete={handleGameComplete}
          bottomInset={insets.bottom}
          renderStats={({ time, moves }) => (
            <Text
              style={[styles.stats, { color: colors.text }]}
              accessibilityLabel={`Time ${time}, ${moves} moves`}
            >
              Time: {time} · Moves: {moves}
            </Text>
          )}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingTop: Space.base,
    paddingBottom: Space.md,
  },
  stats: {
    ...TypeStyle.label,
    marginBottom: Space.md,
  },
});
