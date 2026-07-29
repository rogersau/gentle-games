import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  addBalloon,
  createBalloon,
  flickBalloon,
  KeepyUppyBalloon,
  KeepyUppyBounds,
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
}

interface AnimatedBalloon {
  model: KeepyUppyBalloon;
  position: Animated.ValueXY;
  opacity: Animated.Value;
}

const BALLOON_WIDTH_RATIO = 1.7;
const BALLOON_HEIGHT_RATIO = 2.1;
const BALLOON_STRING_HEIGHT = 22;
const BALLOON_KNOT_HEIGHT = 8;
const MIN_FLICK_DISTANCE = 8;
const MAX_FLICK_DURATION_MS = 500;
const GROUNDED_OPACITY = 0.72;

const getBalloonOpacity = (balloon: KeepyUppyBalloon) =>
  balloon.groundedAt === null ? 1 : GROUNDED_OPACITY;

const createAnimatedBalloon = (model: KeepyUppyBalloon): AnimatedBalloon => ({
  model,
  position: new Animated.ValueXY({ x: model.x, y: model.y }),
  opacity: new Animated.Value(getBalloonOpacity(model)),
});

const syncAnimatedBalloon = (balloon: AnimatedBalloon, model: KeepyUppyBalloon) => {
  balloon.model = model;
  balloon.position.setValue({ x: model.x, y: model.y });
  balloon.opacity.setValue(getBalloonOpacity(model));
};

