import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '../types';
import { Bubble, ensureMinimumBubbles, spawnBubbles, stepBubbles } from '../utils/bubbleLogic';
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
}

const POP_INDICATOR_DECAY_PER_SECOND = 3;
const POP_INDICATOR_FLOAT_PER_SECOND = 28;

const shouldUseDeclarativeFrameUpdates = (): boolean => Platform.OS === 'web';

interface BubbleFieldSnapshot {
  bubbles: Bubble[];
  popIndicators: PopIndicator[];
}

type SvgNode = {
  setNativeProps?: (props: Record<string, unknown>) => void;
};

interface BubbleVisualNodes {
  bubble?: SvgNode;
  highlight?: SvgNode;
}

interface PopIndicatorVisualNodes {
  circle?: SvgNode;
  label?: SvgNode;
}

const haveSameIds = <T extends { id: string }>(left: T[], right: T[]): boolean =>
  left.length === right.length && left.every((item, index) => item.id === right[index]?.id);

const keepBubblesVisible = (bubbles: Bubble[], width: number, height: number): Bubble[] =>
  bubbles.map((bubble, index) => {
    const hitTargetRadius = Math.max(32, bubble.radius + 8);
    const minX = Math.min(width / 2, hitTargetRadius);
    const maxX = Math.max(minX, width - hitTargetRadius);
    const minY = Math.min(height / 2, hitTargetRadius);
    const maxY = Math.max(minY, height - hitTargetRadius);
    const slot = (index + 1) / (bubbles.length + 1);

    return {
      ...bubble,
      x: bubble.x >= minX && bubble.x <= maxX ? bubble.x : minX + (maxX - minX) * slot,
      y: bubble.y >= minY && bubble.y <= maxY ? bubble.y : minY + (maxY - minY) * slot,
    };
  });

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
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<BubbleFieldSnapshot>(() => {
    let initialBubbles = ensureMinimumBubbles(
      [],
      minActiveBubbles,
      width,
      height,
      maxActiveBubbles,
    );
    if (accessibleMode === true || !motionEnabled) {
      initialBubbles = keepBubblesVisible(initialBubbles, width, height);
    }
    return {
      bubbles: initialBubbles,
      popIndicators: [],
    };
  });

  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const spawnAccumulatorRef = useRef<number>(0);
  const widthRef = useRef<number>(width);
  const heightRef = useRef<number>(height);
  const bubblesRef = useRef<Bubble[]>(snapshot.bubbles);
  const popIndicatorsRef = useRef<PopIndicator[]>(snapshot.popIndicators);
  const bubbleLabelNumbersRef = useRef(new Map<string, number>());
  const nextBubbleLabelNumberRef = useRef(1);
  const nextPopIndicatorIdRef = useRef(1);
  const bubbleVisualNodesRef = useRef(new Map<string, BubbleVisualNodes>());
  const popIndicatorVisualNodesRef = useRef(new Map<string, PopIndicatorVisualNodes>());
  const renderedBubbleIdsRef = useRef(snapshot.bubbles.map((bubble) => bubble.id));
  const renderedPopIndicatorIdsRef = useRef<string[]>([]);
  const appStateRef = useRef(AppState.currentState);
  const [appState, setAppState] = useState(AppState.currentState);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [manualAccessibleMode, setManualAccessibleMode] = useState(false);
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');
  const isAccessibleMode =
    accessibleMode === true || manualAccessibleMode || screenReaderEnabled || !motionEnabled;

  useEffect(() => {
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

  const updateVisualNodes = useCallback((nextBubbles: Bubble[], nextPopIndicators: PopIndicator[]) => {
    nextBubbles.forEach((bubble) => {
      const nodes = bubbleVisualNodesRef.current.get(bubble.id);
      nodes?.bubble?.setNativeProps?.({
        cx: bubble.x,
        cy: bubble.y,
        r: bubble.radius,
        opacity: bubble.opacity,
      });
      nodes?.highlight?.setNativeProps?.({
        cx: bubble.x - bubble.radius * 0.25,
        cy: bubble.y - bubble.radius * 0.3,
        r: Math.max(3, bubble.radius * 0.25),
      });
    });
    nextPopIndicators.forEach((indicator) => {
      const nodes = popIndicatorVisualNodesRef.current.get(indicator.id);
      nodes?.circle?.setNativeProps?.({
        cx: indicator.x,
        cy: indicator.y,
        r: 10 + (1 - indicator.life) * 14,
        opacity: indicator.life * 0.8,
      });
      nodes?.label?.setNativeProps?.({
        x: indicator.x,
        y: indicator.y - 2,
        opacity: indicator.life,
      });
    });
  }, []);

  const publishSnapshot = useCallback((
    nextBubbles: Bubble[],
    nextPopIndicators: PopIndicator[],
    forceRender = false,
  ) => {
    bubblesRef.current = nextBubbles;
    popIndicatorsRef.current = nextPopIndicators;
    updateVisualNodes(nextBubbles, nextPopIndicators);
    const bubblesChanged = !haveSameIds(
      renderedBubbleIdsRef.current.map((id) => ({ id })),
      nextBubbles,
    );
    const indicatorsChanged = !haveSameIds(
      renderedPopIndicatorIdsRef.current.map((id) => ({ id })),
      nextPopIndicators,
    );
    if (forceRender || bubblesChanged || indicatorsChanged || shouldUseDeclarativeFrameUpdates()) {
      renderedBubbleIdsRef.current = nextBubbles.map((bubble) => bubble.id);
      renderedPopIndicatorIdsRef.current = nextPopIndicators.map((indicator) => indicator.id);
      setSnapshot({ bubbles: nextBubbles, popIndicators: nextPopIndicators });
    }
  }, [updateVisualNodes]);

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
    let nextBubbles = ensureMinimumBubbles(
      bubblesRef.current,
      minActiveBubbles,
      width,
      height,
      maxActiveBubbles,
    );
    if (isAccessibleMode) {
      nextBubbles = keepBubblesVisible(nextBubbles, width, height);
    }
    publishSnapshot(
      nextBubbles,
      popIndicatorsRef.current,
      true,
    );
  }, [height, isAccessibleMode, maxActiveBubbles, minActiveBubbles, publishSnapshot, width]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      lastFrameTimeRef.current = 0;
      setAppState(nextState);
    });
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (!motionEnabled || isAccessibleMode || !isFocused || appState === 'background' || appState === 'inactive') return;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled || appStateRef.current === 'background' || appStateRef.current === 'inactive') return;
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
      publishSnapshot(nextBubbles, nextPopIndicators);
      frameRef.current = requestAnimationFrame(tick);
    };
    lastFrameTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastFrameTimeRef.current = 0;
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

  useEffect(() => {
    return () => {
      bubbleVisualNodesRef.current.clear();
      popIndicatorVisualNodesRef.current.clear();
    };
  }, []);

  const getBubbleLabelNumber = (bubbleId: string): number => {
    const existingNumber = bubbleLabelNumbersRef.current.get(bubbleId);
    if (existingNumber !== undefined) return existingNumber;
    const nextNumber = nextBubbleLabelNumberRef.current++;
    bubbleLabelNumbersRef.current.set(bubbleId, nextNumber);
    return nextNumber;
  };

  const popBubble = useCallback(
    (bubbleId: string, locationX?: number, locationY?: number) => {
      const poppedBubble = bubblesRef.current.find((bubble) => bubble.id === bubbleId);
      if (!poppedBubble) return;

      let nextBubbles = ensureMinimumBubbles(
        bubblesRef.current.filter((bubble) => bubble.id !== poppedBubble.id),
        minActiveBubbles,
        widthRef.current,
        heightRef.current,
        maxActiveBubbles,
      );
      if (isAccessibleMode) {
        nextBubbles = keepBubblesVisible(nextBubbles, widthRef.current, heightRef.current);
      }
      const nextPopIndicators = motionEnabled && !isAccessibleMode
        ? [
            ...popIndicatorsRef.current,
            {
              id: 'pop-' + nextPopIndicatorIdRef.current++,
              x: locationX ?? poppedBubble.x,
              y: locationY ?? poppedBubble.y,
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
    [isAccessibleMode, maxActiveBubbles, minActiveBubbles, motionEnabled, onBubblePop, publishSnapshot, t],
  );

  const setBubbleVisualNode = useCallback(
    (bubbleId: string, part: keyof BubbleVisualNodes, node: SvgNode | null) => {
      const nodes = bubbleVisualNodesRef.current.get(bubbleId) ?? {};
      if (node) {
        nodes[part] = node;
        bubbleVisualNodesRef.current.set(bubbleId, nodes);
      } else {
        delete nodes[part];
        if (!nodes.bubble && !nodes.highlight) bubbleVisualNodesRef.current.delete(bubbleId);
      }
    },
    [],
  );

  const setPopIndicatorVisualNode = useCallback(
    (indicatorId: string, part: keyof PopIndicatorVisualNodes, node: SvgNode | null) => {
      const nodes = popIndicatorVisualNodesRef.current.get(indicatorId) ?? {};
      if (node) {
        nodes[part] = node;
        popIndicatorVisualNodesRef.current.set(indicatorId, nodes);
      } else {
        delete nodes[part];
        if (!nodes.circle && !nodes.label) popIndicatorVisualNodesRef.current.delete(indicatorId);
      }
    },
    [],
  );

  useEffect(() => {
    updateVisualNodes(snapshot.bubbles, snapshot.popIndicators);
  }, [snapshot, updateVisualNodes]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => false,
        onPanResponderRelease: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const poppedBubble = bubblesRef.current.find((bubble) => {
            const dx = bubble.x - locationX;
            const dy = bubble.y - locationY;
            return dx * dx + dy * dy <= bubble.radius * bubble.radius;
          });

          if (!poppedBubble) {
            return;
          }

          popBubble(poppedBubble.id, locationX, locationY);
        },
      }),
    [popBubble],
  );

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
              ref={(node) => setBubbleVisualNode(bubble.id, 'bubble', node)}
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.radius}
              fill={bubble.color}
              opacity={bubble.opacity}
              stroke={colors.cardFront}
              strokeWidth={2}
            />
            <Circle
              ref={(node) => setBubbleVisualNode(bubble.id, 'highlight', node)}
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
              ref={(node) => setPopIndicatorVisualNode(indicator.id, 'circle', node)}
              cx={indicator.x}
              cy={indicator.y}
              r={10 + (1 - indicator.life) * 14}
              fill='none'
              stroke={colors.cardFront}
              strokeWidth={2}
              opacity={indicator.life * 0.8}
            />
            <SvgText
              ref={(node) => setPopIndicatorVisualNode(indicator.id, 'label', node)}
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
        <View style={styles.accessibleLayer} accessibilityLabel={t('games.bubblePop.accessibility')}>
          {snapshot.bubbles.map((bubble) => {
            const targetSize = Math.max(64, bubble.radius * 2 + 16);
            return (
              <Pressable
                key={bubble.id}
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
                  number: getBubbleLabelNumber(bubble.id),
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
        <View style={styles.touchLayer} {...panResponder.panHandlers} />
      )}
      {motionEnabled && !screenReaderEnabled && accessibleMode !== true ? (
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
