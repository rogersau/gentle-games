import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { ThemeColors } from '../types';
import {
  addBalloon,
  createBalloon,
  flickBalloon,
  KeepyUppyBalloon,
  MAX_BALLOONS,
  stepBalloons,
  tapBalloon,
} from '../utils/keepyUppyLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const STEP_MS = 1000 / 30;
const BALLOON_WIDTH_RATIO = 1.7;
const BALLOON_HEIGHT_RATIO = 2.1;
const BALLOON_STRING_HEIGHT = 22;
const BALLOON_KNOT_HEIGHT = 8;
const MIN_FLICK_DISTANCE = 8;
const MAX_FLICK_DURATION_MS = 500;

export const KeepyUppyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);
  const touchStartRef = useRef<Record<string, { x: number; y: number; startedAt: number }>>({});

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

  const toBoardPoint = useCallback((balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
    const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
    const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
    return {
      x: balloon.x - balloonW / 2 + locationX,
      y: balloon.y - balloonH / 2 + locationY,
    };
  }, []);

  const handleBalloonPress = useCallback((balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
    const tapPoint = toBoardPoint(balloon, locationX, locationY);
    setScore((value) => value + 1);
    setBalloons((previous) =>
      previous.map((current) =>
        current.id === balloon.id ? tapBalloon(current, tapPoint.x, tapPoint.y, settings.keepyUppyEasyMode) : current
      )
    );
  }, [settings.keepyUppyEasyMode, toBoardPoint]);

  const handleBalloonRelease = useCallback((balloon: KeepyUppyBalloon, pageX: number, pageY: number) => {
    const touchStart = touchStartRef.current[balloon.id];
    delete touchStartRef.current[balloon.id];
    if (!touchStart) {
      return;
    }
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;
    const durationMs = Math.max(1, Date.now() - touchStart.startedAt);
    if (Math.hypot(deltaX, deltaY) < MIN_FLICK_DISTANCE || durationMs > MAX_FLICK_DURATION_MS) {
      return;
    }
    setBalloons((previous) =>
      previous.map((current) =>
        current.id === balloon.id ? flickBalloon(current, deltaX, deltaY, durationMs) : current
      )
    );
  }, []);

  return (
    <AppScreen>
      <AppHeader title="Keepy Uppy" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Tap balloons to keep them in the air.
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText} accessibilityLabel={`${score} taps`}>Taps: {score}</Text>
          <Text style={styles.statText} accessibilityLabel={`${balloons.length} balloons`}>Balloons: {balloons.length}</Text>
          <Text style={styles.statText} accessibilityLabel={`${popped} popped`}>Popped: {popped}</Text>
        </View>
        <AppButton
          label="+ Balloon"
          variant="secondary"
          size="sm"
          onPress={handleAddBalloon}
          disabled={balloons.length >= MAX_BALLOONS}
          accessibilityHint="Add another balloon to the game"
          style={{ marginBottom: Space.sm }}
        />

        <View style={[styles.board, { width: bounds.width, height: bounds.height }]}>
          <View style={styles.sun} />
          <View style={[styles.cloud, styles.cloud1]} />
          <View style={[styles.cloud, styles.cloud2]} />
          <View style={[styles.cloud, styles.cloud3]} />
          <View style={styles.ground}>
            <View style={styles.grassStripe} />
          </View>
          {balloons.map((balloon) => {
            const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
            const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
            return (
              <TouchableOpacity
                key={balloon.id}
                accessibilityRole="button"
                accessibilityLabel={`Balloon, tap to keep it up`}
                testID={`balloon-${balloon.id}`}
                onPressIn={(event) => {
                  touchStartRef.current[balloon.id] = {
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                    startedAt: Date.now(),
                  };
                  handleBalloonPress(balloon, event.nativeEvent.locationX, event.nativeEvent.locationY);
                }}
                onPressOut={(event) =>
                  handleBalloonRelease(balloon, event.nativeEvent.pageX, event.nativeEvent.pageY)
                }
                style={[
                  styles.balloonHitArea,
                  {
                    left: balloon.x - balloonW / 2,
                    top: balloon.y - balloonH / 2,
                    width: balloonW,
                    height: balloonH + BALLOON_KNOT_HEIGHT + BALLOON_STRING_HEIGHT,
                    opacity: balloon.groundedAt === null ? 1 : 0.72,
                  },
                ]}
              >
                <View
                  style={[
                    styles.balloonBody,
                    {
                      width: balloonW,
                      height: balloonH,
                      borderRadius: balloonW / 2,
                      backgroundColor: balloon.color,
                    },
                  ]}
                >
                  <View style={styles.balloonShine} />
                </View>
                <View style={[styles.balloonKnot, { borderTopColor: balloon.color }]} />
                <View style={styles.balloonString} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Space.md,
      marginBottom: Space.md,
    },
    statText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
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
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.success,
      opacity: 0.9,
      borderWidth: 3,
      borderColor: `${colors.success}80`,
    },
    cloud: {
      position: 'absolute',
      backgroundColor: `${colors.cardFront}${resolvedMode === 'dark' ? '30' : 'B3'}`,
      borderRadius: 20,
    },
    cloud1: {
      width: 70,
      height: 28,
      top: 22,
      left: 24,
    },
    cloud2: {
      width: 56,
      height: 22,
      top: 56,
      right: 60,
    },
    cloud3: {
      width: 64,
      height: 24,
      top: 90,
      left: 80,
    },
    ground: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 50,
      backgroundColor: colors.success,
      borderTopWidth: 3,
      borderTopColor: colors.cardBack,
    },
    grassStripe: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 8,
      backgroundColor: `${colors.cardFront}40`,
    },
    balloonHitArea: {
      position: 'absolute',
      alignItems: 'center',
    },
    balloonBody: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: `${colors.text}1A`,
    },
    balloonShine: {
      position: 'absolute',
      top: 11,
      left: 10,
      width: 16,
      height: 16,
      borderRadius: 100,
      backgroundColor: `${colors.cardFront}73`,
    },
    balloonKnot: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: BALLOON_KNOT_HEIGHT,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    balloonString: {
      width: 1.5,
      height: BALLOON_STRING_HEIGHT,
      backgroundColor: colors.matched,
    },
  });
