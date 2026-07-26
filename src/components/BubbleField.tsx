import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
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
}

const POP_INDICATOR_DECAY_PER_SECOND = 3;
const POP_INDICATOR_FLOAT_PER_SECOND = 28;

interface BubbleFieldSnapshot {
  bubbles: Bubble[];
  popIndicators: PopIndicator[];
}

export const BubbleField: React.FC<BubbleFieldProps> = ({
  width,
  height,
  minActiveBubbles = 2,
  maxActiveBubbles = 12,
  spawnIntervalMs = 800,
  onBubblePop,
  motionEnabled = true,
  accessibleMode,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<BubbleFieldSnapshot>(() => {
    const initialBubbles = ensureMinimumBubbles(
      [],
      minActiveBubbles,
      width,
      height,
      maxActiveBubbles,
    );
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
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');
  const isAccessibleMode = accessibleMode ?? (screenReaderEnabled || !motionEnabled);

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

  const publishSnapshot = (nextBubbles: Bubble[], nextPopIndicators: PopIndicator[]) => {
    bubblesRef.current = nextBubbles;
    popIndicatorsRef.current = nextPopIndicators;
    setSnapshot({
      bubbles: nextBubbles,
      popIndicators: nextPopIndicators,
    });
  };

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
    publishSnapshot(
      ensureMinimumBubbles(bubblesRef.current, minActiveBubbles, width, height, maxActiveBubbles),
      popIndicatorsRef.current,
    );
  }, [height, maxActiveBubbles, minActiveBubbles, width]);

  useEffect(() => {
    if (!motionEnabled || isAccessibleMode) return;
    const tick = (now: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = now;
      }

      const elapsedMs = Math.min(now - lastFrameTimeRef.current, 50);
      lastFrameTimeRef.current = now;
      spawnAccumulatorRef.current += elapsedMs;

      const spawnCount = Math.floor(spawnAccumulatorRef.current / spawnIntervalMs);
      if (spawnCount > 0) {
        spawnAccumulatorRef.current -= spawnCount * spawnIntervalMs;
      }

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

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isAccessibleMode, maxActiveBubbles, minActiveBubbles, spawnIntervalMs, motionEnabled]);

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

      const nextBubbles = ensureMinimumBubbles(
        bubblesRef.current.filter((bubble) => bubble.id !== poppedBubble.id),
        minActiveBubbles,
        widthRef.current,
        heightRef.current,
        maxActiveBubbles,
      );
      const nextPopIndicators = motionEnabled && !isAccessibleMode
        ? [
            ...popIndicatorsRef.current,
            {
              id: 'pop-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              x: locationX ?? poppedBubble.x,
              y: locationY ?? poppedBubble.y,
              life: 1,
            },
          ]
        : [];

      publishSnapshot(nextBubbles, nextPopIndicators);
      if (isAccessibleMode) {
        setAccessibilityAnnouncement(t('games.bubblePop.newBubbleAnnouncement'));
      }
      onBubblePop?.();
    },
    [isAccessibleMode, maxActiveBubbles, minActiveBubbles, motionEnabled, onBubblePop, t],
  );

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
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.radius}
              fill={bubble.color}
              opacity={bubble.opacity}
              stroke={colors.cardFront}
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
  });
