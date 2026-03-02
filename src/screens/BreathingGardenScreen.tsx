import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';
import { BreathingBall, BallColorScheme } from '../components/BreathingBall';
import { useThemeColors } from '../utils/theme';
import { useBackgroundMusic } from '../utils/music';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const { width: screenWidth } = Dimensions.get('window');
const BALL_SIZE = Math.min(250, screenWidth * 0.5);

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
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [displayedPhase, setDisplayedPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycles, setCycles] = useState(0);
  const [progress, setProgress] = useState(0);
  const countOpacity = useRef(new Animated.Value(0)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const [currentCount, setCurrentCount] = useState(0);

  // Handle phase transitions with fade animation
  useEffect(() => {
    if (phase !== displayedPhase) {
      // Fade out
      Animated.timing(phaseOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Change text after fade out
        setDisplayedPhase(phase);
        // Fade in
        Animated.timing(phaseOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [phase, displayedPhase, phaseOpacity]);

  // Calculate count (1-4) during both inhale and exhale based on progress
  useEffect(() => {
    // Map 0-1 progress to count 1-4 for both phases
    const count = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
    setCurrentCount(count);
    
    // Fade in
    Animated.timing(countOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [phase, progress, countOpacity]);

  const cycleColors = () => {
    setColorIndex((prev) => (prev + 1) % colorSchemes.length);
  };

  const { isPlaying, toggleMusic, stopMusic } = useBackgroundMusic();

  // Stop music when leaving the screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopMusic();
      };
    }, [stopMusic])
  );

  return (
    <AppScreen>
      <AppHeader title={t('games.breathingGarden.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <AppCard variant="elevated" style={styles.breathCard}>
          <Animated.Text style={[styles.phaseLabel, { opacity: phaseOpacity }]}>
            {displayedPhase === 'inhale' ? t('games.breathingGarden.inhale') : t('games.breathingGarden.exhale')}
          </Animated.Text>
          <View style={styles.ballContainer}>
            <BreathingBall
              size={BALL_SIZE}
              colorScheme={ballColors}
              autoStart={true}
              onPhaseChange={setPhase}
              onCycleComplete={setCycles}
              onProgress={setProgress}
            />
            <Animated.Text style={[styles.countText, { opacity: countOpacity }]}>
              {currentCount > 0 ? currentCount : ''}
            </Animated.Text>
          </View>
        </AppCard>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{t('games.breathingGarden.cycles', { count: cycles })}</Text>
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            label={t('games.breathingGarden.changeColor', { color: ballColors.name })}
            onPress={cycleColors}
            variant="primary"
            style={styles.colorButton}
          />
          <AppButton
            label={isPlaying ? t('games.breathingGarden.musicOff') : t('games.breathingGarden.musicOn')}
            onPress={toggleMusic}
            variant="secondary"
            style={styles.musicButton}
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
      minHeight: BALL_SIZE,
    },
    countText: {
      ...TypeStyle.h1,
      color: colors.text,
      marginTop: Space.lg,
      textAlign: 'center',
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
      flexDirection: 'row',
      gap: Space.sm,
      justifyContent: 'center',
      maxWidth: 600,
      alignSelf: 'center',
    },
    colorButton: {
      flex: 1,
      maxWidth: 300,
    },
    musicButton: {
      flex: 1,
      maxWidth: 300,
    },
  });