export const KeepyUppyBoard = forwardRef<KeepyUppyBoardRef, KeepyUppyBoardProps>(
  ({ bounds, onScoreChange, onBalloonCountChange, onPoppedChange, easyMode = false, motionEnabled = true }, ref) => {
    const { colors, resolvedMode } = useThemeColors();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
    const createBoardBalloon = useCallback(
      () => createBalloon(bounds, { colors, resolvedMode }),
      [bounds, colors, resolvedMode],
    );
    const createAnimatedBoardBalloon = useCallback(
      () => createAnimatedBalloon(createBoardBalloon()),
      [createBoardBalloon],
    );
    const [score, setScore] = useState(0);
    const [popped, setPopped] = useState(0);
    const touchStartRef = useRef<Record<string, { x: number; y: number; startedAt: number }>>({});
    const [balloons, setBalloons] = useState<AnimatedBalloon[]>(() => [createAnimatedBoardBalloon()]);
    const balloonsRef = useRef(balloons);
    const onBalloonCountChangeRef = useRef(onBalloonCountChange);
    const onScoreChangeRef = useRef(onScoreChange);
    const onPoppedChangeRef = useRef(onPoppedChange);

    onBalloonCountChangeRef.current = onBalloonCountChange;
    onScoreChangeRef.current = onScoreChange;
    onPoppedChangeRef.current = onPoppedChange;

    const commitBalloons = useCallback((next: AnimatedBalloon[]) => {
      balloonsRef.current = next;
      setBalloons(next);
    }, []);

    useEffect(() => {
      onBalloonCountChangeRef.current?.(balloons.length);
    }, [balloons.length]);

    useEffect(() => {
      onScoreChangeRef.current?.(score);
    }, [score]);

    useEffect(() => {
      onPoppedChangeRef.current?.(popped);
    }, [popped]);

    useEffect(() => {
      if (!motionEnabled) return;

      let frameId: number | null = null;
      let previousFrameTime: number | null = null;

      const animate = (frameTime: number) => {
        if (previousFrameTime === null) {
          previousFrameTime = frameTime;
          frameId = requestAnimationFrame(animate);
          return;
        }

        const deltaSeconds = Math.max(0, (frameTime - previousFrameTime) / 1000);
        previousFrameTime = frameTime;

        const current = balloonsRef.current;
        const stepped = stepBalloons(
          current.map((balloon) => balloon.model),
          bounds,
          deltaSeconds,
          Date.now(),
        );
        const currentById = new Map(current.map((balloon) => [balloon.model.id, balloon]));
        let next = stepped.balloons.map((model) => {
          const existing = currentById.get(model.id);
          if (!existing) {
            return createAnimatedBalloon(model);
          }
          syncAnimatedBalloon(existing, model);
          return existing;
        });
        let balloonSetChanged = stepped.popped > 0;

        if (next.length === 0) {
          next = [createAnimatedBoardBalloon()];
          balloonSetChanged = true;
        }

        balloonsRef.current = next;
        if (balloonSetChanged) {
          setBalloons(next);
        }
        if (stepped.popped > 0) {
          setPopped((currentPopped) => currentPopped + stepped.popped);
        }

        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
      };
    }, [bounds, createAnimatedBoardBalloon, motionEnabled]);

    const resetBoard = useCallback(() => {
      commitBalloons([createAnimatedBoardBalloon()]);
      setScore(0);
      setPopped(0);
    }, [commitBalloons, createAnimatedBoardBalloon]);

    const addBoardBalloon = useCallback(() => {
      const current = balloonsRef.current;
      const nextModels = addBalloon(
        current.map((balloon) => balloon.model),
        bounds,
        { colors, resolvedMode },
      );
      if (nextModels.length === current.length) {
        return;
      }

      const currentById = new Map(current.map((balloon) => [balloon.model.id, balloon]));
      const next = nextModels.map((model) => currentById.get(model.id) ?? createAnimatedBalloon(model));
      commitBalloons(next);
    }, [bounds, colors, commitBalloons, resolvedMode]);

    useImperativeHandle(
      ref,
      () => ({
        addBalloon: addBoardBalloon,
        resetBalloons: resetBoard,
        getBalloonCount: () => balloonsRef.current.length,
      }),
      [addBoardBalloon, resetBoard],
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
      [],
    );

    const handleBalloonPress = useCallback(
      (balloon: AnimatedBalloon, locationX: number, locationY: number) => {
        const tapPoint = toBoardPoint(balloon.model, locationX, locationY);
        setScore((currentScore) => currentScore + 1);
        syncAnimatedBalloon(
          balloon,
          tapBalloon(balloon.model, tapPoint.x, tapPoint.y, easyMode),
        );
      },
      [easyMode, toBoardPoint],
    );

    const handleBalloonRelease = useCallback(
      (balloon: AnimatedBalloon, pageX: number, pageY: number) => {
        const touchStart = touchStartRef.current[balloon.model.id];
        delete touchStartRef.current[balloon.model.id];
        if (!touchStart) {
          return;
        }
        const deltaX = pageX - touchStart.x;
        const deltaY = pageY - touchStart.y;
        const durationMs = Math.max(1, Date.now() - touchStart.startedAt);
        if (Math.hypot(deltaX, deltaY) < MIN_FLICK_DISTANCE || durationMs > MAX_FLICK_DURATION_MS) {
          return;
        }
        syncAnimatedBalloon(balloon, flickBalloon(balloon.model, deltaX, deltaY, durationMs));
      },
      [],
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
        {balloons.map((animatedBalloon) => {
          const balloon = animatedBalloon.model;
          const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
          const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
          return (
            <Animated.View
              key={balloon.id}
              style={[
                styles.balloonHitArea,
                {
                  left: -balloonW / 2,
                  top: -balloonH / 2,
                  width: balloonW,
                  height: balloonH + BALLOON_KNOT_HEIGHT + BALLOON_STRING_HEIGHT,
                  opacity: animatedBalloon.opacity,
                  transform: animatedBalloon.position.getTranslateTransform(),
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole='button'
                accessibilityLabel={t('games.keepyUppy.balloonAccessibility')}
                testID={`balloon-${balloon.id}`}
                onPressIn={(event) => {
                  touchStartRef.current[balloon.id] = {
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                    startedAt: Date.now(),
                  };
                  handleBalloonPress(
                    animatedBalloon,
                    event.nativeEvent.locationX,
                    event.nativeEvent.locationY,
                  );
                }}
                onPressOut={(event) =>
                  handleBalloonRelease(
                    animatedBalloon,
                    event.nativeEvent.pageX,
                    event.nativeEvent.pageY,
                  )
                }
                style={styles.balloonTouchTarget}
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
            </Animated.View>
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
    },
    balloonTouchTarget: {
      width: '100%',
      height: '100%',
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
