import { useState, useRef, useEffect, useCallback } from 'react';
import type { GlitterColorCount, GlitterFallSpeed } from '../games/glitterSettings';

export interface GlitterParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shape: 'circle' | 'square' | 'diamond' | 'star';
  color: string;
  opacity: number;
}

interface WakeRipple {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

interface UseGlitterParticlesOptions {
  particleCount: number;
  canvasWidth: number;
  canvasHeight: number;
  colorCount?: GlitterColorCount;
  fallSpeed?: GlitterFallSpeed;
  backgroundMotion?: boolean;
  maxParticles?: number;
  resolveCollisions?: (particles: GlitterParticle[]) => GlitterParticle[];
}

const DRAG = 0.988;
const MAX_SPEED = 65;
export const GLITTER_GLOBE_PADDING = 10;
const BOUNCE = 0.4;
const FRAME_INTERVAL_MS = 1000 / 30;
const WAKE_LIFETIME_SECONDS = 0.45;
const WAKE_MAX_TRAIL = 22;
const WAKE_OPACITY = 0.32;
const PARTICLE_COLORS = ['#FF5D8F', '#6BCBFF', '#FFD166', '#B8F559', '#C792EA', '#FF9E5E'];
const PARTICLE_SHAPES: GlitterParticle['shape'][] = ['circle', 'square', 'diamond', 'star'];
const FALL_SPEED_GRAVITY: Record<GlitterFallSpeed, number> = {
  'very-slow': 1.5,
  slow: 4,
  normal: 8,
};
const keepParticlesSeparate = (particles: GlitterParticle[]) => particles;

const createParticle = (
  id: number,
  centerX: number,
  centerY: number,
  globeRadius: number,
  colorCount: GlitterColorCount,
  sprinkled = false,
  point?: { x: number; y: number },
): GlitterParticle => {
  const radius =
    sprinkled && Math.random() < 0.3
      ? 12 + Math.random() * 6
      : 4 + Math.random() * (sprinkled ? 3 : 6);
  const dx = point
    ? point.x - centerX
    : sprinkled
      ? (Math.random() - 0.5) * globeRadius * 0.7
      : (Math.random() - 0.5) * globeRadius;
  const dy = point
    ? point.y - centerY
    : sprinkled
      ? 16 + Math.random() * 26 - globeRadius
      : (Math.random() - 0.5) * globeRadius;
  const scale = Math.min(1, Math.max(0, globeRadius - radius) / (Math.hypot(dx, dy) || 1));
  return {
    id,
    x: centerX + dx * scale,
    y: centerY + dy * scale,
    vx: Math.random() * 20 - 10,
    vy: sprinkled ? 4 + Math.random() * 14 : Math.random() * 10,
    radius,
    shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
    color: PARTICLE_COLORS[Math.floor(Math.random() * colorCount)],
    opacity: Math.random() * 0.3 + 0.7,
  };
};

export function useGlitterParticles({
  particleCount,
  canvasWidth,
  canvasHeight,
  colorCount = 6,
  fallSpeed = 'normal',
  backgroundMotion = false,
  maxParticles = 120,
  resolveCollisions = keepParticlesSeparate,
}: UseGlitterParticlesOptions) {
  const [particles, setParticles] = useState<GlitterParticle[]>([]);
  const [ripples, setRipples] = useState<WakeRipple[]>([]);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<GlitterParticle[]>([]);
  const ripplesRef = useRef<WakeRipple[]>([]);
  const nextParticleId = useRef(0);
  const nextRippleId = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const previousLayoutRef = useRef<{
    centerX: number;
    centerY: number;
    globeRadius: number;
    particleCount: number;
    colorCount: GlitterColorCount;
  } | null>(null);
  const stepParticlesRef = useRef<
    (currentParticles: GlitterParticle[], dt: number) => GlitterParticle[]
  >(() => []);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const globeRadius = Math.max(0, Math.min(canvasWidth, canvasHeight) / 2 - GLITTER_GLOBE_PADDING);

  const updateParticles = useCallback(
    (update: (current: GlitterParticle[]) => GlitterParticle[]) => {
      particlesRef.current = update(particlesRef.current);
      setParticles(particlesRef.current);
    },
    [],
  );

  const updateRipples = useCallback((update: (current: WakeRipple[]) => WakeRipple[]) => {
    ripplesRef.current = update(ripplesRef.current);
    setRipples(ripplesRef.current);
  }, []);

  const stepParticles = useCallback(
    (currentParticles: GlitterParticle[], dt: number): GlitterParticle[] => {
      const damping = Math.pow(DRAG, dt * 60);
      const gravity = FALL_SPEED_GRAVITY[fallSpeed];
      const moved = currentParticles.map((p) => {
        const vx = p.vx * damping;
        const ambientX = backgroundMotion ? Math.sin((p.y + p.id * 19) * 0.02) * gravity * 0.06 : 0;
        const vy = (p.vy + gravity * dt) * damping;
        const clampedVx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx + ambientX));
        const clampedVy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy));
        return {
          ...p,
          x: p.x + clampedVx * dt,
          y: p.y + clampedVy * dt,
          vx: clampedVx,
          vy: clampedVy,
        };
      });

      return resolveCollisions(moved).map((p) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const maxDist = globeRadius - p.radius;
        if (dist > maxDist && maxDist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const outwardVel = p.vx * nx + p.vy * ny;
          return {
            ...p,
            x: centerX + nx * maxDist,
            y: centerY + ny * maxDist,
            vx: outwardVel > 0 ? p.vx - (1 + BOUNCE) * outwardVel * nx : p.vx,
            vy: outwardVel > 0 ? p.vy - (1 + BOUNCE) * outwardVel * ny : p.vy,
          };
        }
        return p;
      });
    },
    [backgroundMotion, centerX, centerY, fallSpeed, globeRadius, resolveCollisions],
  );

  stepParticlesRef.current = stepParticles;

  const startAnimation = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameTimeRef.current = null;
    const animate = (timestamp: number) => {
      const previousTime = lastFrameTimeRef.current;
      if (previousTime === null) lastFrameTimeRef.current = timestamp;
      else if (timestamp - previousTime >= FRAME_INTERVAL_MS - 0.5) {
        // Bound both physics work and SVG/React updates. Use elapsed time so
        // motion keeps the same speed on displays with different refresh rates.
        const dt = Math.min((timestamp - previousTime) / 1000, 0.1);
        lastFrameTimeRef.current = timestamp;
        updateParticles((current) => stepParticlesRef.current(current, dt));
        if (ripplesRef.current.length) {
          updateRipples((current) =>
            current
              .map((ripple) => ({
                ...ripple,
                radius: ripple.radius + dt * 42,
                opacity: ripple.opacity - (dt * WAKE_OPACITY) / WAKE_LIFETIME_SECONDS,
              }))
              .filter((ripple) => ripple.opacity > 0),
          );
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [updateParticles, updateRipples]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameTimeRef.current = null;
    }
  }, []);

  useEffect(() => stopAnimation, [stopAnimation]);

  useEffect(() => {
    const previous = previousLayoutRef.current;
    previousLayoutRef.current = { centerX, centerY, globeRadius, particleCount, colorCount };
    updateParticles((current) => {
      const count = Math.min(
        maxParticles,
        previous?.particleCount === particleCount ? current.length : particleCount,
      );
      const next = current.slice(0, count);
      if (previous) {
        for (const [index, particle] of next.entries()) {
          const scale =
            Math.max(0, globeRadius - particle.radius) /
            Math.max(1, previous.globeRadius - particle.radius);
          next[index] = {
            ...particle,
            x: centerX + (particle.x - previous.centerX) * scale,
            y: centerY + (particle.y - previous.centerY) * scale,
            color:
              previous.colorCount === colorCount
                ? particle.color
                : PARTICLE_COLORS[particle.id % colorCount],
          };
        }
      }
      next.push(
        ...Array.from({ length: count - next.length }, () =>
          createParticle(nextParticleId.current++, centerX, centerY, globeRadius, colorCount),
        ),
      );
      return next;
    });
  }, [centerX, centerY, colorCount, globeRadius, maxParticles, particleCount, updateParticles]);

  const addParticles = useCallback(
    (count: number, point?: { x: number; y: number }) => {
      const added = Math.min(Math.floor(count), maxParticles - particlesRef.current.length);
      if (!(added > 0)) return false;
      updateParticles((current) => [
        ...current,
        ...Array.from({ length: added }, () =>
          createParticle(
            nextParticleId.current++,
            centerX,
            centerY,
            globeRadius,
            colorCount,
            true,
            point,
          ),
        ),
      ]);
      return true;
    },
    [centerX, centerY, colorCount, globeRadius, maxParticles, updateParticles],
  );

  const clearParticles = useCallback(() => {
    updateParticles(() => []);
  }, [updateParticles]);

  const clearRipples = useCallback(() => {
    updateRipples(() => []);
  }, [updateRipples]);

  const addRipple = useCallback(
    (x: number, y: number) => {
      const ripple = { id: nextRippleId.current++, x, y, radius: 5, opacity: WAKE_OPACITY };
      updateRipples((current) => [...current.slice(1 - WAKE_MAX_TRAIL), ripple]);
    },
    [updateRipples],
  );

  return {
    particles,
    ripples,
    updateParticles,
    addParticles,
    clearParticles,
    clearRipples,
    addRipple,
    startAnimation,
    stopAnimation,
  };
}
