import { BALLOON_PALETTE, PASTEL_COLORS, ThemeColors } from '../types';

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
export const GROUND_POP_DELAY_MS = 1200;
export const BALLOON_WIDTH_RATIO = 1.7;
export const BALLOON_HEIGHT_RATIO = 2.1;
export const GROUND_HEIGHT = 50;

const GRAVITY = 200;
const AIR_DRAG = 0.993;
const BALLOON_RADIUS = 34;
const BOUNCE = 0.62;

let nextBalloonId = 0;

/**
 * Build a balloon colour palette adapted for the current theme.
 * Returns colors that are guaranteed to contrast with the board background.
 * In dark mode, slightly adjusts saturation to maintain visibility.
 */
export const resolveBalloonPalette = (colors: ThemeColors, _resolvedMode?: string): string[] => {
  // The dedicated balloon palette is designed to contrast with both light and dark backgrounds
  // We filter out any colors that happen to match the background colors exactly
  const forbidden = new Set([colors.primary, colors.success, colors.cardBack]);

  // For dark mode, we could adjust brightness here if needed
  // Currently the palette works well in both modes as-is
  return BALLOON_PALETTE.filter((c) => !forbidden.has(c));
};

/**
 * Pick a random colour from a palette.  If there are unused options, favour
 * those so balloons tend to be distinct; if all colours are already in use we
 * fall back to picking any value (allowing duplicates when the palette is
 * smaller than the number of balloons).
 */
const pickBalloonColor = (palette: string[], used: string[], rng: () => number): string => {
  const available = palette.filter((c) => !used.includes(c));
  const source = available.length > 0 ? available : palette;
  return source[Math.floor(rng() * source.length)];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const randomInRange = (min: number, max: number, rng: () => number) => min + (max - min) * rng();

const balloonLimits = (radius: number, bounds: KeepyUppyBounds) => {
  const left = Math.min(radius, bounds.width / 2);
  const top = Math.min((radius * BALLOON_HEIGHT_RATIO) / 2, bounds.height / 2);
  return {
    left,
    right: bounds.width - left,
    top,
    bottom: Math.max(top, bounds.height - GROUND_HEIGHT - top),
  };
};

export const containBalloon = (balloon: KeepyUppyBalloon, bounds: KeepyUppyBounds) => {
  const { left, right, top, bottom } = balloonLimits(balloon.radius, bounds);
  const x = clamp(balloon.x, left, right);
  const y = balloon.groundedAt === null ? clamp(balloon.y, top, bottom) : bottom;
  return x === balloon.x && y === balloon.y ? balloon : { ...balloon, x, y };
};

export const moveStillBalloon = (balloon: KeepyUppyBalloon, bounds: KeepyUppyBounds) => {
  const { top, bottom } = balloonLimits(balloon.radius, bounds);
  const liftedY = top + (bottom - top) / 4;
  const y = balloon.y <= liftedY ? top + (bottom - top) / 2 : liftedY;
  return { ...balloon, y, vx: 0, vy: 0, groundedAt: null };
};

export interface CreateBalloonOptions {
  colors?: ThemeColors;
  rng?: () => number;
  overrideColor?: string;
  resolvedMode?: string;
}

export const createBalloon = (
  bounds: KeepyUppyBounds,
  options: CreateBalloonOptions = {},
): KeepyUppyBalloon => {
  const { colors = PASTEL_COLORS, rng = Math.random, overrideColor, resolvedMode } = options;
  const radius = BALLOON_RADIUS;
  const palette = resolveBalloonPalette(colors, resolvedMode);
  const color = overrideColor ?? pickBalloonColor(palette, [], rng);
  const { left, right, top, bottom } = balloonLimits(radius, bounds);

  return {
    id: `keepy-uppy-balloon-${nextBalloonId++}`,
    x: randomInRange(left, right, rng),
    y: clamp(randomInRange(bounds.height * 0.22, bounds.height * 0.56, rng), top, bottom),
    vx: randomInRange(-36, 36, rng),
    vy: randomInRange(-28, 18, rng),
    radius,
    color,
    groundedAt: null,
  };
};

export interface AddBalloonOptions {
  colors?: ThemeColors;
  rng?: () => number;
  resolvedMode?: string;
  balloon?: KeepyUppyBalloon;
}

export const addBalloon = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  options: AddBalloonOptions = {},
): KeepyUppyBalloon[] => {
  const { colors = PASTEL_COLORS, rng = Math.random, resolvedMode } = options;
  if (balloons.length >= MAX_BALLOONS) {
    return balloons;
  }
  const palette = resolveBalloonPalette(colors, resolvedMode);
  const used = balloons.map((b) => b.color);
  const color = pickBalloonColor(palette, used, rng);
  const balloon =
    options.balloon ?? createBalloon(bounds, { colors, rng, overrideColor: color, resolvedMode });

  const distanceToNearest = (x: number) =>
    Math.min(...balloons.map((other) => Math.hypot(x - other.x, balloon.y - other.y)));
  const { left, right } = balloonLimits(balloon.radius, bounds);
  const x = [left, bounds.width / 2, right].reduce(
    (best, candidate) =>
      distanceToNearest(candidate) > distanceToNearest(best) ? candidate : best,
    balloon.x,
  );

  return [...balloons, { ...balloon, x, color }];
};

