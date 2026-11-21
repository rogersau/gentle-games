import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
import {
  addBalloon,
  BALLOON_HEIGHT_RATIO,
  BALLOON_WIDTH_RATIO,
  containBalloon,
  createBalloon,
  flickBalloon,
  GROUND_HEIGHT,
  KeepyUppyBalloon,
  KeepyUppyBounds,
  moveStillBalloon,
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
  motionEnabled?: boolean;
  allowPopping?: boolean;
}

interface BalloonPress {
  balloonId: string;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  startedAt: number;
}

const STEP_MS = 1000 / 30;
const BALLOON_STRING_HEIGHT = 22;
const BALLOON_KNOT_HEIGHT = 8;
const MIN_FLICK_DISTANCE = 16;
const MAX_FLICK_DURATION_MS = 500;

export const KeepyUppyBoard = forwardRef<KeepyUppyBoardRef, KeepyUppyBoardProps>(
  (
    {
      bounds,
      onScoreChange,
      onBalloonCountChange,
      onPoppedChange,
      easyMode = false,
      motionEnabled = true,
      allowPopping = true,
    },
    ref,
  ) => {
    const { colors, resolvedMode } = useThemeColors();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
    const createBoardBalloon = useCallback(
      () => createBalloon(bounds, { colors, resolvedMode }),
      [bounds, colors, resolvedMode],
    );
    const [{ balloons, score, popped }, setBoard] = useState(() => ({
      balloons: [createBoardBalloon()],
      score: 0,
      popped: 0,
    }));
    const touchStartRef = useRef<BalloonPress | null>(null);
    const elapsedPlayMs = useRef(0);
    const previousBoundsRef = useRef(bounds);
    const onBalloonCountChangeRef = useRef(onBalloonCountChange);
    const onScoreChangeRef = useRef(onScoreChange);
    const onPoppedChangeRef = useRef(onPoppedChange);

    onBalloonCountChangeRef.current = onBalloonCountChange;
    onScoreChangeRef.current = onScoreChange;
    onPoppedChangeRef.current = onPoppedChange;

    useEffect(() => {
      if (balloons.length === 0) {
        const newBalloon = createBoardBalloon();
        setBoard((previous) =>
          previous.balloons.length === 0 ? { ...previous, balloons: [newBalloon] } : previous,
        );
      }
    }, [balloons.length, createBoardBalloon]);

    useEffect(() => {
      if (balloons.length > 0) {
        onBalloonCountChangeRef.current?.(balloons.length);
      }
    }, [balloons.length]);

    useEffect(() => {
      onScoreChangeRef.current?.(score);
    }, [score]);

    useEffect(() => {
      onPoppedChangeRef.current?.(popped);
    }, [popped]);

    useLayoutEffect(() => {
      const previousBounds = previousBoundsRef.current;
      if (previousBounds.width === bounds.width && previousBounds.height === bounds.height) return;
      previousBoundsRef.current = bounds;
      touchStartRef.current = null;
      setBoard((previous) => ({
        ...previous,
        balloons: previous.balloons.map((balloon) =>
          containBalloon(
            {
              ...balloon,
              x: (balloon.x * bounds.width) / previousBounds.width,
              y: (balloon.y * bounds.height) / previousBounds.height,
            },
            bounds,
          ),
        ),
      }));
    }, [bounds]);

    useEffect(() => {
      if (!motionEnabled) return;
      const timer = setInterval(() => {
        // Count simulated play time so a pause also pauses the ground grace period.
        if (allowPopping) elapsedPlayMs.current += STEP_MS;
        const now = elapsedPlayMs.current;
        setBoard((previous) => {
          if (previous.balloons.length === 0) return previous;
          if (!allowPopping && previous.balloons.every((balloon) => balloon.groundedAt !== null)) {
            return previous;
          }
          const stepped = stepBalloons(
            previous.balloons,
            bounds,
            STEP_MS / 1000,
            now,
            allowPopping,
          );
          return {
            ...previous,
            balloons: stepped.balloons,
            popped: previous.popped + stepped.popped,
          };
        });
      }, STEP_MS);

      return () => clearInterval(timer);
    }, [allowPopping, bounds, motionEnabled]);

    const resetBoard = useCallback(() => {
      touchStartRef.current = null;
      setBoard({ balloons: [createBoardBalloon()], score: 0, popped: 0 });
    }, [createBoardBalloon]);

    const addBoardBalloon = useCallback(() => {
      const balloon = createBoardBalloon();
      const colorSample = Math.random();
      setBoard((previous) => {
        const next = addBalloon(previous.balloons, bounds, {
          balloon,
          colors,
          resolvedMode,
          rng: () => colorSample,
        });
        return next === previous.balloons ? previous : { ...previous, balloons: next };
      });
    }, [bounds, colors, createBoardBalloon, resolvedMode]);

    useImperativeHandle(
      ref,
      () => ({
        addBalloon: addBoardBalloon,
        resetBalloons: resetBoard,
        getBalloonCount: () => balloons.length,
      }),
      [addBoardBalloon, balloons.length, resetBoard],
    );

    const handleBalloonPress = (balloonId: string, event: GestureResponderEvent) => {
      const nativeEvent = event?.nativeEvent as GestureResponderEvent['nativeEvent'] & {
        detail?: number;
      };
      const touchStart = touchStartRef.current;
      touchStartRef.current = null;
      // Keyboard and assistive activations may have no pointer coordinates.
      const pointerStart =
        touchStart?.balloonId === balloonId &&
        nativeEvent?.detail !== 0 &&
        Number.isFinite(nativeEvent?.pageX) &&
        Number.isFinite(nativeEvent?.pageY)
          ? touchStart
          : null;
      const deltaX = pointerStart ? nativeEvent.pageX - pointerStart.pageX : 0;
      const deltaY = pointerStart ? nativeEvent.pageY - pointerStart.pageY : 0;
      const durationMs = pointerStart ? Date.now() - pointerStart.startedAt : 0;
      const isFlick =
        durationMs <= MAX_FLICK_DURATION_MS && Math.hypot(deltaX, deltaY) >= MIN_FLICK_DISTANCE;

      setBoard((previous) => {
        const balloon = previous.balloons.find((current) => current.id === balloonId);
        if (!balloon) return previous;

        let lifted: KeepyUppyBalloon;
        if (!motionEnabled) {
          lifted = moveStillBalloon(balloon, bounds);
        } else if (isFlick) {
          lifted = flickBalloon(balloon, deltaX, deltaY, durationMs);
        } else {
          lifted = tapBalloon(
            balloon,
            balloon.x + (pointerStart?.offsetX ?? 0),
            balloon.y + (pointerStart?.offsetY ?? 0),
            easyMode,
          );
        }
        return {
          ...previous,
          balloons: previous.balloons.map((current) => (current === balloon ? lifted : current)),
          score: previous.score + 1,
        };
      });
    };

    return (
      <View style={[styles.board, { width: bounds.width, height: bounds.height }]}>
        <View style={styles.sun} />
        <View style={[styles.cloud, styles.cloud1]} />
        <View style={[styles.cloud, styles.cloud2]} />
        <View style={[styles.cloud, styles.cloud3]} />
        <View style={styles.ground}>
          <View style={styles.grassStripe} />
        </View>
        {balloons.map((balloon, index) => {
          const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
          const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
          return (
            <Pressable
              key={balloon.id}
              accessibilityRole='button'
              accessibilityLabel={t('games.keepyUppy.balloonAccessibility', { number: index + 1 })}
              accessibilityHint={t(
                motionEnabled ? 'games.keepyUppy.liftHint' : 'games.keepyUppy.moveHint',
              )}
              android_disableSound
              testID={`balloon-${balloon.id}`}
              onPressIn={(event) => {
                const { pageX, pageY, locationX, locationY } = event.nativeEvent;
                touchStartRef.current =
                  Number.isFinite(pageX) && Number.isFinite(pageY)
                    ? {
                        balloonId: balloon.id,
                        pageX,
                        pageY,
                        offsetX: Number.isFinite(locationX) ? locationX - balloonW / 2 : 0,
                        offsetY: Number.isFinite(locationY) ? locationY - balloonH / 2 : 0,
                        startedAt: Date.now(),
                      }
                    : null;
              }}
              onPress={(event) => handleBalloonPress(balloon.id, event)}
              style={[
                styles.balloonHitArea,
                {
                  left: balloon.x - balloonW / 2,
                  top: balloon.y - balloonH / 2,
                  width: balloonW,
                  height: balloonH + BALLOON_KNOT_HEIGHT + BALLOON_STRING_HEIGHT,
                  opacity: allowPopping && balloon.groundedAt !== null ? 0.72 : 1,
                },
              ]}
            >
              <View pointerEvents='none' style={styles.balloonArtwork}>
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
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  },
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
      height: GROUND_HEIGHT,
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
    },
    balloonArtwork: {
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
