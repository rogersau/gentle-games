import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  addBalloon,
  createBalloon,
  flickBalloon,
  KeepyUppyBalloon,
  KeepyUppyBounds,
  MAX_BALLOONS,
  stepBalloons,
  tapBalloon,
} from '../utils/keepyUppyLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';

export interface KeepyUppyBoardRef {
  addBalloon: () => void;
  resetBalloons: () => void;
  getBalloonCount: () => number;
}

interface KeepyUppyBoardProps {
  bounds: KeepyUppyBounds;
  onScoreChange?: (score: number) => void;
  onBalloonCountChange?: (count: number) => void;
  onPoppedChange?: (popped: number) => void;
  easyMode?: boolean;
}

const STEP_MS = 1000 / 30;
const BALLOON_WIDTH_RATIO = 1.7;
const BALLOON_HEIGHT_RATIO = 2.1;
const BALLOON_STRING_HEIGHT = 22;
const BALLOON_KNOT_HEIGHT = 8;
const MIN_FLICK_DISTANCE = 8;
const MAX_FLICK_DURATION_MS = 500;

export const KeepyUppyBoard = forwardRef<KeepyUppyBoardRef, KeepyUppyBoardProps>(
  (
    { bounds, onScoreChange, onBalloonCountChange, onPoppedChange, easyMode = false },
    ref
  ) => {
    const { colors, resolvedMode } = useThemeColors();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
    const [score, setScore] = useState(0);
    const [popped, setPopped] = useState(0);
    const touchStartRef = useRef<Record<string, { x: number; y: number; startedAt: number }>>({});

    const [balloons, setBalloons] = useState<KeepyUppyBalloon[]>(() => [
      createBalloon(bounds, { colors, resolvedMode }),
    ]);

    // Use refs to avoid stale callbacks in effects while preventing re-render cycles
    const onBalloonCountChangeRef = useRef(onBalloonCountChange);
    const onScoreChangeRef = useRef(onScoreChange);
    const onPoppedChangeRef = useRef(onPoppedChange);

    // Update refs when callbacks change
    useEffect(() => {
      onBalloonCountChangeRef.current = onBalloonCountChange;
      onScoreChangeRef.current = onScoreChange;
      onPoppedChangeRef.current = onPoppedChange;
    }, [onBalloonCountChange, onScoreChange, onPoppedChange]);

    useEffect(() => {
      if (balloons.length === 0) {
        const nextBalloons = [createBalloon(bounds, { colors, resolvedMode })];
        setBalloons(nextBalloons);
        // Use setTimeout to defer the callback to avoid setState during render
        setTimeout(() => {
          onBalloonCountChangeRef.current?.(nextBalloons.length);
        }, 0);
        return;
      }
      // Use setTimeout to defer the callback to avoid setState during render
      setTimeout(() => {
        onBalloonCountChangeRef.current?.(balloons.length);
      }, 0);
      // Note: Intentionally omitting callback refs from deps to prevent loops
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [balloons.length, bounds, colors, resolvedMode]);

    useEffect(() => {
      const timer = setInterval(() => {
        const now = Date.now();
        setBalloons((previous) => {
          const stepped = stepBalloons(previous, bounds, STEP_MS / 1000, now);
          if (stepped.popped > 0) {
            setPopped((currentPopped) => {
              const newPopped = currentPopped + stepped.popped;
              // Use setTimeout to defer the callback to avoid setState during render
              setTimeout(() => {
                onPoppedChangeRef.current?.(newPopped);
              }, 0);
              return newPopped;
            });
          }
          return stepped.balloons;
        });
      }, STEP_MS);

      return () => clearInterval(timer);
      // Note: Intentionally using ref instead of callback in deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bounds]);

    useImperativeHandle(
      ref,
      () => ({
        addBalloon: () => {
          setBalloons((previous) => addBalloon(previous, bounds, { colors, resolvedMode }));
        },
        resetBalloons: () => {
          setBalloons([createBalloon(bounds, { colors, resolvedMode })]);
          setScore(0);
          setPopped(0);
          // Defer callbacks to avoid setState during render
          setTimeout(() => {
            onScoreChangeRef.current?.(0);
            onPoppedChangeRef.current?.(0);
            onBalloonCountChangeRef.current?.(1);
          }, 0);
        },
        getBalloonCount: () => balloons.length,
      }),
      // Note: Using stable refs instead of callbacks in deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [bounds, colors, resolvedMode, balloons.length]
    );

    const toBoardPoint = useCallback(
      (balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
        const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
        const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
        return {
          x: balloon.x - balloonW / 2 + locationX,
          y: balloon.y - balloonH / 2 + locationY,
        };
      },
      []
    );

    const handleBalloonPress = useCallback(
      (balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
        const tapPoint = toBoardPoint(balloon, locationX, locationY);
        setScore((currentScore) => {
          const newScore = currentScore + 1;
          // Defer callback to avoid setState during render
          setTimeout(() => {
            onScoreChangeRef.current?.(newScore);
          }, 0);
          return newScore;
        });
        setBalloons((previous) =
          previous.map((current) =
            current.id === balloon.id
              ? tapBalloon(current, tapPoint.x, tapPoint.y, easyMode)
              : current
          )
        );
      },
      // Note: Using ref instead of callback in deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [easyMode, toBoardPoint]
    );
      },
      [easyMode, onScoreChange, toBoardPoint]
    );

    const handleBalloonRelease = useCallback(
      (balloon: KeepyUppyBalloon, pageX: number, pageY: number) => {
        const touchStart = touchStartRef.current[balloon.id];
        delete touchStartRef.current[balloon.id];
        if (!touchStart) {
          return;
        }
        const deltaX = pageX - touchStart.x;
        const deltaY = pageY - touchStart.y;
        const durationMs = Math.max(1, Date.now() - touchStart.startedAt);
        if (
          Math.hypot(deltaX, deltaY) < MIN_FLICK_DISTANCE ||
          durationMs > MAX_FLICK_DURATION_MS
        ) {
          return;
        }
        setBalloons((previous) =>
          previous.map((current) =>
            current.id === balloon.id
              ? flickBalloon(current, deltaX, deltaY, durationMs)
              : current
          )
        );
      },
      []
    );

    return (
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
              accessibilityLabel={t('games.keepyUppy.balloonAccessibility') }
              testID={`balloon-${balloon.id}`}
              onPressIn={(event) => {
                touchStartRef.current[balloon.id] = {
                  x: event.nativeEvent.pageX,
                  y: event.nativeEvent.pageY,
                  startedAt: Date.now(),
                };
                handleBalloonPress(
                  balloon,
                  event.nativeEvent.locationX,
                  event.nativeEvent.locationY
                );
              }}
              onPressOut={(event) =>
                handleBalloonRelease(
                  balloon,
                  event.nativeEvent.pageX,
                  event.nativeEvent.pageY
                )
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
    );
  }
);

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
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
