import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
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
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<BubbleFieldSnapshot>(() => {
    const initialBubbles = ensureMinimumBubbles([], minActiveBubbles, width, height, maxActiveBubbles);
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
      ensureMinimumBubbles(
        bubblesRef.current,
        minActiveBubbles,
        width,
        height,
        maxActiveBubbles
      ),
      popIndicatorsRef.current
    );
  }, [height, maxActiveBubbles, minActiveBubbles, width]);

  useEffect(() => {
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
          heightRef.current
        );
      }

      nextBubbles = ensureMinimumBubbles(
        nextBubbles,
        minActiveBubbles,
        widthRef.current,
        heightRef.current,
        maxActiveBubbles
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
  }, [maxActiveBubbles, minActiveBubbles, spawnIntervalMs]);

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

          const nextBubbles = ensureMinimumBubbles(
            bubblesRef.current.filter((bubble) => bubble.id !== poppedBubble.id),
            minActiveBubbles,
            widthRef.current,
            heightRef.current,
            maxActiveBubbles
          );
          const nextPopIndicators = [
            ...popIndicatorsRef.current,
            {
              id: `pop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              x: locationX,
              y: locationY,
              life: 1,
            },
          ];

          publishSnapshot(nextBubbles, nextPopIndicators);
          onBubblePop?.();
        },
      }),
    [maxActiveBubbles, minActiveBubbles, onBubblePop]
  );

  return (
    <View
      style={[styles.container, { width, height }]}
      accessible={true}
      accessibilityLabel={t('games.bubblePop.accessibility')}
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
              fill="none"
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
              fontWeight="700"
              textAnchor="middle"
              opacity={indicator.life}
            >
              {t('games.bubblePop.pop')}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <View style={styles.touchLayer} {...panResponder.panHandlers} />
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
  });
