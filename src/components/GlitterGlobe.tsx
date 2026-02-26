import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Svg, { Circle, Defs, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PASTEL_COLORS } from '../types';
import { getMotionForce, shouldTriggerShake } from '../utils/glitterMotion';

type GlitterShape = 'circle' | 'square' | 'diamond' | 'star';

interface GlitterParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shape: GlitterShape;
  color: string;
  opacity: number;
}

export interface GlitterGlobeRef {
  addGlitter: (count?: number) => void;
  clearGlitter: () => void;
}

interface GlitterGlobeProps {
  width: number;
  height: number;
  initialCount?: number;
  maxParticles?: number;
}

const BASE_GRAVITY = 10;
const DRAG = 0.988;
const BOUNCE = 0.4;
const MAX_FRAME_SECONDS = 1 / 30;
const GLOBE_PADDING = 10;
const FINGER_INFLUENCE_RADIUS = 96;
const FINGER_PUSH = 16;
const SHAKE_IMPULSE = 45;
const MAX_SPEED = 65;
const LARGE_PIECE_CHANCE = 0.22;

const PARTICLE_COLORS = [
  '#FF5D8F',
  '#6BCBFF',
  '#FFD166',
  '#B8F559',
  '#C792EA',
  '#FF9E5E',
];
const PARTICLE_SHAPES: GlitterShape[] = ['circle', 'square', 'diamond', 'star'];

let particleCounter = 0;

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

const getStarPoints = (
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number
): string => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

const createParticle = (width: number, height: number): GlitterParticle => {
  const centerX = width / 2;
  const centerY = height / 2;
  const globeRadius = Math.min(width, height) / 2 - GLOBE_PADDING;
  const spawnY = centerY - globeRadius + randomInRange(16, 42);
  const isLargePiece = Math.random() < LARGE_PIECE_CHANCE;

  return {
    id: particleCounter++,
    x: centerX + randomInRange(-globeRadius * 0.35, globeRadius * 0.35),
    y: spawnY,
    vx: randomInRange(-10, 10),
    vy: randomInRange(4, 18),
    radius: isLargePiece ? randomInRange(8.5, 13.5) : randomInRange(2, 4),
    shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    opacity: randomInRange(0.6, 0.95),
  };
};

const createParticles = (count: number, width: number, height: number): GlitterParticle[] =>
  Array.from({ length: count }, () => createParticle(width, height));

const clampParticleToGlobe = (
  particle: GlitterParticle,
  centerX: number,
  centerY: number,
  globeRadius: number
): GlitterParticle => {
  const maxDistance = globeRadius - particle.radius;
  const dx = particle.x - centerX;
  const dy = particle.y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= maxDistance || maxDistance <= 0) {
    return particle;
  }

  const safeDistance = distance || 1;
  const nx = dx / safeDistance;
  const ny = dy / safeDistance;
  const x = centerX + nx * maxDistance;
  const y = centerY + ny * maxDistance;
  const outwardVelocity = particle.vx * nx + particle.vy * ny;

  if (outwardVelocity <= 0) {
    return { ...particle, x, y };
  }

  return {
    ...particle,
    x,
    y,
    vx: particle.vx - (1 + BOUNCE) * outwardVelocity * nx,
    vy: particle.vy - (1 + BOUNCE) * outwardVelocity * ny,
  };
};

const stepParticles = (
  particles: GlitterParticle[],
  dt: number,
  width: number,
  height: number,
  gravityX: number,
  gravityY: number
): GlitterParticle[] => {
  const centerX = width / 2;
  const centerY = height / 2;
  const globeRadius = Math.min(width, height) / 2 - GLOBE_PADDING;
  const damping = Math.pow(DRAG, dt * 60);

  return particles.map((particle) => {
    const vx = (particle.vx + gravityX * dt) * damping;
    const vy = (particle.vy + gravityY * dt) * damping;
    const clampedVx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx));
    const clampedVy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy));
    const x = particle.x + clampedVx * dt;
    const y = particle.y + clampedVy * dt;

    return clampParticleToGlobe(
      { ...particle, x, y, vx: clampedVx, vy: clampedVy },
      centerX,
      centerY,
      globeRadius
    );
  });
};

