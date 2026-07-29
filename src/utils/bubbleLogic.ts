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

export type BubbleMotion = 'still' | 'floating';
export type BubbleSpeed = 'slow' | 'medium' | 'fast';
export type BubbleDensity = 'sparse' | 'medium' | 'full';
export type BubbleSize = 'small' | 'medium' | 'large';

export interface BubbleSensoryConfig {
  motion: BubbleMotion;
  speed: BubbleSpeed;
  density: BubbleDensity;
  size: BubbleSize;
}

export const DEFAULT_BUBBLE_SENSORY_CONFIG: BubbleSensoryConfig = {
  motion: 'still',
  speed: 'slow',
  density: 'sparse',
  size: 'medium',
};

export type BubbleGuidedConcept = 'colour' | 'size' | 'count' | 'direction';
export type BubbleDirection = 'left' | 'right';
export type BubbleSizeGoal = 'biggest' | 'smallest';

export interface BubbleGuidedRound {
  concept: BubbleGuidedConcept;
  targetColour?: string;
  targetSize?: BubbleSize;
  targetSizeGoal?: BubbleSizeGoal;
  targetRadius?: number;
  targetDirection?: BubbleDirection;
  targetCount?: number;
  fieldWidth: number;
}

export interface BubbleGuidedResponse {
  accepted: boolean;
  completed: boolean;
  reason: 'correct' | 'wrong' | 'locked';
  nextCount: number;
}

let bubbleCounter = 0;

const BUBBLE_COLORS = [
  PASTEL_COLORS.primary,
  PASTEL_COLORS.secondary,
  PASTEL_COLORS.success,
  PASTEL_COLORS.cardBack,
];
const BUBBLE_COLOUR_NAMES = ['blue', 'pink', 'green', 'soft grey'] as const;
const LOWER_SPAWN_PROBABILITY = 0.35;
const LOWER_SPAWN_MIN_HEIGHT_RATIO = 0.22;
const LOWER_SPAWN_MAX_HEIGHT_RATIO = 0.62;
const MIN_INITIAL_SIZE_RATIO = 0.45;
const MAX_INITIAL_SIZE_RATIO = 0.75;
const TOP_SPAWN_MIN_OFFSET = 6;
const TOP_SPAWN_MAX_OFFSET = 42;
const MIN_GROWTH_SPEED = 8;
const MAX_GROWTH_SPEED = 18;

const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T =>
  options.includes(value as T);

export const resolveBubbleSensoryConfig = (
  value: Partial<BubbleSensoryConfig> | undefined,
): BubbleSensoryConfig => ({
  motion: isOneOf(value?.motion, ['still', 'floating'])
    ? value.motion
    : DEFAULT_BUBBLE_SENSORY_CONFIG.motion,
  speed: isOneOf(value?.speed, ['slow', 'medium', 'fast'])
    ? value.speed
    : DEFAULT_BUBBLE_SENSORY_CONFIG.speed,
  density: isOneOf(value?.density, ['sparse', 'medium', 'full'])
    ? value.density
    : DEFAULT_BUBBLE_SENSORY_CONFIG.density,
  size: isOneOf(value?.size, ['small', 'medium', 'large'])
    ? value.size
    : DEFAULT_BUBBLE_SENSORY_CONFIG.size,
});

export const bubbleSpeedMultiplier: Record<BubbleSpeed, number> = {
  slow: 0.65,
  medium: 1,
  fast: 1.35,
};

export const bubbleSizeMultiplier: Record<BubbleSize, number> = {
  small: 0.78,
  medium: 1,
  large: 1.25,
};

export const bubbleDensityLimits: Record<BubbleDensity, { min: number; max: number }> = {
  sparse: { min: 1, max: 4 },
  medium: { min: 2, max: 8 },
  full: { min: 3, max: 12 },
};

const randomInRange = (min: number, max: number, rng: () => number): number =>
  min + (max - min) * rng();

export const createBubble = (
  width: number,
  height: number,
  rng: () => number = Math.random,
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
  return spawnBubbles(existing, missing, width, height, rng).slice(0, maxBubbles);
};

