import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type MochiVariant = 'floating' | 'idle' | 'happy';
export type MochiSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<MochiSize, { width: number; height: number }> = {
  sm: { width: 44, height: 50 },
  md: { width: 64, height: 72 },
  lg: { width: 100, height: 112 },
};

interface MochiProps {
  variant?: MochiVariant;
  size?: MochiSize;
  color?: string;
  highlightColor?: string;
  shadowColor?: string;
  blushColor?: string;
  animate?: boolean;
  className?: string;
  testID?: string;
}

export const Mochi: React.FC<MochiProps> = ({
  variant = 'idle',
  size = 'md',
  color = '#D4A5E8',
  highlightColor = '#EDE0F5',
  shadowColor = '#C496D8',
  blushColor = '#F0C0D8',
  animate = true,
  className,
  testID = 'mochi',
}) => {
  const { width, height } = SIZE_MAP[size];
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const sparkles = [sparkle1, sparkle2, sparkle3];
  const sparkleAnimRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (!animate) return;

    if (variant === 'floating') {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -3,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      float.start();
      return () => float.stop();
    }

    if (variant === 'idle') {
      const breathe = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      breathe.start();
      return () => breathe.stop();
    }

    if (variant === 'happy') {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
      sparkles.forEach((sparkle) => {
          const loop = Animated.loop(
            Animated.sequence([
              Animated.timing(sparkle, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          );
          sparkleAnimRefs.current.push(loop);
          loop.start();
        });
      return () => {
        sparkleAnimRefs.current.forEach(a => a.stop());
        sparkleAnimRefs.current = [];
      };
    }
  }, [variant, animate, floatAnim, scaleAnim, bounceAnim, sparkle1, sparkle2, sparkle3]);

  const animatedStyle = {
    transform: [
      { translateY: floatAnim },
      { scale: scaleAnim },
      { translateY: bounceAnim },
    ],
  };

  return (
    // @ts-expect-error className not supported in RN but kept for API parity
    <Animated.View style={[styles.container, { width, height }, animatedStyle]} className={className} testID={testID}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Shadow */}
        <Ellipse
          cx={width / 2}
          cy={height - 8}
          rx={width * 0.35}
          ry={6}
          fill={shadowColor}
          opacity={0.3}
        />
        {/* Body */}
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 4}
          ry={height / 2 - 10}
          fill={color}
        />
        {/* Highlight */}
        <Ellipse
          cx={width * 0.35}
          cy={height * 0.3}
          rx={width * 0.12}
          ry={height * 0.08}
          fill={highlightColor}
          opacity={0.6}
        />
        {/* Left leg */}
        <Ellipse
          cx={width * 0.35}
          cy={height - 12}
          rx={8}
          ry={10}
          fill={color}
        />
        {/* Right leg */}
        <Ellipse
          cx={width * 0.65}
          cy={height - 12}
          rx={8}
          ry={10}
          fill={color}
        />
        {/* Left eye arc (happy closed-eye smile) */}
        <Path
          d={`M ${width * 0.32} ${height * 0.45} Q ${width * 0.37} ${height * 0.5} ${width * 0.42} ${height * 0.45}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Right eye arc */}
        <Path
          d={`M ${width * 0.58} ${height * 0.45} Q ${width * 0.63} ${height * 0.5} ${width * 0.68} ${height * 0.45}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Left blush */}
        <Circle cx={width * 0.25} cy={height * 0.52} r={4} fill={blushColor} opacity={0.5} />
        {/* Right blush */}
        <Circle cx={width * 0.75} cy={height * 0.52} r={4} fill={blushColor} opacity={0.5} />
        {/* Smile */}
        <Path
          d={`M ${width * 0.38} ${height * 0.58} Q ${width / 2} ${height * 0.66} ${width * 0.62} ${height * 0.58}`}
          stroke={shadowColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Sparkles — only visible during happy variant */}
        <AnimatedCircle cx={width * 0.1} cy={height * 0.2} r={3} fill={highlightColor} opacity={sparkle1} />
        <AnimatedCircle cx={width * 0.9} cy={height * 0.25} r={2.5} fill={highlightColor} opacity={sparkle2} />
        <AnimatedCircle cx={width * 0.15} cy={height * 0.75} r={2} fill={highlightColor} opacity={sparkle3} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
