import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Polygon, Rect } from 'react-native-svg';
import { useThemeColors } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import {
  GLITTER_GLOBE_PADDING,
  useGlitterParticles,
  type GlitterParticle,
} from '../hooks/useGlitterParticles';
import { useGlitterGestures } from '../hooks/useGlitterGestures';
import {
  DEFAULT_GLITTER_SETTINGS,
  GLITTER_PARTICLE_COUNTS,
  resolveGlitterSettings,
  GlitterFallSettings,
} from '../games/glitterSettings';

export interface GlitterGlobeRef {
  addGlitter: (count?: number) => boolean;
  clearGlitter: () => void;
  swirl: () => void;
  settle: () => void;
}

interface GlitterGlobeProps {
  width: number;
  height: number;
  config?: GlitterFallSettings;
  initialCount?: number;
  maxParticles?: number;
  onInteraction?: () => void;
  motionEnabled?: boolean;
  reducedMotion?: boolean;
}

const PARTICLE_BOUNCE = 0.6;
const FINGER_INFLUENCE_RADIUS = 96;
const FINGER_PUSH = 10;
const MAX_DRAG_STEP = 12;
const SHAKE_IMPULSE = 45;
const WAKE_INTERVAL_MS = 45;

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

const getStarPoints = (
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
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

export const resolveParticleCollisions = (particles: GlitterParticle[]): GlitterParticle[] => {
  if (particles.length < 2) return particles;

  const result: GlitterParticle[] = Array.from({ length: particles.length });
  for (let k = 0; k < particles.length; k++) {
    result[k] = { ...particles[k] };
  }

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.radius + b.radius;

      if (distSq >= minDist * minDist) continue;

      let nx: number;
      let ny: number;
      let dist: number;

      if (distSq === 0) {
        // Exact same position: use a fixed fallback normal to push them apart
        nx = 1;
        ny = 0;
        dist = 0;
      } else {
        dist = Math.sqrt(distSq);
        nx = dx / dist;
        ny = dy / dist;
      }

      // Separate overlapping particles equally
      const halfOverlap = (minDist - dist) / 2;
      result[i].x -= nx * halfOverlap;
      result[i].y -= ny * halfOverlap;
      result[j].x += nx * halfOverlap;
      result[j].y += ny * halfOverlap;

      // Elastic impulse (equal mass) along collision normal
      const dvn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (dvn > 0) {
        const impulse = ((1 + PARTICLE_BOUNCE) * dvn) / 2;
        result[i].vx -= impulse * nx;
        result[i].vy -= impulse * ny;
        result[j].vx += impulse * nx;
        result[j].vy += impulse * ny;
      }
    }
  }

  return result;
};

const applyShakeImpulse = (
  particles: GlitterParticle[],
  width: number,
  height: number,
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
): GlitterParticle[] => {
  const step = Math.hypot(moveX, moveY);
  const scale = Math.min(1, MAX_DRAG_STEP / (step || 1));
  return particles.map((particle) => {
    const dx = particle.x - touchX;
    const dy = particle.y - touchY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > FINGER_INFLUENCE_RADIUS) {
      return particle;
    }

    const safeDistance = distance || 1;
    const nx = dx / safeDistance;
    const ny = distance === 0 ? -1 : dy / safeDistance;
    const distanceWeight = 1 - distance / FINGER_INFLUENCE_RADIUS;
    const push = FINGER_PUSH * distanceWeight;

    return {
      ...particle,
      vx: particle.vx + nx * push + moveX * scale * distanceWeight,
      vy: particle.vy + ny * push + moveY * scale * distanceWeight,
    };
  });
};

