import { useState, useRef, useEffect, useCallback } from 'react';
import type { GlitterColorCount, GlitterFallSpeed } from '../games/glitterSettings';

interface GlitterParticle {
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
  id: string;
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
  resolveCollisions?: (particles: GlitterParticle[]) => GlitterParticle[];
}

const DRAG = 0.988;
const MAX_SPEED = 65;
const GLOBE_PADDING = 10;
const BOUNCE = 0.4;
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
  colorCount: GlitterColorCount,
): GlitterParticle => ({
  id,
  x: centerX + Math.random() * 50 - 25,
  y: centerY + Math.random() * 50 - 25,
  vx: Math.random() * 20 - 10,
  vy: Math.random() * 10,
  radius: Math.random() * 6 + 4,
  shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
  color: PARTICLE_COLORS[Math.floor(Math.random() * colorCount)],
  opacity: Math.random() * 0.3 + 0.7,
});

export function useGlitterParticles({
  particleCount,
  canvasWidth,
  canvasHeight,
  colorCount = 6,
  fallSpeed = 'normal',
  backgroundMotion = false,
  resolveCollisions = keepParticlesSeparate,
}: UseGlitterParticlesOptions) {
  const [particles, setParticles] = useState<GlitterParticle[]>([]);
  const [ripples, setRipples] = useState<WakeRipple[]>([]);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<GlitterParticle[]>([]);
  const initializedRef = useRef(false);
  const stepParticlesRef = useRef<
    (currentParticles: GlitterParticle[], dt: number) => GlitterParticle[]
  >(() => []);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const globeRadius = Math.min(canvasWidth, canvasHeight) / 2 - GLOBE_PADDING;

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
    const animate = () => {
      const updated = stepParticlesRef.current(particlesRef.current, 1 / 60);
      particlesRef.current = updated;
      setParticles(updated);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    particlesRef.current = Array.from({ length: particleCount }, (_, i) =>
      createParticle(i, centerX, centerY, colorCount),
    );
    setParticles([...particlesRef.current]);
  }, [centerX, centerY, colorCount, particleCount]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;

    const nextParticles = [...particlesRef.current];
    if (nextParticles.length < particleCount) {
      nextParticles.push(
        ...Array.from({ length: particleCount - nextParticles.length }, (_, index) =>
          createParticle(nextParticles.length + index, centerX, centerY, colorCount),
        ),
      );
    } else if (nextParticles.length > particleCount) {
      nextParticles.length = particleCount;
    }

    particlesRef.current = nextParticles;
    setParticles(nextParticles);
  }, [centerX, centerY, colorCount, particleCount]);

  const syncParticles = useCallback((particles: GlitterParticle[]) => {
    particlesRef.current = particles;
    setParticles(particles);
  }, []);

  const addParticles = useCallback((particles: GlitterParticle[]) => {
    particlesRef.current = [...particlesRef.current, ...particles];
    setParticles([...particlesRef.current]);
  }, []);

  const clearParticles = useCallback(() => {
    particlesRef.current = [];
    setParticles([]);
  }, []);

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  const syncRipples = useCallback((ripples: WakeRipple[]) => {
    setRipples(ripples);
  }, []);

  return {
    particles,
    ripples,
    syncParticles,
    addParticles,
    clearParticles,
    clearRipples,
    syncRipples,
    startAnimation,
    stopAnimation,
  };
}
