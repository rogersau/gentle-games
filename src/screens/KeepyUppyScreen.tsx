import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../types';
import {
  addBalloon,
  createBalloon,
  KeepyUppyBalloon,
  MAX_BALLOONS,
  stepBalloons,
  tapBalloon,
} from '../utils/keepyUppyLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

const STEP_MS = 1000 / 30;

export const KeepyUppyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);

  const bounds = useMemo(() => {
    const width = Math.max(260, screenWidth - 24);
    const height = Math.max(320, Math.min(screenHeight * 0.68, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const [balloons, setBalloons] = useState<KeepyUppyBalloon[]>(() => [createBalloon(bounds)]);

  useEffect(() => {
    if (balloons.length === 0) {
      setBalloons([createBalloon(bounds)]);
    }
  }, [balloons.length, bounds]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setBalloons((previous) => {
        const stepped = stepBalloons(previous, bounds, STEP_MS / 1000, now);
        if (stepped.popped > 0) {
          setPopped((count) => count + stepped.popped);
        }
        return stepped.balloons;
      });
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [bounds]);

  const handleAddBalloon = useCallback(() => {
    setBalloons((previous) => addBalloon(previous, bounds));
  }, [bounds]);

  const handleBalloonPress = useCallback((balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
    const tapX = balloon.x - balloon.radius + locationX;
    const tapY = balloon.y - balloon.radius + locationY;
    setScore((value) => value + 1);
    setBalloons((previous) =>
      previous.map((current) => (current.id === balloon.id ? tapBalloon(current, tapX, tapY) : current))
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Keepy Uppy</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Tap balloons to keep them in the air.</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Taps: {score}</Text>
          <Text style={styles.statText}>Balloons: {balloons.length}</Text>
          <Text style={styles.statText}>Popped: {popped}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, balloons.length >= MAX_BALLOONS ? styles.addButtonDisabled : undefined]}
          onPress={handleAddBalloon}
          disabled={balloons.length >= MAX_BALLOONS}
        >
          <Text style={styles.addButtonText}>+ Balloon</Text>
        </TouchableOpacity>

        <View style={[styles.board, { width: bounds.width, height: bounds.height }]}>
          <View style={styles.sun} />
          <View style={styles.ground} />
          {balloons.map((balloon) => (
            <TouchableOpacity
              key={balloon.id}
              accessibilityRole="button"
              testID={`balloon-${balloon.id}`}
              onPressIn={(event) =>
                handleBalloonPress(balloon, event.nativeEvent.locationX, event.nativeEvent.locationY)
              }
              style={[
                styles.balloon,
                {
                  left: balloon.x - balloon.radius,
                  top: balloon.y - balloon.radius,
                  width: balloon.radius * 2,
                  height: balloon.radius * 2,
                  borderRadius: balloon.radius,
                  backgroundColor: balloon.color,
                  opacity: balloon.groundedAt === null ? 1 : 0.72,
                },
              ]}
            >
              <Text style={styles.balloonIcon}>🎈</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBack,
    },
    backButton: {
      minWidth: 92,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.cardBack,
      backgroundColor: colors.cardFront,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
    },
    backPlaceholder: {
      width: 92,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 12,
    },
    statText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.secondary,
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 10,
    },
    addButtonDisabled: {
      opacity: 0.55,
    },
    addButtonText: {
      color: colors.cardFront,
      fontSize: 16,
      fontWeight: '700',
    },
    board: {
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.primary,
      position: 'relative',
    },
    sun: {
      position: 'absolute',
      right: 18,
      top: 16,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.success,
      opacity: 0.9,
    },
    ground: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 44,
      backgroundColor: colors.surfaceGame,
    },
    balloon: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.cardFront,
    },
    balloonIcon: {
      fontSize: 30,
    },
  });