export const GlitterGlobe = forwardRef<GlitterGlobeRef, GlitterGlobeProps>(
  (
    {
      width,
      height,
      config = DEFAULT_GLITTER_SETTINGS,
      initialCount,
      maxParticles = 120,
      onInteraction,
      motionEnabled = true,
      reducedMotion = false,
    },
    ref,
  ) => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const resolvedConfig = useMemo(() => resolveGlitterSettings(config), [config]);
    const particleCount = initialCount ?? GLITTER_PARTICLE_COUNTS[resolvedConfig.particleDensity];
    const canAnimate = motionEnabled && !reducedMotion;
    const showRipples = canAnimate && resolvedConfig.ripples;
    const [settled, setSettled] = useState(false);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(0, Math.min(width, height) / 2 - GLITTER_GLOBE_PADDING);
    const touchLeft = centerX - radius;
    const touchTop = centerY - radius;
    const clipId = `glitter-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const lastWakeAtRef = useRef(-Infinity);

    const onInteractionRef = useRef(onInteraction);
    useEffect(() => {
      onInteractionRef.current = onInteraction;
    }, [onInteraction]);

    const {
      particles,
      ripples,
      updateParticles,
      addParticles,
      clearParticles,
      clearRipples,
      addRipple,
      startAnimation,
      stopAnimation,
    } = useGlitterParticles({
      particleCount,
      canvasWidth: width,
      canvasHeight: height,
      colorCount: resolvedConfig.colorCount,
      fallSpeed: resolvedConfig.fallSpeed,
      backgroundMotion: canAnimate && resolvedConfig.backgroundMotion,
      maxParticles,
      resolveCollisions: resolveParticleCollisions,
    });

    useEffect(() => {
      if (canAnimate && !settled) startAnimation();
      return stopAnimation;
    }, [canAnimate, settled, startAnimation, stopAnimation]);

    useEffect(() => {
      clearRipples();
    }, [clearRipples, showRipples, width, height]);

    const handleShake = useCallback(() => {
      updateParticles((current) => applyShakeImpulse(current, width, height));
      onInteractionRef.current?.();
    }, [height, updateParticles, width]);

    useGlitterGestures({
      onShake: handleShake,
      enabled: canAnimate && !settled && resolvedConfig.shakeResponse,
    });

    useImperativeHandle(
      ref,
      () => ({
        addGlitter: (count = 20) => {
          const added = addParticles(count);
          if (added && canAnimate) setSettled(false);
          return added;
        },
        clearGlitter: () => {
          clearParticles();
          clearRipples();
        },
        swirl: () => {
          if (!canAnimate) return;
          updateParticles((current) =>
            current.map((particle) => {
              const dx = particle.x - centerX;
              const dy = particle.y - centerY;
              const distance = Math.hypot(dx, dy) || 1;
              return {
                ...particle,
                vx: particle.vx - (dy / distance) * 24,
                vy: particle.vy + (dx / distance) * 24,
              };
            }),
          );
          setSettled(false);
        },
        settle: () => {
          updateParticles((current) => current.map((particle) => ({ ...particle, vx: 0, vy: 0 })));
          clearRipples();
          setSettled(true);
        },
      }),
      [addParticles, canAnimate, centerX, centerY, clearParticles, clearRipples, updateParticles],
    );

    const panResponder = useMemo(() => {
      const isInside = (x: number, y: number) => Math.hypot(x - radius, y - radius) <= radius;
      const resetTouch = () => {
        lastTouchRef.current = null;
      };
      const stirAt = (x: number, y: number, moveX: number, moveY: number) => {
        if (!isInside(x, y)) return;
        const globeX = x + touchLeft;
        const globeY = y + touchTop;

        setSettled(false);
        updateParticles((current) => applyFingerImpulse(current, globeX, globeY, moveX, moveY));
        if (showRipples) {
          const now = Date.now();
          if (now - lastWakeAtRef.current >= WAKE_INTERVAL_MS) {
            lastWakeAtRef.current = now;
            addRipple(globeX, globeY);
          }
        }
        onInteractionRef.current?.();
      };

      return PanResponder.create({
        onStartShouldSetPanResponder: ({ nativeEvent }) =>
          isInside(nativeEvent.locationX, nativeEvent.locationY),
        onPanResponderGrant: ({ nativeEvent }) => {
          const { locationX: x, locationY: y } = nativeEvent;
          lastTouchRef.current = { x, y };
          lastWakeAtRef.current = -Infinity;
          stirAt(x, y, 0, 0);
        },
        onPanResponderStart: (_event, gesture) => {
          if (gesture.numberActiveTouches > 1) resetTouch();
        },
        onPanResponderMove: ({ nativeEvent }) => {
          const { locationX: x, locationY: y } = nativeEvent;
          const previous = lastTouchRef.current;
          if (!previous) return;
          const moveX = x - previous.x;
          const moveY = y - previous.y;
          if (Math.hypot(moveX, moveY) < 0.5) return;
          lastTouchRef.current = { x, y };
          stirAt(x, y, moveX, moveY);
        },
        onPanResponderRelease: resetTouch,
        onPanResponderTerminate: resetTouch,
      });
    }, [addRipple, radius, showRipples, touchLeft, touchTop, updateParticles]);

    const touchStyle = [
      styles.touchLayer,
      {
        left: touchLeft,
        top: touchTop,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
      },
      canAnimate && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle),
    ];
    return (
      <View
        style={[styles.container, { width, height }]}
        accessible
        accessibilityRole='image'
        accessibilityLabel={t('games.glitterFall.accessibility')}
      >
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id={clipId}>
              <Circle cx={centerX} cy={centerY} r={radius} />
            </ClipPath>
          </Defs>
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill={colors.surfaceGame}
            stroke={colors.primary}
            strokeWidth={3}
          />

          <G clipPath={`url(#${clipId})`}>
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
                      particle.radius * 0.45,
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
            {ripples.map((wake) => (
              <Circle
                key={wake.id}
                cx={wake.x}
                cy={wake.y}
                r={wake.radius}
                fill='none'
                stroke={colors.cardFront}
                strokeWidth={1.5}
                opacity={wake.opacity}
              />
            ))}
          </G>
        </Svg>
        {canAnimate ? (
          <View style={touchStyle} {...panResponder.panHandlers} />
        ) : (
          <Pressable
            testID='glitter-still-surface'
            accessible={false}
            focusable={false}
            style={touchStyle}
            onPress={({ nativeEvent }) => {
              // Web presses carry mouse-event offsets, including clicks generated by touch.
              const event = nativeEvent as typeof nativeEvent & {
                offsetX?: number;
                offsetY?: number;
              };
              const locationX = event.locationX ?? event.offsetX;
              const locationY = event.locationY ?? event.offsetY;
              if (Math.hypot(locationX - radius, locationY - radius) <= radius) {
                addParticles(1, { x: locationX + touchLeft, y: locationY + touchTop });
              }
            }}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchLayer: {
    position: 'absolute',
  },
});
