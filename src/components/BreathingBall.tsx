import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  BREATHING_CYCLE_DURATION_MS,
  getBreathingPhase,
  getBreathingPhaseProgress,
  type BreathingGardenPhase,
} from '../utils/breathingGardenLogic';

export interface BreathingBallRef {
  getPhase: () => BreathingGardenPhase;
  getCycleCount: () => number;
  getElapsedMs: () => number;
  reset: () => void;
  pause: () => void;
  resume: () => void;
}

export interface BallColorScheme {
  primary: string;
  accent: string;
  name: string;
}

export const defaultColorSchemes: BallColorScheme[] = [
  { primary: '#B4D7E8', accent: '#7FB3D5', name: 'Ocean' },
  { primary: '#F5C6D6', accent: '#E8A4C9', name: 'Rose' },
  { primary: '#C8E6C9', accent: '#A5D6A7', name: 'Mint' },
  { primary: '#FFE0B2', accent: '#FFCC80', name: 'Sunset' },
  { primary: '#E1BEE7', accent: '#CE93D8', name: 'Lavender' },
];

interface BreathingBallProps {
  size: number;
  baseSize?: number;
  expandSize?: number;
  colorScheme?: BallColorScheme;
  autoStart?: boolean;
  onPhaseChange?: (phase: BreathingGardenPhase) => void;
  onCycleComplete?: (cycleCount: number) => void;
  onProgress?: (progress: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const BreathingBall = forwardRef<BreathingBallRef, BreathingBallProps>(
  (
    {
      size,
      baseSize = 120,
      expandSize = 210,
      colorScheme = defaultColorSchemes[0],
      autoStart = true,
      onPhaseChange,
      onCycleComplete,
      onProgress,
    },
    ref
  ) => {
    const [isRunning, setIsRunning] = useState(autoStart);
    const [elapsedMs, setElapsedMs] = useState(0);
    const lastTimeRef = useRef<number>(0);
    const frameRef = useRef<number | null>(null);
    const previousPhaseRef = useRef<BreathingGardenPhase | null>(null);
    const previousCycleRef = useRef<number>(0);

    const { phase, phaseProgress, cycleCount } = useMemo(() => {
      const currentPhase = getBreathingPhase(elapsedMs);
      const progress = getBreathingPhaseProgress(elapsedMs);
      const cycles = Math.floor(elapsedMs / BREATHING_CYCLE_DURATION_MS);

      return {
        phase: currentPhase,
        phaseProgress: progress,
        cycleCount: cycles,
      };
    }, [elapsedMs]);

    const ballSize = useMemo(() => {
      const sizeMultiplier = phase === 'inhale' ? phaseProgress : 1 - phaseProgress;
      return baseSize + sizeMultiplier * (expandSize - baseSize);
    }, [phase, phaseProgress, baseSize, expandSize]);

    // Handle phase changes
    useEffect(() => {
      if (previousPhaseRef.current !== null && previousPhaseRef.current !== phase) {
        onPhaseChange?.(phase);
      }
      previousPhaseRef.current = phase;
    }, [phase, onPhaseChange]);

    // Handle cycle completion
    useEffect(() => {
      if (cycleCount > previousCycleRef.current) {
        previousCycleRef.current = cycleCount;
        if (cycleCount > 0) {
          onCycleComplete?.(cycleCount);
        }
      }
    }, [cycleCount, onCycleComplete]);

    // Report progress
    useEffect(() => {
      onProgress?.(phaseProgress);
    }, [phaseProgress, onProgress]);

    useImperativeHandle(
      ref,
      () => ({
        getPhase: () => phase,
        getCycleCount: () => cycleCount,
        getElapsedMs: () => elapsedMs,
        reset: () => {
          setElapsedMs(0);
          lastTimeRef.current = 0;
          previousPhaseRef.current = null;
        },
        pause: () => setIsRunning(false),
        resume: () => setIsRunning(true),
      }),
      [phase, cycleCount, elapsedMs]
    );

    useEffect(() => {
      if (!isRunning) {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
        lastTimeRef.current = 0;
        return;
      }

      const tick = (time: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time;
        }

        const deltaMs = time - lastTimeRef.current;
        lastTimeRef.current = time;

        setElapsedMs((prev) => prev + deltaMs);
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [isRunning]);

    const center = size / 2;
    const ballRadius = ballSize / 2;
    // Rings expand to the edge of the container (size/2 minus padding for stroke)
    const maxRingRadius = (size / 2) - 2;

    // Generate breathing rings that expand outward
    const ringCount = 5;
    const rings = useMemo(() => {
      return Array.from({ length: ringCount }, (_, index) => {
        // Each ring is offset in the breathing cycle
        const ringOffset = (index / ringCount) * 0.9; // 0 to 0.9 offset
        const adjustedProgress = (phaseProgress + ringOffset) % 1;

        // Ring expands during inhale, contracts/fades during exhale
        const ringPhase = phase === 'inhale' ? adjustedProgress : 1 - adjustedProgress;
        // Apply easing for smoother growth - faster at start, slower at end
        const easedPhase = Math.pow(ringPhase, 0.5);
        const ringRadius = ballRadius + easedPhase * (maxRingRadius - ballRadius);
        // Opacity fades to zero as ring reaches the edge
        const baseOpacity = phase === 'inhale'
          ? (1 - adjustedProgress)
          : adjustedProgress;
        // Additional fade based on how close to edge (0 at edge, 1 at center)
        const edgeFade = 1 - (ringRadius / maxRingRadius);
        const ringOpacity = baseOpacity * edgeFade * 0.6;
        const ringStrokeWidth = 5 * (1 - adjustedProgress * 0.7);

        return {
          key: `ring-${index}`,
          r: Math.max(0, ringRadius),
          opacity: Math.max(0, ringOpacity),
          strokeWidth: Math.max(0.5, ringStrokeWidth),
        };
      });
    }, [phase, phaseProgress, ballRadius, maxRingRadius]);

    return (
      <View
        style={[styles.container, { width: size, height: size }]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={`Breathing ball. Current phase: ${phase}. ${cycleCount} cycles completed.`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(phaseProgress * 100) }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="ballFill" cx="35%" cy="35%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor={colorScheme.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colorScheme.accent} stopOpacity="0.95" />
            </RadialGradient>
          </Defs>

          {/* Expanding breathing rings - render behind the main ball */}
          {rings.map((ring) => (
            <Circle
              key={ring.key}
              cx={center}
              cy={center}
              r={ring.r}
              fill="none"
              stroke={colorScheme.accent}
              strokeWidth={ring.strokeWidth}
              opacity={ring.opacity}
            />
          ))}

          {/* Main breathing ball */}
          <Circle
            cx={center}
            cy={center}
            r={ballRadius}
            fill="url(#ballFill)"
            stroke={colorScheme.accent}
            strokeWidth={4}
            opacity={0.9}
          />
        </Svg>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
