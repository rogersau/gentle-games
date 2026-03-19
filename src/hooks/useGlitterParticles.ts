import { useState, useRef, useEffect, useCallback } from 'react';

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
}

const DRAG = 0.988;
const MAX_SPEED = 65;
const GLOBE_PADDING = 10;
const BOUNCE = 0.4;

export function useGlitterParticles({
  particleCount,
  canvasWidth,
  canvasHeight,
}: UseGlitterParticlesOptions) {
  const [particles, setParticles] = useState<GlitterParticle[]>([]);
  const [ripples, setRipples] = useState<WakeRipple[]>([]);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<GlitterParticle[]>([]);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const globeRadius = Math.min(canvasWidth, canvasHeight) / 2 - GLOBE_PADDING;

  const stepParticles = useCallback((
    currentParticles: GlitterParticle[],
    dt: number,
  ): GlitterParticle[] => {
    const damping = Math.pow(DRAG, dt * 60);
    return currentParticles.map((p) => {
      const vx = p.vx * damping;
      const vy = p.vy * damping;
      const clampedVx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx));
      const clampedVy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy));
      const x = p.x + clampedVx * dt;
      const y = p.y + clampedVy * dt;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxDist = globeRadius - p.radius;
      if (dist > maxDist && maxDist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const outwardVel = vx * nx + vy * ny;
        if (outwardVel > 0) {
          return {
            ...p,
            x: centerX + nx * maxDist,
            y: centerY + ny * maxDist,
            vx: vx - (1 + BOUNCE) * outwardVel * nx,
            vy: vy - (1 + BOUNCE) * outwardVel * ny,
          };
        }
      }
      return { ...p, x, y, vx: clampedVx, vy: clampedVy };
    });
  }, [centerX, centerY, globeRadius]);

  const startAnimation = useCallback(() => {
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: centerX + Math.random() * 50 - 25,
      y: centerY + Math.random() * 50 - 25,
      vx: Math.random() * 20 - 10,
      vy: Math.random() * 10,
      radius: Math.random() * 6 + 4,
      shape: 'circle' as const,
      color: '#FF5D8F',
      opacity: Math.random() * 0.3 + 0.7,
    }));
    setParticles([...particlesRef.current]);

    const animate = () => {
      setParticles((prev) => {
        const updated = stepParticles(prev, 1 / 60);
        particlesRef.current = updated;
        return updated;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [particleCount, centerX, centerY, stepParticles]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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