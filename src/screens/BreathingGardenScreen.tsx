import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const colorSchemes = useMemo(() => getColorSchemes(), []);
  const [colorIndex, setColorIndex] = useState(0);
  const ballColors = colorSchemes[colorIndex];
  const styles = useMemo(() => createStyles(colors as ThemeColors), [colors]);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [displayedPhase, setDisplayedPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [breaths, setBreaths] = useState(0);
  const [progress, setProgress] = useState(0);
  const countOpacityRef = useRef(new Animated.Value(0));
  const phaseOpacityRef = useRef(new Animated.Value(1));
  const countAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const phaseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const phaseTransitionRef = useRef(0);
  const latestPhaseRef = useRef(phase);
  const currentCount = useMemo(
    () => Math.min(4, Math.max(1, Math.ceil(progress * 4))),
    [progress]
  );

  latestPhaseRef.current = phase;

  useEffect(() => {
    const phaseOpacity = phaseOpacityRef.current;

    phaseAnimationRef.current?.stop();

    if (phase === displayedPhase) {
      phaseOpacity.setValue(1);
      return;
    }

    if (!settings.animationsEnabled) {
      setDisplayedPhase(phase);
      phaseOpacity.setValue(1);
      return;
    }

    const transitionId = phaseTransitionRef.current + 1;
    phaseTransitionRef.current = transitionId;

    const fadeOut = Animated.timing(phaseOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    });

    phaseAnimationRef.current = fadeOut;
    fadeOut.start(({ finished }) => {
      if (
        !finished ||
        phaseTransitionRef.current !== transitionId ||
        latestPhaseRef.current !== phase
      ) {
        return;
      }

      setDisplayedPhase(phase);

      const fadeIn = Animated.timing(phaseOpacityRef.current, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      });
      phaseAnimationRef.current = fadeIn;
      fadeIn.start();
    });

    return () => {
      fadeOut.stop();
    };
  }, [phase, displayedPhase, settings.animationsEnabled]);

  useEffect(() => {
    const countOpacity = countOpacityRef.current;

    countAnimationRef.current?.stop();

    if (!settings.animationsEnabled) {
      countOpacity.setValue(1);
      return;
    }

    const fadeCountIn = Animated.timing(countOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    });
    countAnimationRef.current = fadeCountIn;
    fadeCountIn.start();

    return () => {
      fadeCountIn.stop();
    };
  }, [currentCount, settings.animationsEnabled]);

  useEffect(
    () => () => {
      countAnimationRef.current?.stop();
      phaseAnimationRef.current?.stop();
    },
    []
  );

  const cycleColors = useCallback(() => {
    setColorIndex((prev) => (prev + 1) % colorSchemes.length);
  }, [colorSchemes.length]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
      <AppHeader title={t('games.breathingGarden.title')} onBack={handleBack} />
      <View style={styles.content}>
        <AppCard variant="elevated" style={styles.breathCard}>
          <Animated.Text style={[styles.phaseLabel, { opacity: phaseOpacityRef.current }]}>
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
            <Animated.Text style={[styles.countText, { opacity: countOpacityRef.current }]}>
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
