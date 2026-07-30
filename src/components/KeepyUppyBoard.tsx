import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  addBalloon,
  createInitialBalloons,
  flickBalloon,
  isBalloonResting,
  KeepyUppyBalloon,
  KeepyUppyBounds,
  KeepyUppyConfig,
  MAX_BALLOONS,
  resolveKeepyUppyConfig,
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

export interface KeepyUppyBoardProps {
  bounds: KeepyUppyBounds;
  onScoreChange?: (score: number) => void;
  onBalloonCountChange?: (count: number) => void;
  onPoppedChange?: (popped: number) => void;
  easyMode?: boolean;
  /** Kept for the shared screen contract. Reduced motion remains playable. */
  motionEnabled?: boolean;
  reducedMotion?: boolean;
  config?: Partial<KeepyUppyConfig>;
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
    {
      bounds,
      onScoreChange,
      onBalloonCountChange,
      onPoppedChange,
      easyMode = false,
      motionEnabled = true,
      reducedMotion = false,
      config,
    },
    ref,
  ) => {
    const { colors, resolvedMode } = useThemeColors();
    const { t } = useTranslation();
    const resolvedConfig = useMemo(
      () =>
        resolveKeepyUppyConfig({
          ...config,
          reducedMotion: config?.reducedMotion || reducedMotion || !motionEnabled,
        }),
      [config, motionEnabled, reducedMotion],
    );
    const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
    const createOptions = useMemo(
      () => ({ colors, resolvedMode, config: resolvedConfig }),
      [colors, resolvedConfig, resolvedMode],
    );
    const createBoardBalloons = useCallback(
      () => createInitialBalloons(bounds, createOptions),
      [bounds, createOptions],
    );
    const [score, setScore] = useState(0);
    const [popped, setPopped] = useState(0);
    const [balloons, setBalloons] = useState<KeepyUppyBalloon[]>(createBoardBalloons);
    const touchStartRef = useRef<Record<string, { x: number; y: number; startedAt: number }>>({});
    const activatedOnPressInRef = useRef<Record<string, boolean>>({});
    const onBalloonCountChangeRef = useRef(onBalloonCountChange);
    const onScoreChangeRef = useRef(onScoreChange);
    const onPoppedChangeRef = useRef(onPoppedChange);

    onBalloonCountChangeRef.current = onBalloonCountChange;
    onScoreChangeRef.current = onScoreChange;
    onPoppedChangeRef.current = onPoppedChange;

    useEffect(() => {
      if (balloons.length === 0) setBalloons(createBoardBalloons());
    }, [balloons.length, createBoardBalloons]);

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
      const timer = setInterval(
        () => {
          const now = Date.now();
          setBalloons((previous) => {
            const stepped = stepBalloons(previous, bounds, STEP_MS / 1000, now, resolvedConfig);
            // Ground contact is a resting state, never a failure.
            if (stepped.popped > 0) setPopped((currentPopped) => currentPopped + stepped.popped);
            return stepped.balloons;
          });
        },
        STEP_MS * (resolvedConfig.reducedMotion ? 2 : 1),
      );

      return () => clearInterval(timer);
    }, [bounds, resolvedConfig]);

    const resetBoard = useCallback(() => {
      setBalloons(createBoardBalloons());
      setScore(0);
      setPopped(0);
    }, [createBoardBalloons]);

    const addBoardBalloon = useCallback(() => {
      setBalloons((previous) =>
        addBalloon(previous, bounds, {
          ...createOptions,
          config: config ? resolvedConfig : { ...resolvedConfig, balloonCount: MAX_BALLOONS },
        }),
      );
    }, [bounds, config, createOptions, resolvedConfig]);

    useImperativeHandle(
      ref,
      () => ({
        addBalloon: addBoardBalloon,
        resetBalloons: resetBoard,
        getBalloonCount: () => balloons.length,
      }),
      [addBoardBalloon, balloons.length, resetBoard],
    );

    const toBoardPoint = useCallback(
      (balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
        const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
        const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
        return { x: balloon.x - balloonW / 2 + locationX, y: balloon.y - balloonH / 2 + locationY };
      },
      [],
    );

    const liftBalloon = useCallback(
      (balloonId: string | undefined, pointX: number, pointY: number) => {
        setBalloons((previous) => {
          let target = balloonId ? previous.find((balloon) => balloon.id === balloonId) : undefined;
          if (!target) {
            const candidates = previous.filter((balloon) => {
              const targetRadius = balloon.radius * resolvedConfig.targetSize;
              return Math.hypot(balloon.x - pointX, balloon.y - pointY) <= targetRadius;
            });
            target = candidates.sort(
              (first, second) => Number(isBalloonResting(second)) - Number(isBalloonResting(first)),
            )[0];
          }
          if (!target && resolvedConfig.interaction !== 'direct-touch') {
            target = [...previous].sort(
              (first, second) => Number(isBalloonResting(second)) - Number(isBalloonResting(first)),
            )[0];
          }
          if (!target) return previous;
          setScore((currentScore) => currentScore + 1);
          const tapX =
            resolvedConfig.interaction === 'target-zones' ? target.x * 2 - pointX : pointX;
          return previous.map((balloon) =>
            balloon.id === target?.id
              ? tapBalloon(balloon, tapX, pointY, easyMode, resolvedConfig)
              : balloon,
          );
        });
      },
      [easyMode, resolvedConfig],
    );

    const handleBalloonPress = useCallback(
      (balloon: KeepyUppyBalloon, locationX: number, locationY: number) => {
        const tapPoint = toBoardPoint(balloon, locationX, locationY);
        liftBalloon(balloon.id, tapPoint.x, tapPoint.y);
      },
      [liftBalloon, toBoardPoint],
    );

    const handleBalloonRelease = useCallback(
      (balloon: KeepyUppyBalloon, pageX: number, pageY: number) => {
        const touchStart = touchStartRef.current[balloon.id];
        delete touchStartRef.current[balloon.id];
        if (!touchStart) return;
        const deltaX = pageX - touchStart.x;
        const deltaY = pageY - touchStart.y;
        const durationMs = Math.max(1, Date.now() - touchStart.startedAt);
        if (Math.hypot(deltaX, deltaY) < MIN_FLICK_DISTANCE || durationMs > MAX_FLICK_DURATION_MS)
          return;
        setBalloons((previous) =>
          previous.map((current) =>
            current.id === balloon.id
              ? flickBalloon(current, deltaX, deltaY, durationMs, resolvedConfig)
              : current,
          ),
        );
      },
      [resolvedConfig],
    );

    const handleInputOverlay = useCallback(
      (pointX: number, pointY: number) => liftBalloon(undefined, pointX, pointY),
      [liftBalloon],
    );
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const textOrFallback = (key: string, fallback: string) => {
      const translated = t(key, { defaultValue: fallback });
      return translated === key ? fallback : translated;
    };
    const recoveryLabel = textOrFallback('games.keepyUppy.liftAgain', 'Lift it again');
    const activationLabel = textOrFallback(
      'games.keepyUppy.tapAnywhere',
      'Tap anywhere to lift a balloon',
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
        {resolvedConfig.interaction === 'tap-anywhere' ? (
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel={activationLabel}
            testID='keepy-uppy-tap-anywhere'
            style={styles.inputOverlay}
            onPress={(event) =>
              handleInputOverlay(
                event?.nativeEvent?.locationX ?? centerX,
                event?.nativeEvent?.locationY ?? centerY,
              )
            }
            onAccessibilityTap={() => handleInputOverlay(centerX, centerY)}
          />
        ) : null}
        {resolvedConfig.interaction === 'target-zones' ? (
          <View style={styles.zoneRow} pointerEvents='box-none'>
            {[0, 1].map((zone) => (
              <TouchableOpacity
                key={zone}
                accessibilityRole='button'
                accessibilityLabel={
                  zone === 0
                    ? textOrFallback('games.keepyUppy.leftTargetZone', 'Left target zone')
                    : textOrFallback('games.keepyUppy.rightTargetZone', 'Right target zone')
                }
                testID={`keepy-uppy-target-zone-${zone === 0 ? 'left' : 'right'}`}
                style={styles.targetZone}
                onPress={() =>
                  handleInputOverlay(
                    zone === 0 ? bounds.width * 0.25 : bounds.width * 0.75,
                    centerY,
                  )
                }
                onAccessibilityTap={() =>
                  handleInputOverlay(
                    zone === 0 ? bounds.width * 0.25 : bounds.width * 0.75,
                    centerY,
                  )
                }
              />
            ))}
          </View>
        ) : null}
        {resolvedConfig.interaction === 'left-and-right' ? (
          <View style={styles.zoneRow} pointerEvents='box-none'>
            {[0, 1].map((zone) => (
              <TouchableOpacity
                key={zone}
                accessibilityRole='button'
                accessibilityLabel={
                  zone === 0
                    ? textOrFallback('games.keepyUppy.leftSide', 'Left side')
                    : textOrFallback('games.keepyUppy.rightSide', 'Right side')
                }
                testID={`keepy-uppy-${zone === 0 ? 'left' : 'right'}-control`}
                style={styles.sideControl}
                onPress={() => handleInputOverlay(zone === 0 ? 0 : bounds.width, centerY)}
                onAccessibilityTap={() =>
                  handleInputOverlay(zone === 0 ? 0 : bounds.width, centerY)
                }
              />
            ))}
          </View>
        ) : null}
        {balloons.map((balloon) => {
          const balloonW = balloon.radius * BALLOON_WIDTH_RATIO;
          const balloonH = balloon.radius * BALLOON_HEIGHT_RATIO;
          const resting = isBalloonResting(balloon);
          return (
            <TouchableOpacity
              key={balloon.id}
              accessible
              accessibilityRole='button'
              accessibilityLabel={
                resting
                  ? t('games.keepyUppy.restingBalloonAccessibility', {
                      defaultValue: `Balloon resting. ${recoveryLabel}`,
                    })
                  : t('games.keepyUppy.balloonAccessibility')
              }
              testID={`balloon-${balloon.id}`}
              onPressIn={(event) => {
                touchStartRef.current[balloon.id] = {
                  x: event.nativeEvent.pageX,
                  y: event.nativeEvent.pageY,
                  startedAt: Date.now(),
                };
                activatedOnPressInRef.current[balloon.id] = true;
                handleBalloonPress(
                  balloon,
                  event.nativeEvent.locationX,
                  event.nativeEvent.locationY,
                );
              }}
              onPress={() => {
                if (activatedOnPressInRef.current[balloon.id]) {
                  delete activatedOnPressInRef.current[balloon.id];
                  return;
                }
                handleBalloonPress(balloon, balloonW / 2, balloonH / 2);
              }}
              onAccessibilityTap={() => handleBalloonPress(balloon, balloonW / 2, balloonH / 2)}
              onPressOut={(event) => {
                delete activatedOnPressInRef.current[balloon.id];
                handleBalloonRelease(balloon, event.nativeEvent.pageX, event.nativeEvent.pageY);
              }}
              style={[
                styles.balloonHitArea,
                {
                  left: balloon.x - balloonW / 2,
                  top: balloon.y - balloonH / 2,
                  width: balloonW * resolvedConfig.targetSize,
                  height:
                    (balloonH + BALLOON_KNOT_HEIGHT + BALLOON_STRING_HEIGHT) *
                    resolvedConfig.targetSize,
                  marginLeft: (balloonW - balloonW * resolvedConfig.targetSize) / 2,
                  opacity: resting ? 0.82 : 1,
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
                {resting ? <Text style={styles.recoveryLabel}>{recoveryLabel}</Text> : null}
              </View>
              <View style={[styles.balloonKnot, { borderTopColor: balloon.color }]} />
              <View style={styles.balloonString} />
            </TouchableOpacity>
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
    cloud1: { width: 70, height: 28, top: 22, left: 24 },
    cloud2: { width: 56, height: 22, top: 56, right: 60 },
    cloud3: { width: 64, height: 24, top: 90, left: 80 },
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
    inputOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1, opacity: 0 },
    zoneRow: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 1 },
    targetZone: {
      flex: 1,
      margin: 24,
      borderWidth: 2,
      borderColor: `${colors.cardFront}25`,
      borderRadius: 18,
    },
    sideControl: { flex: 1 },
    balloonHitArea: { position: 'absolute', alignItems: 'center', zIndex: 2 },
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
    balloonString: { width: 1.5, height: BALLOON_STRING_HEIGHT, backgroundColor: colors.matched },
    recoveryLabel: {
      position: 'absolute',
      left: 4,
      right: 4,
      top: '40%',
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
