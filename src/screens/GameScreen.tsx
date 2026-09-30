import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '../components/GameBoard';
import { AppScreen, GameHeader, AppButton, AppModal } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useThemeColors } from '../utils/theme';
import { useMochi } from '../hooks/useMochi';
import { useSettings } from '../context/SettingsContext';
import { getGameSettings, MemorySnapPairCount } from '../games/settings';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const { celebrate } = useMochi();
  const { settings, updateGameSettings } = useSettings();
  const [showBoardChoices, setShowBoardChoices] = useState(false);
  const memorySettings = getGameSettings(settings, 'memory-snap');
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);

  const handleGameComplete = (_time: number) => {
    celebrate();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <AppScreen
      scroll
      header={<GameHeader title={t('games.memorySnap.title')} onBack={handleBackPress} />}
    >
      <View style={styles.content}>
        <Text style={[styles.instruction, { color: colors.textLight }]}>
          {t('games.memorySnap.instruction')}
        </Text>
        <GameBoard
          onGameComplete={showMilestoneCelebrations ? handleGameComplete : () => undefined}
          onBackPress={handleBackPress}
          bottomInset={insets.bottom}
          onPositiveEvent={showMilestoneCelebrations ? celebrate : undefined}
          renderStats={
            showPressureMetrics
              ? ({ time, moves }) => (
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
                )
              : () => null
          }
        />
        <AppButton
          icon='cards'
          label={t('games.memorySnap.changeBoard')}
          variant='ghost'
          onPress={() => setShowBoardChoices(true)}
          testID='memory-change-board'
        />
      </View>
      <AppModal
        visible={showBoardChoices}
        onClose={() => setShowBoardChoices(false)}
        title={t('games.memorySnap.chooseBoard')}
      >
        <Text style={[styles.instruction, { color: colors.textLight }]}>
          {t('games.memorySnap.boardChangeHint')}
        </Text>
        <View style={styles.boardChoices}>
          {([2, 3, 4, 6, 10, 15] as MemorySnapPairCount[]).map((pairCount) => (
            <AppButton
              key={pairCount}
              label={t('games.memorySnap.boardSize', { count: pairCount })}
              variant={memorySettings.pairCount === pairCount ? 'primary' : 'ghost'}
              accessibilityState={{ selected: memorySettings.pairCount === pairCount }}
              onPress={() => {
                void updateGameSettings('memory-snap', { pairCount });
                setShowBoardChoices(false);
              }}
              testID={`memory-pairs-${pairCount}`}
            />
          ))}
        </View>
      </AppModal>
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
  instruction: { ...TypeStyle.body, textAlign: 'center', marginBottom: Space.md },
  boardChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, justifyContent: 'center' },
  stats: {
    ...TypeStyle.label,
    marginBottom: Space.md,
  },
});
