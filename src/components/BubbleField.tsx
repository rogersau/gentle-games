import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  GestureResponderEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '../types';
import {
  Bubble,
  ensureMinimumBubbles,
  findBubbleAtPoint,
  getBubbleHitRadius,
  positionStillBubbles,
  spawnBubbles,
  stepBubbles,
} from '../utils/bubbleLogic';
import { useThemeColors } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { Radius } from '../ui/tokens';
import { FontFamily } from '../ui/fonts';

interface PopIndicator {
  id: string;
  x: number;
  y: number;
  life: number;
}

interface BubbleFieldProps {
  width: number;
  height: number;
  minActiveBubbles?: number;
  maxActiveBubbles?: number;
  spawnIntervalMs?: number;
  onBubblePop?: () => void;
  motionEnabled?: boolean;
  /** Force the stationary, keyboard/switch-friendly interaction mode. */
  accessibleMode?: boolean;
  /** Whether the containing route is currently focused. */
  isFocused?: boolean;
  /** Screens with their own motion control can hide the in-board switch. */
  showModeToggle?: boolean;
}

const POP_INDICATOR_DECAY_PER_SECOND = 3;
const POP_INDICATOR_FLOAT_PER_SECOND = 28;
const SNAPSHOT_INTERVAL_MS = 1000 / 30;
const TAP_SLOP = 20;

interface BubbleTouch {
  id: string;
  pageX: number;
  pageY: number;
}

interface BubbleFieldSnapshot {
  bubbles: Bubble[];
  popIndicators: PopIndicator[];
}

const haveSameIds = <T extends { id: string }>(left: T[], right: T[]): boolean =>
  left.length === right.length && left.every((item, index) => item.id === right[index]?.id);