const applyShakeImpulse = (
  particles: GlitterParticle[],
  width: number,
  height: number
): GlitterParticle[] => {
  const centerX = width / 2;
  const centerY = height / 2;

  return particles.map((particle) => {
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;

    return {
      ...particle,
      vx: particle.vx + nx * SHAKE_IMPULSE + randomInRange(-10, 10),
      vy: particle.vy + ny * SHAKE_IMPULSE + randomInRange(-18, 8),
    };
  });
};

const applyFingerImpulse = (
  particles: GlitterParticle[],
  touchX: number,
  touchY: number,
  moveX: number,
  moveY: number,
  width: number,
  height: number
): GlitterParticle[] => {
  const centerX = width / 2;
  const centerY = height / 2;
  const globeRadius = Math.min(width, height) / 2 - GLOBE_PADDING;
  const touchDx = touchX - centerX;
  const touchDy = touchY - centerY;
  const touchDistance = Math.sqrt(touchDx * touchDx + touchDy * touchDy);

  if (touchDistance > globeRadius) {
    return particles;
  }

  return particles.map((particle) => {
    const dx = particle.x - touchX;
    const dy = particle.y - touchY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > FINGER_INFLUENCE_RADIUS) {
      return particle;
    }

    const safeDistance = distance || 1;
    const nx = dx / safeDistance;
    const ny = dy / safeDistance;
    const distanceWeight = 1 - distance / FINGER_INFLUENCE_RADIUS;
    const push = FINGER_PUSH * distanceWeight;

    return {
      ...particle,
      vx: particle.vx + nx * push + moveX * 1.2,
      vy: particle.vy + ny * push + moveY * 1.2,
    };
  });
};

