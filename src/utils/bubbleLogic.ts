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
const MAX_BUBBLE_RADIUS = 44;

export const getBubbleHitRadius = (radius: number): number => Math.max(32, radius + 8);

type Point = Pick<Bubble, 'x' | 'y'>;

const distanceSquared = (a: Point, b: Point): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const findBubbleAtPoint = (
  bubbles: Bubble[],
  point: Point,
  width: number,
  height: number,
): Bubble | undefined => {
  let nearest: Bubble | undefined;
  let nearestDistance = Infinity;
  // Check from front to back so the visible bubble wins when circles overlap.
  for (let index = bubbles.length - 1; index >= 0; index -= 1) {
    const bubble = bubbles[index];
    const { x, y, radius } = bubble;
    if (x + radius <= 0 || x - radius >= width || y + radius <= 0 || y - radius >= height) {
      continue;
    }
    const distance = distanceSquared(bubble, point);
    if (distance <= radius ** 2) return bubble;
    if (distance <= getBubbleHitRadius(radius) ** 2 && distance < nearestDistance) {
      nearest = bubble;
      nearestDistance = distance;
    }
  }
  return nearest;
};

export const positionStillBubbles = (
  bubbles: Bubble[],
  width: number,
  height: number,
  lastPop?: Point,
): Bubble[] => {
  const largestTarget = getBubbleHitRadius(MAX_BUBBLE_RADIUS) * 2;
  const columns = Math.max(1, Math.floor(width / largestTarget));
  const rows = Math.max(1, Math.floor(height / largestTarget));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const maxRadius = Math.max(1, Math.min(cellWidth, cellHeight) / 2 - 8);
  const slots = Array.from({ length: columns * rows }, (_, index) => ({
    x: ((index % columns) + 0.5) * cellWidth,
    y: (Math.floor(index / columns) + 0.5) * cellHeight,
  }));

  // Surviving bubbles come first and keep their slots when the board stays the same size.
  return bubbles.slice(0, slots.length).map((bubble) => {
    slots.sort((a, b) => distanceSquared(a, bubble) - distanceSquared(b, bubble));
    const avoidLastPop = slots.length > 1 && lastPop && distanceSquared(slots[0], lastPop) === 0;
    const [slot] = slots.splice(avoidLastPop ? 1 : 0, 1);
    return { ...bubble, ...slot, radius: Math.min(maxRadius, bubble.targetRadius) };
  });
};

const randomInRange = (min: number, max: number, rng: () => number): number =>
  min + (max - min) * rng();

export const createBubble = (
  width: number,
  height: number,
  rng: () => number = Math.random,
): Bubble => {
  const targetRadius = randomInRange(18, MAX_BUBBLE_RADIUS, rng);
  const minX = Math.min(targetRadius, width / 2);
  const maxX = width - minX;
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
          rng,
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
  rng: () => number = Math.random,
): Bubble[] => {
  const additions = Array.from({ length: Math.max(0, count) }, () =>
    createBubble(width, height, rng),
  );
  return [...existing, ...additions];
};

export const ensureMinimumBubbles = (
  existing: Bubble[],
  minimum: number,
  width: number,
  height: number,
  maxBubbles: number,
  rng: () => number = Math.random,
): Bubble[] => {
  const safeMinimum = Math.max(0, Math.min(minimum, maxBubbles));
  if (existing.length >= safeMinimum) return existing.slice(0, maxBubbles);
  const missing = safeMinimum - existing.length;
  const additions = spawnBubbles([], missing, width, height, rng).map((bubble) => ({
    ...bubble,
    y: Math.max(bubble.y, Math.min(height / 2, bubble.radius)),
  }));
  return [...existing, ...additions];
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
