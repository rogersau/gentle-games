import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../types';
import {
  getBreathingPhase,
  getBreathingPhaseProgress,
  getCompletedBreathingCycles,
  isCalmBreathPress,
} from '../utils/breathingGardenLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const BreathingGardenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sessionStartAt, setSessionStartAt] = useState(() => Date.now());
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [petalsBloomed, setPetalsBloomed] = useState(0);
  const [message, setMessage] = useState('Breathe in slowly, then breathe out softly.');
  const pressStartAtRef = useRef<number | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setClockNow(Date.now());
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = Math.max(0, clockNow - sessionStartAt);
  const phase = getBreathingPhase(elapsedMs);
  const phaseProgress = getBreathingPhaseProgress(elapsedMs);
  const completedCycles = getCompletedBreathingCycles(elapsedMs);
  const circleSize = 120 + (phase === 'inhale' ? phaseProgress : 1 - phaseProgress) * 90;

  const handleBreathPressStart = () => {
    pressStartAtRef.current = Date.now();
  };

  const handleBreathPressEnd = () => {
    const pressStart = pressStartAtRef.current;
    pressStartAtRef.current = null;
    if (!pressStart) return;
    const holdDuration = Date.now() - pressStart;
    if (isCalmBreathPress(phase, holdDuration)) {
      setPetalsBloomed((current) => current + 1);
      setMessage('Lovely breathing. Your garden is blooming.');
    } else {
      setMessage(phase === 'exhale' ? 'Soft exhale now. You are doing great.' : 'Gentle and steady breaths.');
    }
  };

  const resetSession = () => {
    setSessionStartAt(Date.now());
    setClockNow(Date.now());
    setPetalsBloomed(0);
    setMessage('Breathe in slowly, then breathe out softly.');
  };

  return (
    <AppScreen>
      <AppHeader title="Breathing Garden" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Follow the rhythm and press during inhale.
        </Text>

        <AppCard variant="elevated" style={styles.breathCard}>
          <Text style={styles.phaseLabel}>{phase === 'inhale' ? 'Breathe In' : 'Breathe Out'}</Text>
          <View style={[styles.breathCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]} />
          <Text style={styles.message}>{message}</Text>
        </AppCard>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>Cycles: {completedCycles}</Text>
          <Text style={styles.statText}>Blooms: {petalsBloomed}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.gentlePressButton}
            onPressIn={handleBreathPressStart}
            onPressOut={handleBreathPressEnd}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Gentle Press"
            accessibilityHint="Hold briefly during inhale to bloom the garden"
          >
            <Text style={styles.gentlePressLabel}>🌸 Gentle Press</Text>
          </TouchableOpacity>
          <AppButton
            label="Reset Session"
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
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    breathCard: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Space.lg,
      gap: Space.base,
    },
    phaseLabel: {
      ...TypeStyle.h3,
      color: colors.text,
      textAlign: 'center',
    },
    breathCircle: {
      backgroundColor: colors.primary,
      borderWidth: 4,
      borderColor: colors.accent,
      opacity: 0.9,
    },
    message: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
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
      gap: Space.sm,
    },
    gentlePressButton: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
    },
    gentlePressLabel: {
      ...TypeStyle.button,
      color: colors.surface,
    },
    actionButton: {
      width: '100%',
    },
  });
