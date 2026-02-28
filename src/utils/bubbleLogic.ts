import { PASTEL_COLORS } from '../types';

export interface Bubble {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  growthPerSecond: number;
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
const LOWER_SPAWN_PROBABILITY = 0.35;
const LOWER_SPAWN_MIN_HEIGHT_RATIO = 0.22;
const LOWER_SPAWN_MAX_HEIGHT_RATIO = 0.62;
const MIN_INITIAL_SIZE_RATIO = 0.45;
const MAX_INITIAL_SIZE_RATIO = 0.75;
const TOP_SPAWN_MIN_OFFSET = 6;
const TOP_SPAWN_MAX_OFFSET = 42;
const MIN_GROWTH_SPEED = 8;
const MAX_GROWTH_SPEED = 18;

const randomInRange = (min: number, max: number, rng: () => number): number =>
  min + (max - min) * rng();

export const createBubble = (
  width: number,
  height: number,
  rng: () => number = Math.random
): Bubble => {
  const targetRadius = randomInRange(18, 44, rng);
  const minX = targetRadius;
  const maxX = Math.max(targetRadius, width - targetRadius);
  const startsLower = rng() < LOWER_SPAWN_PROBABILITY;
  const radius = startsLower
    ? targetRadius * randomInRange(MIN_INITIAL_SIZE_RATIO, MAX_INITIAL_SIZE_RATIO, rng)
    : targetRadius;

  return {
    id: `bubble-${bubbleCounter++}`,
    x: randomInRange(minX, maxX, rng),
    y: startsLower
      ? randomInRange(
          height * LOWER_SPAWN_MIN_HEIGHT_RATIO,
          height * LOWER_SPAWN_MAX_HEIGHT_RATIO,
          rng
        )
      : -targetRadius - randomInRange(TOP_SPAWN_MIN_OFFSET, TOP_SPAWN_MAX_OFFSET, rng),
    radius,
    targetRadius,
    growthPerSecond: startsLower ? randomInRange(MIN_GROWTH_SPEED, MAX_GROWTH_SPEED, rng) : 0,
    speed: randomInRange(24, 52, rng),
    color: BUBBLE_COLORS[Math.floor(rng() * BUBBLE_COLORS.length)],
    opacity: randomInRange(0.38, 0.7, rng),
  };
};

export const spawnBubbles = (
  existing: Bubble[],
  count: number,
  width: number,
  height: number,
  rng: () => number = Math.random
): Bubble[] => {
  const additions = Array.from({ length: Math.max(0, count) }, () => createBubble(width, height, rng));
  return [...existing, ...additions];
};

export const ensureMinimumBubbles = (
  existing: Bubble[],
  minimum: number,
  width: number,
  height: number,
  maxBubbles: number,
  rng: () => number = Math.random
): Bubble[] => {
  const safeMinimum = Math.max(0, Math.min(minimum, maxBubbles));
  if (existing.length >= safeMinimum) return existing.slice(0, maxBubbles);
  const missing = safeMinimum - existing.length;
  return spawnBubbles(existing, missing, width, height, rng).slice(0, maxBubbles);
};

export const stepBubbles = (existing: Bubble[], deltaSeconds: number, height: number): Bubble[] => {
  const safeDelta = Math.max(0, Math.min(deltaSeconds, 1 / 24));
  return existing
    .map((bubble) => ({
      ...bubble,
      y: bubble.y + bubble.speed * safeDelta,
      radius: Math.min(bubble.targetRadius, bubble.radius + bubble.growthPerSecond * safeDelta),
    }))
    .filter((bubble) => bubble.y - bubble.radius <= height);
};
