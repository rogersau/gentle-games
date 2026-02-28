import { PASTEL_COLORS } from '../types';

export interface KeepyUppyBalloon {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  groundedAt: number | null;
}

export interface KeepyUppyBounds {
  width: number;
  height: number;
}

export const MAX_BALLOONS = 3;
export const GROUND_POP_DELAY_MS = 850;

const GRAVITY = 260;
const AIR_DRAG = 0.992;
const BALLOON_RADIUS = 34;
const BOUNCE = 0.62;

const BALLOON_COLORS = [
  PASTEL_COLORS.primary,
  PASTEL_COLORS.secondary,
  PASTEL_COLORS.success,
  PASTEL_COLORS.cardBack,
  PASTEL_COLORS.matched,
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const randomInRange = (min: number, max: number, rng: () => number) => min + (max - min) * rng();

export const createBalloon = (
  bounds: KeepyUppyBounds,
  rng: () => number = Math.random
): KeepyUppyBalloon => {
  const radius = BALLOON_RADIUS;
  return {
    id: `keepy-uppy-balloon-${Date.now()}-${Math.floor(rng() * 100000)}`,
    x: randomInRange(radius, Math.max(radius, bounds.width - radius), rng),
    y: randomInRange(bounds.height * 0.22, bounds.height * 0.56, rng),
    vx: randomInRange(-36, 36, rng),
    vy: randomInRange(-28, 18, rng),
    radius,
    color: BALLOON_COLORS[Math.floor(rng() * BALLOON_COLORS.length)],
    groundedAt: null,
  };
};

export const addBalloon = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  rng: () => number = Math.random
): KeepyUppyBalloon[] => {
  if (balloons.length >= MAX_BALLOONS) {
    return balloons;
  }
  return [...balloons, createBalloon(bounds, rng)];
};

export const tapBalloon = (
  balloon: KeepyUppyBalloon,
  tapX: number,
  tapY: number
): KeepyUppyBalloon => {
  const dx = balloon.x - tapX;
  const dy = balloon.y - tapY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const horizontalPush = (dx / distance) * 120;
  const upwardPush = Math.max(0.65, -dy / distance + 0.9) * 250;

  return {
    ...balloon,
    vx: clamp(balloon.vx + horizontalPush, -260, 260),
    vy: clamp(balloon.vy - upwardPush, -360, 280),
    groundedAt: null,
  };
};

const resolveBalloonCollisions = (balloons: KeepyUppyBalloon[]): KeepyUppyBalloon[] => {
  const next = balloons.map((balloon) => ({ ...balloon }));

  for (let i = 0; i < next.length; i += 1) {
    for (let j = i + 1; j < next.length; j += 1) {
      const first = next[i];
      const second = next[j];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = first.radius + second.radius;

      if (distance === 0 || distance >= minDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = (minDistance - distance) / 2;
      first.x -= nx * overlap;
      first.y -= ny * overlap;
      second.x += nx * overlap;
      second.y += ny * overlap;

      const relativeVelocityX = second.vx - first.vx;
      const relativeVelocityY = second.vy - first.vy;
      const speedAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
      if (speedAlongNormal >= 0) {
        continue;
      }

      const impulse = speedAlongNormal * 0.75;
      first.vx += impulse * nx;
      first.vy += impulse * ny;
      second.vx -= impulse * nx;
      second.vy -= impulse * ny;
      first.groundedAt = null;
      second.groundedAt = null;
    }
  }

  return next;
};

export const stepBalloons = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  deltaSeconds: number,
  nowMs: number
): { balloons: KeepyUppyBalloon[]; popped: number } => {
  const safeDelta = clamp(deltaSeconds, 0, 1 / 24);
  const floorY = bounds.height - BALLOON_RADIUS;

  const moved = balloons
    .map((balloon) => {
      let vx = balloon.vx * AIR_DRAG;
      let vy = (balloon.vy + GRAVITY * safeDelta) * AIR_DRAG;
      let x = balloon.x + vx * safeDelta;
      let y = balloon.y + vy * safeDelta;

      if (x < balloon.radius) {
        x = balloon.radius;
        vx = Math.abs(vx) * BOUNCE;
      } else if (x > bounds.width - balloon.radius) {
        x = bounds.width - balloon.radius;
        vx = -Math.abs(vx) * BOUNCE;
      }

      if (y < balloon.radius) {
        y = balloon.radius;
        vy = Math.abs(vy) * 0.3;
      }

      let groundedAt = balloon.groundedAt;
      if (y >= floorY) {
        y = floorY;
        vy = -Math.abs(vy) * 0.25;
        groundedAt = groundedAt ?? nowMs;
      } else if (groundedAt !== null) {
        groundedAt = null;
      }

      return {
        ...balloon,
        x,
        y,
        vx,
        vy,
        groundedAt,
      };
    })
    .filter((balloon) => balloon.groundedAt === null || nowMs - balloon.groundedAt < GROUND_POP_DELAY_MS);

  const popped = balloons.length - moved.length;
  return { balloons: resolveBalloonCollisions(moved), popped };
};
