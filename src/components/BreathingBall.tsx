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
  { primary: '#A8D8EA', accent: '#D4A9E6', name: 'Ocean' },
  { primary: '#FFB6C1', accent: '#FF9E9E', name: 'Rose' },
  { primary: '#B8E6B8', accent: '#98FB98', name: 'Mint' },
  { primary: '#F4A460', accent: '#DDA0DD', name: 'Sunset' },
  { primary: '#C9B1FF', accent: '#87CEFA', name: 'Lavender' },
];

interface BreathingBallProps {
  size: number;
  baseSize?: number;
  expandSize?: number;
  colorScheme?: BallColorScheme;
  autoStart?: boolean;
  onPhaseChange?: (phase: BreathingGardenPhase) => void;
  onCycleComplete?: (cycleCount: number) => void;
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
