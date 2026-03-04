import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';
import { BreathingBall, BallColorScheme } from '../components/BreathingBall';
import { useThemeColors } from '../utils/theme';
import { useBackgroundMusic } from '../utils/music';
import { useSettings } from '../context/SettingsContext';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const { width: screenWidth } = Dimensions.get('window');
const BALL_SIZE = Math.min(250, screenWidth * 0.5);

// Calming, sensory-friendly color schemes that match their names
const getColorSchemes = (): BallColorScheme[] => [
  { primary: '#B4D7E8', accent: '#7FB3D5', name: 'Ocean' },      // Soft blues like calm water
  { primary: '#F5C6D6', accent: '#E8A4C9', name: 'Rose' },       // Gentle pinks
  { primary: '#C8E6C9', accent: '#A5D6A7', name: 'Mint' },       // Fresh soft greens
  { primary: '#FFE0B2', accent: '#FFCC80', name: 'Sunset' },     // Warm soft orange/peach
  { primary: '#E1BEE7', accent: '#CE93D8', name: 'Lavender' },   // Soft purples
];

export const BreathingGardenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const colorSchemes = React.useMemo(() => getColorSchemes(), []);
  const [colorIndex, setColorIndex] = useState(0);
  const ballColors = colorSchemes[colorIndex];
  const styles = React.useMemo(() => createStyles(colors as ThemeColors), [colors]);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [displayedPhase, setDisplayedPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [breaths, setBreaths] = useState(0);
  const [progress, setProgress] = useState(0);
  const countOpacity = useRef(new Animated.Value(0)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const [currentCount, setCurrentCount] = useState(0);

  // Handle phase transitions with fade animation
  useEffect(() => {
    if (phase !== displayedPhase) {
      if (settings.animationsEnabled) {
        // Fade out
        Animated.timing(phaseOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          // Change text after fade out
          setDisplayedPhase(phase);
          // Fade in
          Animated.timing(phaseOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        });
      } else {
        // Instant transition
        setDisplayedPhase(phase);
        phaseOpacity.setValue(1);
      }
    }
    // Note: phaseOpacity is a ref and should not be in deps to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, displayedPhase, settings.animationsEnabled]);

  // Calculate count (1-4) during both inhale and exhale based on progress
  useEffect(() => {
    // Map 0-1 progress to count 1-4 for both phases
    const count = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
    setCurrentCount(count);

    if (settings.animationsEnabled) {
      // Fade in
      Animated.timing(countOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      countOpacity.setValue(1);
    }
    // Note: countOpacity is a ref and should not be in deps to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, progress, settings.animationsEnabled]);

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
              onCycleComplete={setBreaths}
              onProgress={setProgress}
            />
            <Animated.Text style={[styles.countText, { opacity: countOpacity }]}>
              {currentCount > 0 ? currentCount : ''}
            </Animated.Text>
          </View>
        </AppCard>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{t('games.breathingGarden.breaths', { count: breaths })}</Text>
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            label={t('games.breathingGarden.changeColor')}
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
