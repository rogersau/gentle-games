import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { PASTEL_COLORS } from '../types';
import { Bubble, ensureMinimumBubbles, spawnBubbles, stepBubbles } from '../utils/bubbleLogic';

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

export const BubbleField: React.FC<BubbleFieldProps> = ({
  width,
  height,
  minActiveBubbles = 2,
  maxActiveBubbles = 12,
  spawnIntervalMs = 800,
  onBubblePop,
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    ensureMinimumBubbles([], minActiveBubbles, width, maxActiveBubbles)
  );
  const [popIndicators, setPopIndicators] = useState<PopIndicator[]>([]);

  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const spawnAccumulatorRef = useRef<number>(0);
  const widthRef = useRef<number>(width);
  const heightRef = useRef<number>(height);
  const bubblesRef = useRef<Bubble[]>(bubbles);

  useEffect(() => {
    bubblesRef.current = bubbles;
  }, [bubbles]);

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
    setBubbles((prev) => ensureMinimumBubbles(prev, minActiveBubbles, width, maxActiveBubbles));
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

      setBubbles((prev) => {
        let next = stepBubbles(prev, elapsedMs / 1000, heightRef.current);

        if (spawnCount > 0 && next.length < maxActiveBubbles) {
          next = spawnBubbles(next, Math.min(spawnCount, maxActiveBubbles - next.length), widthRef.current);
        }

        next = ensureMinimumBubbles(
          next,
          minActiveBubbles,
          widthRef.current,
          maxActiveBubbles
        );
        return next;
      });
      setPopIndicators((prev) =>
        prev
          .map((indicator) => ({
            ...indicator,
            y: indicator.y - (elapsedMs / 1000) * 28,
            life: indicator.life - (elapsedMs / 1000) * POP_INDICATOR_DECAY_PER_SECOND,
          }))
          .filter((indicator) => indicator.life > 0)
      );

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
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

          setBubbles((prev) => {
            const next = prev.filter((bubble) => bubble.id !== poppedBubble.id);
            return ensureMinimumBubbles(next, minActiveBubbles, widthRef.current, maxActiveBubbles);
          });
          setPopIndicators((prev) => [
            ...prev,
            {
              id: `pop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              x: locationX,
              y: locationY,
              life: 1,
            },
          ]);
          onBubblePop?.();
        },
      }),
    [maxActiveBubbles, minActiveBubbles, onBubblePop]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {bubbles.map((bubble) => (
          <React.Fragment key={bubble.id}>
            <Circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.radius}
              fill={bubble.color}
              opacity={bubble.opacity}
              stroke={PASTEL_COLORS.cardFront}
              strokeWidth={2}
            />
            <Circle
              cx={bubble.x - bubble.radius * 0.25}
              cy={bubble.y - bubble.radius * 0.3}
              r={Math.max(3, bubble.radius * 0.25)}
              fill={PASTEL_COLORS.cardFront}
              opacity={0.35}
            />
          </React.Fragment>
        ))}
        {popIndicators.map((indicator) => (
          <React.Fragment key={indicator.id}>
            <Circle
              cx={indicator.x}
              cy={indicator.y}
              r={10 + (1 - indicator.life) * 14}
              fill="none"
              stroke={PASTEL_COLORS.cardFront}
              strokeWidth={2}
              opacity={indicator.life * 0.8}
            />
            <SvgText
              x={indicator.x}
              y={indicator.y - 2}
              fill={PASTEL_COLORS.secondary}
              fontSize={16}
              fontWeight="700"
              textAnchor="middle"
              opacity={indicator.life}
            >
              Pop!
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <View style={styles.touchLayer} {...panResponder.panHandlers} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: PASTEL_COLORS.cardFront,
  },
  touchLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