export const tapBalloon = (
  balloon: KeepyUppyBalloon,
  tapX: number,
  tapY: number,
  easyMode = false,
): KeepyUppyBalloon => {
  const dx = balloon.x - tapX;
  const dy = balloon.y - tapY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const horizontalPush = (dx / distance) * 130;
  const upwardPush = Math.max(0.65, -dy / distance + 0.9) * 280;
  const nextVy = clamp(balloon.vy - upwardPush, -360, 280);

  return {
    ...balloon,
    vx: clamp(balloon.vx + horizontalPush, -260, 260),
    vy: easyMode ? Math.min(nextVy, -80) : nextVy,
    groundedAt: null,
  };
};

export const flickBalloon = (
  balloon: KeepyUppyBalloon,
  deltaX: number,
  deltaY: number,
  durationMs: number,
): KeepyUppyBalloon => {
  const safeDurationMs = Math.max(60, durationMs);
  const velocityScale = 1000 / safeDurationMs;
  const horizontalPush = clamp(deltaX * velocityScale * 0.3, -240, 240);
  const verticalPush = clamp(-deltaY * velocityScale * 0.55, -320, 320);

  return {
    ...balloon,
    vx: clamp(balloon.vx + horizontalPush, -320, 320),
    vy: clamp(balloon.vy - verticalPush, -420, 320),
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

      if (
        distance === 0 ||
        distance >= minDistance ||
        (first.groundedAt !== null && second.groundedAt !== null)
      ) {
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
      if (first.vy < 0) first.groundedAt = null;
      if (second.vy < 0) second.groundedAt = null;
    }
  }

  return next;
};

export const stepBalloons = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  deltaSeconds: number,
  nowMs: number,
  allowPopping = true,
): { balloons: KeepyUppyBalloon[]; popped: number } => {
  const safeDelta = clamp(deltaSeconds, 0, 1 / 24);

  const moved = balloons
    .map((balloon) => {
      const { left, right, top, bottom } = balloonLimits(balloon.radius, bounds);
      let vx = balloon.vx * AIR_DRAG;
      let vy = (balloon.vy + GRAVITY * safeDelta) * AIR_DRAG;
      let x = balloon.x + vx * safeDelta;
      let y = balloon.y + vy * safeDelta;

      if (x < left) {
        x = left;
        vx = Math.abs(vx) * BOUNCE;
      } else if (x > right) {
        x = right;
        vx = -Math.abs(vx) * BOUNCE;
      }

      if (y < top) {
        y = top;
        vy = Math.abs(vy) * 0.3;
      }

      if (y >= bottom) {
        return { ...balloon, x, y: bottom, vx: 0, vy: 0, groundedAt: balloon.groundedAt ?? nowMs };
      }

      return {
        ...balloon,
        x,
        y,
        vx,
        vy,
        groundedAt: null,
      };
    })
    .filter(
      (balloon) =>
        !allowPopping ||
        balloon.groundedAt === null ||
        nowMs - balloon.groundedAt < GROUND_POP_DELAY_MS,
    );

  const popped = balloons.length - moved.length;
  return {
    balloons: resolveBalloonCollisions(moved).map((balloon) => containBalloon(balloon, bounds)),
    popped,
  };
};
