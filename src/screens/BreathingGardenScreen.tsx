import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';
import { BreathingBall, BreathingBallRef, BallColorScheme } from '../components/BreathingBall';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const getColorSchemes = (colors: ThemeColors): BallColorScheme[] => [
  { primary: colors.primary, accent: colors.secondary, name: 'Ocean' },
  { primary: colors.secondary, accent: colors.primary, name: 'Rose' },
  { primary: colors.primary, accent: colors.background, name: 'Mint' },
  { primary: colors.secondary, accent: colors.background, name: 'Sunset' },
  { primary: colors.background, accent: colors.primary, name: 'Lavender' },
];

export const BreathingGardenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const colorSchemes = React.useMemo(() => getColorSchemes(colors as ThemeColors), [colors]);
  const [colorIndex, setColorIndex] = useState(0);
  const ballColors = colorSchemes[colorIndex];
  const styles = React.useMemo(() => createStyles(colors as ThemeColors), [colors]);
  const ballRef = useRef<BreathingBallRef>(null);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycles, setCycles] = useState(0);

  const cycleColors = () => {
    setColorIndex((prev) => (prev + 1) % colorSchemes.length);
  };

  const resetSession = () => {
    ballRef.current?.reset();
  };

  return (
    <AppScreen>
      <AppHeader title={t('games.breathingGarden.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <AppCard variant="elevated" style={styles.breathCard}>
          <Text style={styles.phaseLabel}>{phase === 'inhale' ? t('games.breathingGarden.inhale') : t('games.breathingGarden.exhale')}</Text>
          <View style={styles.ballContainer}>
            <BreathingBall
              ref={ballRef}
              size={250}
              colorScheme={ballColors}
              autoStart={true}
              onPhaseChange={setPhase}
              onCycleComplete={setCycles}
            />
          </View>
        </AppCard>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{t('games.breathingGarden.cycles', { count: cycles })}</Text>
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            label={t('games.breathingGarden.changeColor', { color: ballColors.name })}
            onPress={cycleColors}
            variant="secondary"
            style={styles.actionButton}
          />
          <AppButton
            label={t('games.breathingGarden.resetSession')}
            onPress={resetSession}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.lg,
      paddingTop: Space.base,
      paddingBottom: Space.lg,
    },
    breathCard: {
      width: '100%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Space.lg,
      gap: Space.base,
    },
    phaseLabel: {
      ...TypeStyle.h3,
      color: colors.text,
      textAlign: 'center',
    },
    ballContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 250,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Space.lg,
      marginBottom: Space.base,
    },
    statText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
    },
    actionsRow: {
      width: '100%',
      gap: Space.sm,
    },
    actionButton: {
      width: '100%',
    },
  });