export const stepBubbles = (
  existing: Bubble[],
  deltaSeconds: number,
  height: number,
  speedMultiplier = 1,
): Bubble[] => {
  const safeDelta = Math.max(0, Math.min(deltaSeconds, 1 / 24));
  const safeSpeedMultiplier = Math.max(0, speedMultiplier);
  return existing
    .map((bubble) => ({
      ...bubble,
      y: bubble.y + bubble.speed * safeSpeedMultiplier * safeDelta,
      radius: Math.min(bubble.targetRadius, bubble.radius + bubble.growthPerSecond * safeDelta),
    }))
    .filter((bubble) => bubble.y - bubble.radius <= height);
};

export const getBubbleSize = (bubble: Bubble): BubbleSize =>
  bubble.targetRadius <= 26 ? 'small' : bubble.targetRadius <= 35 ? 'medium' : 'large';

export const getBubbleColourName = (colour: string): string => {
  const index = BUBBLE_COLORS.indexOf(colour);
  return BUBBLE_COLOUR_NAMES[index] ?? 'chosen colour';
};

export const getBubbleDirection = (bubble: Bubble, fieldWidth: number): BubbleDirection =>
  bubble.x <= fieldWidth / 2 ? 'left' : 'right';

export const createGuidedRound = (
  concept: BubbleGuidedConcept,
  bubbles: Bubble[],
  fieldWidth: number,
  rng: () => number = Math.random,
): BubbleGuidedRound => {
  const sample = bubbles[Math.floor(rng() * bubbles.length)] ??
    bubbles[0] ?? {
      id: 'guide',
      x: 0,
      y: 0,
      radius: 28,
      targetRadius: 28,
      growthPerSecond: 0,
      speed: 0,
      color: BUBBLE_COLORS[0],
      opacity: 1,
    };
  if (concept === 'colour') {
    return { concept, targetColour: sample?.color ?? BUBBLE_COLORS[0], fieldWidth };
  }
  if (concept === 'size') {
    const sizeGoal: BubbleSizeGoal = rng() < 0.5 ? 'smallest' : 'biggest';
    const sizeBubble = bubbles.length
      ? bubbles.reduce((candidate, bubble) =>
          sizeGoal === 'smallest'
            ? bubble.targetRadius < candidate.targetRadius
              ? bubble
              : candidate
            : bubble.targetRadius > candidate.targetRadius
              ? bubble
              : candidate,
        )
      : sample;
    return {
      concept,
      targetSize: getBubbleSize(sizeBubble),
      targetSizeGoal: sizeGoal,
      targetRadius: sizeBubble.targetRadius,
      fieldWidth,
    };
  }
  if (concept === 'direction') {
    return { concept, targetDirection: getBubbleDirection(sample, fieldWidth), fieldWidth };
  }

  const maximum = Math.max(1, Math.min(5, bubbles.length));
  return {
    concept,
    targetCount: 1 + Math.floor(rng() * maximum),
    fieldWidth,
  };
};

export const isGuidedBubbleMatch = (round: BubbleGuidedRound, bubble: Bubble): boolean => {
  if (round.concept === 'colour') return bubble.color === round.targetColour;
  if (round.concept === 'size') {
    return round.targetRadius === undefined
      ? getBubbleSize(bubble) === round.targetSize
      : bubble.targetRadius === round.targetRadius;
  }
  if (round.concept === 'direction') {
    return getBubbleDirection(bubble, round.fieldWidth) === round.targetDirection;
  }
  return true;
};

/** Wrong answers remain in place. Count rounds never accept a pop after their target. */
export const evaluateGuidedResponse = (
  round: BubbleGuidedRound,
  bubble: Bubble,
  completedCount: number,
): BubbleGuidedResponse => {
  if (round.concept === 'count' && completedCount >= (round.targetCount ?? 1)) {
    return { accepted: false, completed: true, reason: 'locked', nextCount: completedCount };
  }
  if (!isGuidedBubbleMatch(round, bubble)) {
    return { accepted: false, completed: false, reason: 'wrong', nextCount: completedCount };
  }
  const nextCount = completedCount + 1;
  return {
    accepted: true,
    completed: round.concept === 'count' ? nextCount >= (round.targetCount ?? 1) : true,
    reason: 'correct',
    nextCount,
  };
};
