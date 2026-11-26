import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '../components/GameBoard';
import { SegmentedControl } from '../ui/components';
import { GameShell } from '../ui/components/GameShell';
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
  const memorySettings = getGameSettings(settings, 'memory-snap');
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);

  const handleGameComplete = (_time: number) => {
    celebrate();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <GameBoard
      renderShell={(prompt, action, board) => (
        <GameShell
          title={t('games.memorySnap.title')}
          prompt={prompt}
          onHome={handleBackPress}
          actions={action}
          more={(close) => (
            <>
              <Text style={[styles.instruction, { color: colors.text }]}>
                {t('games.memorySnap.chooseBoard')}
              </Text>
              <Text style={[TypeStyle.body, { color: colors.textLight }]}>
                {t('games.memorySnap.boardChangeHint')}
              </Text>
              <SegmentedControl
                wrap
                options={([2, 3, 4, 6, 10, 15] as MemorySnapPairCount[]).map((value) => ({
                  value,
                  label: t('games.memorySnap.boardSize', { count: value }),
                  testID: `memory-pairs-${value}`,
                }))}
                value={memorySettings.pairCount}
                onValueChange={(pairCount) => {
                  if (pairCount !== memorySettings.pairCount)
                    void updateGameSettings('memory-snap', { pairCount });
                  close();
                }}
              />
            </>
          )}
        >
          {board}
        </GameShell>
      )}
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
  );
};

const styles = StyleSheet.create({
  instruction: { ...TypeStyle.body, textAlign: 'center', marginBottom: Space.md },
  stats: {
    ...TypeStyle.label,
    marginBottom: Space.md,
  },
});