export const GlitterGlobe = forwardRef<GlitterGlobeRef, GlitterGlobeProps>(
  ({ width, height, initialCount = 36, maxParticles = 120 }, ref) => {
    const [particles, setParticles] = useState<GlitterParticle[]>(() =>
      createParticles(initialCount, width, height)
    );
    const frameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const sizeRef = useRef({ width, height });
    const motionForceRef = useRef({ x: 0, y: 0 });
    const lastShakeAtRef = useRef(0);
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      sizeRef.current = { width, height };
    }, [width, height]);

    useEffect(() => {
      setParticles((prev) => {
        if (prev.length > 0) {
          return prev;
        }
        return createParticles(initialCount, width, height);
      });
    }, [height, initialCount, width]);

    useEffect(() => {
      let subscription: { remove: () => void } | null = null;
      let isDisposed = false;

      const startMotion = async () => {
        if (Platform.OS === 'web') {
          return;
        }

        try {
          const available = await Accelerometer.isAvailableAsync();
          if (!available || isDisposed) {
            return;
          }

          Accelerometer.setUpdateInterval(100);
          subscription = Accelerometer.addListener((reading) => {
            motionForceRef.current = getMotionForce(reading);

            const now = Date.now();
            if (shouldTriggerShake(reading, lastShakeAtRef.current, now)) {
              lastShakeAtRef.current = now;
              setParticles((prev) =>
                applyShakeImpulse(prev, sizeRef.current.width, sizeRef.current.height)
              );
            }
          });
        } catch {
          motionForceRef.current = { x: 0, y: 0 };
        }
      };

      startMotion();

      return () => {
        isDisposed = true;
        if (subscription) {
          subscription.remove();
        }
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        addGlitter: (count = 20) => {
          setParticles((prev) => {
            const nextCount = Math.max(0, Math.min(count, maxParticles - prev.length));
            if (nextCount === 0) return prev;
            return [...prev, ...createParticles(nextCount, sizeRef.current.width, sizeRef.current.height)];
          });
        },
        clearGlitter: () => {
          setParticles([]);
        },
      }),
      [maxParticles]
    );

    useEffect(() => {
      const tick = (time: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time;
        }

        const elapsedSeconds = Math.min((time - lastTimeRef.current) / 1000, MAX_FRAME_SECONDS);
        lastTimeRef.current = time;

        if (elapsedSeconds > 0) {
          const motionForce = motionForceRef.current;
          setParticles((prev) =>
            stepParticles(
              prev,
              elapsedSeconds,
              sizeRef.current.width,
              sizeRef.current.height,
              motionForce.x,
              BASE_GRAVITY + motionForce.y
            )
          );
        }

        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, []);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (event) => {
            lastTouchRef.current = {
              x: event.nativeEvent.locationX,
              y: event.nativeEvent.locationY,
            };
          },
          onPanResponderMove: (event) => {
            const point = {
              x: event.nativeEvent.locationX,
              y: event.nativeEvent.locationY,
            };

            const previous = lastTouchRef.current ?? point;
            lastTouchRef.current = point;

            const moveX = point.x - previous.x;
            const moveY = point.y - previous.y;
            if (Math.abs(moveX) + Math.abs(moveY) < 0.5) {
              return;
            }

            setParticles((prev) =>
              applyFingerImpulse(
                prev,
                point.x,
                point.y,
                moveX,
                moveY,
                sizeRef.current.width,
                sizeRef.current.height
              )
            );
          },
          onPanResponderRelease: () => {
            lastTouchRef.current = null;
          },
          onPanResponderTerminate: () => {
            lastTouchRef.current = null;
          },
        }),
      []
    );

    const globe = useMemo(() => {
      const radius = Math.min(width, height) / 2 - GLOBE_PADDING;
      return {
        centerX: width / 2,
        centerY: height / 2,
        radius,
      };
    }, [height, width]);

    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="globeFill" cx="50%" cy="32%" rx="65%" ry="65%">
              <Stop offset="0%" stopColor={PASTEL_COLORS.cardFront} />
              <Stop offset="100%" stopColor={PASTEL_COLORS.background} />
            </RadialGradient>
          </Defs>

          <Circle
            cx={globe.centerX}
            cy={globe.centerY}
            r={globe.radius}
            fill="url(#globeFill)"
            stroke={PASTEL_COLORS.primary}
            strokeWidth={3}
          />

          {particles.map((particle) => {
            if (particle.shape === 'square') {
              const size = particle.radius * 2;
              return (
                <Rect
                  key={particle.id}
                  x={particle.x - particle.radius}
                  y={particle.y - particle.radius}
                  width={size}
                  height={size}
                  fill={particle.color}
                  opacity={particle.opacity}
                  rx={particle.radius * 0.25}
                />
              );
            }

            if (particle.shape === 'diamond') {
              const points = `${particle.x},${particle.y - particle.radius} ${particle.x + particle.radius},${particle.y} ${particle.x},${particle.y + particle.radius} ${particle.x - particle.radius},${particle.y}`;
              return (
                <Polygon
                  key={particle.id}
                  points={points}
                  fill={particle.color}
                  opacity={particle.opacity}
                />
              );
            }

            if (particle.shape === 'star') {
              return (
                <Polygon
                  key={particle.id}
                  points={getStarPoints(
                    particle.x,
                    particle.y,
                    particle.radius,
                    particle.radius * 0.45
                  )}
                  fill={particle.color}
                  opacity={particle.opacity}
                />
              );
            }

            return (
              <Circle
                key={particle.id}
                cx={particle.x}
                cy={particle.y}
                r={particle.radius}
                fill={particle.color}
                opacity={particle.opacity}
              />
            );
          })}
        </Svg>
        <View style={styles.touchLayer} {...panResponder.panHandlers} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
