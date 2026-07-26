import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '../components/GameBoard';
import { AppScreen, AppHeader } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useThemeColors } from '../utils/theme';
import { useMochi } from '../hooks/useMochi';
import { useSettings } from '../context/SettingsContext';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const { celebrate } = useMochi();
  const { settings } = useSettings();
  const { showPressureMetrics } = getGamePresentationPolicy(settings);

  const handleGameComplete = (_time: number) => {
    celebrate();
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
          onBackPress={handleBackPress}
          bottomInset={insets.bottom}
          onPositiveEvent={celebrate}
          renderStats={showPressureMetrics ? ({ time, moves }) => (
            <Text
              style={[styles.stats, { color: colors.text }]}
              accessibilityLabel={`${t('games.memorySnap.timeLabel', { time })}, ${t(
                'games.memorySnap.moves',
                { count: moves },
              )}`}
              testID='memory-snap-stats'
            >
              {t('games.memorySnap.timeLabel', { time })} ·{' '}
              {t('games.memorySnap.moves', { count: moves })}
            </Text>
          ) : () => null}
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
