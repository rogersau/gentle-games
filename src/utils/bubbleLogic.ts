import { PASTEL_COLORS } from '../types';

export interface Bubble {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  opacity: number;
}

let bubbleCounter = 0;

const BUBBLE_COLORS = [
  PASTEL_COLORS.primary,
  PASTEL_COLORS.secondary,
  PASTEL_COLORS.success,
  PASTEL_COLORS.cardBack,
];

const randomInRange = (min: number, max: number, rng: () => number): number =>
  min + (max - min) * rng();

export const createBubble = (width: number, rng: () => number = Math.random): Bubble => {
  const radius = randomInRange(18, 44, rng);
  const minX = radius;
  const maxX = Math.max(radius, width - radius);

  return {
    id: `bubble-${bubbleCounter++}`,
    x: randomInRange(minX, maxX, rng),
    y: -radius - randomInRange(6, 42, rng),
    radius,
    speed: randomInRange(24, 52, rng),
    color: BUBBLE_COLORS[Math.floor(rng() * BUBBLE_COLORS.length)],
    opacity: randomInRange(0.38, 0.7, rng),
  };
};

export const spawnBubbles = (
  existing: Bubble[],
  count: number,
  width: number,
  rng: () => number = Math.random
): Bubble[] => {
  const additions = Array.from({ length: Math.max(0, count) }, () => createBubble(width, rng));
  return [...existing, ...additions];
};

export const ensureMinimumBubbles = (
  existing: Bubble[],
  minimum: number,
  width: number,
  maxBubbles: number,
  rng: () => number = Math.random
): Bubble[] => {
  const safeMinimum = Math.max(0, Math.min(minimum, maxBubbles));
  if (existing.length >= safeMinimum) return existing.slice(0, maxBubbles);
  const missing = safeMinimum - existing.length;
  return spawnBubbles(existing, missing, width, rng).slice(0, maxBubbles);
};

export const stepBubbles = (existing: Bubble[], deltaSeconds: number, height: number): Bubble[] => {
  const safeDelta = Math.max(0, Math.min(deltaSeconds, 1 / 24));
  return existing
    .map((bubble) => ({
      ...bubble,
      y: bubble.y + bubble.speed * safeDelta,
    }))
    .filter((bubble) => bubble.y - bubble.radius <= height);
};