export const BubbleField: React.FC<BubbleFieldProps> = ({
  width,
  height,
  minActiveBubbles = 2,
  maxActiveBubbles = 12,
  spawnIntervalMs = 800,
  onBubblePop,
  motionEnabled = true,
  accessibleMode,
  isFocused = true,
  showModeToggle = true,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [manualAccessibleMode, setManualAccessibleMode] = useState(false);
  const isAccessibleMode =
    accessibleMode === true || manualAccessibleMode || screenReaderEnabled || !motionEnabled;
  const replenishBubbles = useCallback(
    (bubbles: Bubble[], lastPop?: Bubble) => {
      const limit = isAccessibleMode
        ? Math.min(minActiveBubbles, maxActiveBubbles)
        : maxActiveBubbles;
      const nextBubbles = ensureMinimumBubbles(bubbles, minActiveBubbles, width, height, limit);
      return isAccessibleMode
        ? positionStillBubbles(nextBubbles, width, height, lastPop)
        : nextBubbles;
    },
    [height, isAccessibleMode, maxActiveBubbles, minActiveBubbles, width],
  );
  const [snapshot, setSnapshot] = useState<BubbleFieldSnapshot>(() => ({
    bubbles: replenishBubbles([]),
    popIndicators: [],
  }));

  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const spawnAccumulatorRef = useRef<number>(0);
  const widthRef = useRef<number>(width);
  const heightRef = useRef<number>(height);
  const bubblesRef = useRef<Bubble[]>(snapshot.bubbles);
  const visibleBubblesRef = useRef(snapshot.bubbles);
  const touchRef = useRef<BubbleTouch | null>(null);
  const popIndicatorsRef = useRef<PopIndicator[]>(snapshot.popIndicators);
  const nextPopIndicatorIdRef = useRef(1);
  const renderedBubbleIdsRef = useRef(snapshot.bubbles.map((bubble) => bubble.id));
  const renderedPopIndicatorIdsRef = useRef<string[]>([]);
  const lastSnapshotTimeRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);
  const [appState, setAppState] = useState(AppState.currentState);
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');

  useLayoutEffect(() => {
    visibleBubblesRef.current = snapshot.bubbles;
  }, [snapshot.bubbles]);

  useEffect(() => {
    // React Native Web currently reports screen-reader support as enabled for
    // every browser, so using that value would make moving mode impossible.
    // Web players can still choose the explicit stationary button mode below.
    if (Platform.OS === 'web') {
      setScreenReaderEnabled(false);
      return;
    }

    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled()
      .then((enabled) => {
        if (mounted) setScreenReaderEnabled(enabled);
      })
      .catch(() => {
        // Some web/test environments do not expose a screen-reader preference.
      });

    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      setScreenReaderEnabled(enabled);
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  const publishSnapshot = useCallback(
    (
      nextBubbles: Bubble[],
      nextPopIndicators: PopIndicator[],
      forceRender = false,
      frameTime?: number,
    ) => {
      bubblesRef.current = nextBubbles;
      popIndicatorsRef.current = nextPopIndicators;
      const bubblesChanged = !haveSameIds(
        renderedBubbleIdsRef.current.map((id) => ({ id })),
        nextBubbles,
      );
      const indicatorsChanged = !haveSameIds(
        renderedPopIndicatorIdsRef.current.map((id) => ({ id })),
        nextPopIndicators,
      );
      const snapshotDue =
        frameTime !== undefined && frameTime - lastSnapshotTimeRef.current >= SNAPSHOT_INTERVAL_MS;
      if (forceRender || bubblesChanged || indicatorsChanged || snapshotDue) {
        renderedBubbleIdsRef.current = nextBubbles.map((bubble) => bubble.id);
        renderedPopIndicatorIdsRef.current = nextPopIndicators.map((indicator) => indicator.id);
        if (frameTime !== undefined) {
          lastSnapshotTimeRef.current = frameTime;
        }
        setSnapshot({ bubbles: nextBubbles, popIndicators: nextPopIndicators });
      }
    },
    [],
  );

  useLayoutEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
    touchRef.current = null;
    publishSnapshot(
      replenishBubbles(bubblesRef.current),
      isAccessibleMode ? [] : popIndicatorsRef.current,
      true,
    );
  }, [height, isAccessibleMode, publishSnapshot, replenishBubbles, width]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      touchRef.current = null;
      lastFrameTimeRef.current = 0;
      setAppState(nextState);
    });
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (
      !motionEnabled ||
      isAccessibleMode ||
      !isFocused ||
      appState === 'background' ||
      appState === 'inactive'
    )
      return;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled || appStateRef.current === 'background' || appStateRef.current === 'inactive')
        return;
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = now;
      const elapsedMs = Math.min(now - lastFrameTimeRef.current, 50);
      lastFrameTimeRef.current = now;
      spawnAccumulatorRef.current += elapsedMs;
      const spawnCount = Math.floor(spawnAccumulatorRef.current / spawnIntervalMs);
      if (spawnCount > 0) spawnAccumulatorRef.current -= spawnCount * spawnIntervalMs;
      let nextBubbles = stepBubbles(bubblesRef.current, elapsedMs / 1000, heightRef.current);
      if (spawnCount > 0 && nextBubbles.length < maxActiveBubbles) {
        nextBubbles = spawnBubbles(
          nextBubbles,
          Math.min(spawnCount, maxActiveBubbles - nextBubbles.length),
          widthRef.current,
          heightRef.current,
        );
      }
      nextBubbles = ensureMinimumBubbles(
        nextBubbles,
        minActiveBubbles,
        widthRef.current,
        heightRef.current,
        maxActiveBubbles,
      );
      const nextPopIndicators = popIndicatorsRef.current
        .map((indicator) => ({
          ...indicator,
          y: indicator.y - (elapsedMs / 1000) * POP_INDICATOR_FLOAT_PER_SECOND,
          life: indicator.life - (elapsedMs / 1000) * POP_INDICATOR_DECAY_PER_SECOND,
        }))
        .filter((indicator) => indicator.life > 0);
      publishSnapshot(nextBubbles, nextPopIndicators, false, now);
      frameRef.current = requestAnimationFrame(tick);
    };
    lastFrameTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      touchRef.current = null;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastFrameTimeRef.current = 0;
      lastSnapshotTimeRef.current = 0;
    };
  }, [
    appState,
    isAccessibleMode,
    isFocused,
    maxActiveBubbles,
    minActiveBubbles,
    publishSnapshot,
    spawnIntervalMs,
    motionEnabled,
  ]);

  const popBubble = useCallback(
    (bubbleId: string) => {
      if (
        !isFocused ||
        appStateRef.current === 'background' ||
        appStateRef.current === 'inactive'
      ) {
        return;
      }
      const poppedIndex = bubblesRef.current.findIndex((bubble) => bubble.id === bubbleId);
      const poppedBubble = bubblesRef.current[poppedIndex];
      if (!poppedBubble) return;

      const nextBubbles = replenishBubbles(
        bubblesRef.current.filter((bubble) => bubble.id !== bubbleId),
        poppedBubble,
      );
      if (isAccessibleMode && nextBubbles.length === bubblesRef.current.length) {
        // Keep the replacement in the same button so repeated keyboard presses retain focus.
        const replacement = nextBubbles.pop();
        if (replacement) nextBubbles.splice(poppedIndex, 0, replacement);
      }
      const nextPopIndicators =
        motionEnabled && !isAccessibleMode
          ? [
              ...popIndicatorsRef.current,
              {
                id: 'pop-' + nextPopIndicatorIdRef.current++,
                x: poppedBubble.x,
                y: poppedBubble.y,
                life: 1,
              },
            ]
          : [];

      publishSnapshot(nextBubbles, nextPopIndicators, true);
      if (isAccessibleMode) {
        setAccessibilityAnnouncement(t('games.bubblePop.newBubbleAnnouncement'));
      }
      onBubblePop?.();
    },
    [isAccessibleMode, isFocused, motionEnabled, onBubblePop, publishSnapshot, replenishBubbles, t],
  );

  const panResponder = useMemo(() => {
    const getTouchedBubble = ({ nativeEvent }: GestureResponderEvent) =>
      findBubbleAtPoint(
        visibleBubblesRef.current,
        { x: nativeEvent.locationX, y: nativeEvent.locationY },
        widthRef.current,
        heightRef.current,
      );
    const withinTapSlop = ({ nativeEvent }: GestureResponderEvent, touch: BubbleTouch) =>
      (nativeEvent.pageX - touch.pageX) ** 2 + (nativeEvent.pageY - touch.pageY) ** 2 <=
      TAP_SLOP ** 2;

    return PanResponder.create({
      onStartShouldSetPanResponder: (event) => isFocused && getTouchedBubble(event) !== undefined,
      onPanResponderGrant: (event) => {
        const bubble = getTouchedBubble(event);
        const { pageX, pageY } = event.nativeEvent;
        touchRef.current = bubble ? { id: bubble.id, pageX, pageY } : null;
      },
      onPanResponderStart: (_, gesture) => {
        if (gesture.numberActiveTouches > 1) touchRef.current = null;
      },
      onPanResponderMove: (event) => {
        if (touchRef.current && !withinTapSlop(event, touchRef.current)) touchRef.current = null;
      },
      onPanResponderRelease: (event) => {
        const touch = touchRef.current;
        touchRef.current = null;
        if (touch && withinTapSlop(event, touch)) popBubble(touch.id);
      },
      onPanResponderTerminate: () => {
        touchRef.current = null;
      },
      // Let the surrounding scroll view take over on a swipe.
      onShouldBlockNativeResponder: () => false,
    });
  }, [isFocused, popBubble]);

  return (
    <View
      style={[styles.container, { width, height }]}
      accessible={!isAccessibleMode}
      accessibilityLabel={isAccessibleMode ? undefined : t('games.bubblePop.accessibility')}
    >
      <Svg width={width} height={height}>
        {snapshot.bubbles.map((bubble) => (
          <React.Fragment key={bubble.id}>
            <Circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.radius}
              fill={bubble.color}
              fillOpacity={Math.max(0.6, bubble.opacity)}
              stroke={colors.textLight}
              strokeWidth={2}
            />
            <Circle
              cx={bubble.x - bubble.radius * 0.25}
              cy={bubble.y - bubble.radius * 0.3}
              r={Math.max(3, bubble.radius * 0.25)}
              fill={colors.cardFront}
              opacity={0.35}
            />
          </React.Fragment>
        ))}
        {snapshot.popIndicators.map((indicator) => (
          <React.Fragment key={indicator.id}>
            <Circle
              cx={indicator.x}
              cy={indicator.y}
              r={10 + (1 - indicator.life) * 14}
              fill='none'
              stroke={colors.cardFront}
              strokeWidth={2}
              opacity={indicator.life * 0.8}
            />
            <SvgText
              x={indicator.x}
              y={indicator.y - 2}
              fill={colors.secondary}
              fontSize={16}
              fontFamily={FontFamily.bold}
              fontWeight='700'
              textAnchor='middle'
              opacity={indicator.life}
            >
              {t('games.bubblePop.pop')}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      {isAccessibleMode ? (
        <View
          style={styles.accessibleLayer}
          accessibilityLabel={t('games.bubblePop.accessibility')}
        >
          {snapshot.bubbles.map((bubble, index) => {
            const targetSize = Math.min(width, height, getBubbleHitRadius(bubble.radius) * 2);
            return (
              <Pressable
                key={index}
                testID={'bubble-button-' + bubble.id}
                style={[
                  styles.bubbleButton,
                  {
                    width: targetSize,
                    height: targetSize,
                    left: bubble.x - targetSize / 2,
                    top: bubble.y - targetSize / 2,
                    borderRadius: targetSize / 2,
                  },
                ]}
                accessibilityRole='button'
                accessibilityLabel={t('games.bubblePop.bubbleAccessibilityLabel', {
                  number: index + 1,
                })}
                accessibilityHint={t('games.bubblePop.bubbleAccessibilityHint')}
                onPress={() => popBubble(bubble.id)}
              />
            );
          })}
          <View
            style={styles.announcement}
            accessibilityRole='text'
            accessibilityLiveRegion='polite'
            accessibilityLabel={accessibilityAnnouncement}
          >
            <Text>{accessibilityAnnouncement}</Text>
          </View>
        </View>
      ) : (
        <View testID='bubble-touch-layer' style={styles.touchLayer} {...panResponder.panHandlers} />
      )}
      {showModeToggle && motionEnabled && !screenReaderEnabled && accessibleMode !== true ? (
        <Pressable
          testID='bubble-accessible-mode-toggle'
          style={styles.modeToggle}
          accessibilityRole='button'
          accessibilityState={{ selected: manualAccessibleMode }}
          accessibilityLabel={t(
            manualAccessibleMode
              ? 'games.bubblePop.useMovingMode'
              : 'games.bubblePop.useAccessibleMode',
          )}
          accessibilityHint={t('games.bubblePop.modeToggleHint')}
          onPress={() => setManualAccessibleMode((enabled) => !enabled)}
        >
          <Text style={styles.modeToggleText}>
            {t(
              manualAccessibleMode
                ? 'games.bubblePop.movingMode'
                : 'games.bubblePop.accessibleMode',
            )}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      borderRadius: Radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surfaceGame,
    },
    touchLayer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    accessibleLayer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    bubbleButton: {
      position: 'absolute',
      backgroundColor: 'transparent',
    },
    announcement: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    modeToggle: {
      position: 'absolute',
      top: 8,
      right: 8,
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      zIndex: 2,
    },
    modeToggleText: {
      color: colors.text,
      fontFamily: FontFamily.bold,
      fontSize: 14,
    },
  });
