import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '../components/GameBoard';
import { AppScreen, AppHeader, AppModal, AppButton, MochiPresence } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useThemeColors } from '../utils/theme';
import { useMochi } from '../hooks/useMochi';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const { celebrate, showMochi, hideMochi } = useMochi();
  const [showIntro, setShowIntro] = useState(true);

  React.useEffect(() => {
    showMochi('mascot.letsMatch', 'idle');
  }, [showMochi]);

  const handleGameComplete = (_time: number) => {
    celebrate();
  };

  const handleBackPress = () => {
    hideMochi();
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
          renderStats={({ time, moves }) => (
            <Text
              style={[styles.stats, { color: colors.text }]}
              accessibilityLabel={`Time ${time}, ${moves} moves`}
              testID="memory-snap-stats"
            >
              Time: {time} · Moves: {moves}
            </Text>
          )}
        />

        {/* In-game Mochi (small, bottom-right corner) */}
        <MochiPresence
          size="sm"
          style={styles.mochiInGame}
        />

        <AppModal
          visible={showIntro}
          onClose={() => { setShowIntro(false); hideMochi(); }}
          showClose={false}
        >
          <MochiPresence size="md" />
          <AppButton
            label={t("common.play")}
            variant="primary"
            onPress={() => setShowIntro(false)}
          />
        </AppModal>
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
  mochiInGame: {
    position: 'absolute',
    bottom: Space.lg,
    right: Space.lg,
  },
});
