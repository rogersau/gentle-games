import { BALLOON_PALETTE, PASTEL_COLORS, ThemeColors } from '../types';

export type KeepyUppyProfile =
  | 'large-and-slow'
  | 'tap-anywhere'
  | 'direct-touch'
  | 'target-zones'
  | 'left-and-right'
  | 'more-balloons';

export type KeepyUppyInteraction =
  | 'direct-touch'
  | 'tap-anywhere'
  | 'target-zones'
  | 'left-and-right';

export interface KeepyUppyConfig {
  profile: KeepyUppyProfile;
  balloonSize: number;
  gravity: number;
  targetSize: number;
  balloonCount: number;
  interaction: KeepyUppyInteraction;
  reducedMotion: boolean;
}

const PROFILE_CONFIGS: Record<KeepyUppyProfile, Omit<KeepyUppyConfig, 'reducedMotion'>> = {
  'large-and-slow': {
    profile: 'large-and-slow',
    balloonSize: 46,
    gravity: 82,
    targetSize: 1.8,
    balloonCount: 1,
    interaction: 'direct-touch',
  },
  'tap-anywhere': {
    profile: 'tap-anywhere',
    balloonSize: 34,
    gravity: 175,
    targetSize: 2.6,
    balloonCount: 1,
    interaction: 'tap-anywhere',
  },
  'direct-touch': {
    profile: 'direct-touch',
    balloonSize: 34,
    gravity: 220,
    targetSize: 1,
    balloonCount: 1,
    interaction: 'direct-touch',
  },
  'target-zones': {
    profile: 'target-zones',
    balloonSize: 34,
    gravity: 175,
    targetSize: 1.8,
    balloonCount: 1,
    interaction: 'target-zones',
  },
  'left-and-right': {
    profile: 'left-and-right',
    balloonSize: 34,
    gravity: 175,
    targetSize: 1.8,
    balloonCount: 1,
    interaction: 'left-and-right',
  },
  'more-balloons': {
    profile: 'more-balloons',
    balloonSize: 29,
    gravity: 220,
    targetSize: 1.8,
    balloonCount: 3,
    interaction: 'direct-touch',
  },
};

export const DEFAULT_KEEPY_UPPY_CONFIG: KeepyUppyConfig = {
  ...PROFILE_CONFIGS['large-and-slow'],
  reducedMotion: false,
};

export const KEEPY_UPPY_PROFILES = PROFILE_CONFIGS;
export const MAX_BALLOONS = 3;
export const GROUND_POP_DELAY_MS = 1200;
export const KEEPY_UPPY_VELOCITY_LIMITS = {
  horizontal: 280,
  upward: 420,
  downward: 320,
} as const;

export const resolveKeepyUppyConfig = (
  overrides: Partial<KeepyUppyConfig> = {},
): KeepyUppyConfig => {
  const profile = overrides.profile ?? DEFAULT_KEEPY_UPPY_CONFIG.profile;
  const profileConfig = PROFILE_CONFIGS[profile];
  return {
    ...profileConfig,
    ...overrides,
    profile,
    reducedMotion: overrides.reducedMotion ?? DEFAULT_KEEPY_UPPY_CONFIG.reducedMotion,
  };
};

export interface KeepyUppyBalloon {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  groundedAt: number | null;
  /** Resting is a safe, recoverable state. It is not a miss or a pop. */
  resting?: boolean;
}

export interface KeepyUppyBounds {
  width: number;
  height: number;
}

const AIR_DRAG = 0.993;
const BOUNCE = 0.62;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const randomInRange = (min: number, max: number, rng: () => number) => min + (max - min) * rng();
const velocityClamp = (vx: number, vy: number) => ({
  vx: clamp(vx, -KEEPY_UPPY_VELOCITY_LIMITS.horizontal, KEEPY_UPPY_VELOCITY_LIMITS.horizontal),
  vy: clamp(vy, -KEEPY_UPPY_VELOCITY_LIMITS.upward, KEEPY_UPPY_VELOCITY_LIMITS.downward),
});

// default palette used when no theme is supplied (for backwards compatibility/testing)
const _DEFAULT_BALLOON_COLORS = [...BALLOON_PALETTE];

export const resolveBalloonPalette = (colors: ThemeColors, _resolvedMode?: string): string[] => {
  const forbidden = new Set([colors.primary, colors.success, colors.cardBack, colors.cardFront]);
  const palette = BALLOON_PALETTE.filter((color) => !forbidden.has(color));
  return palette.length > 0 ? palette : _DEFAULT_BALLOON_COLORS;
};

const pickBalloonColor = (palette: string[], used: string[], rng: () => number): string => {
  const available = palette.filter((color) => !used.includes(color));
  const source = available.length > 0 ? available : palette;
  return source[Math.floor(rng() * source.length) % source.length];
};

export interface CreateBalloonOptions {
  colors?: ThemeColors;
  rng?: () => number;
  overrideColor?: string;
  resolvedMode?: string;
  config?: Partial<KeepyUppyConfig>;
}

export const createBalloon = (
  bounds: KeepyUppyBounds,
  options: CreateBalloonOptions = {},
): KeepyUppyBalloon => {
  const { colors = PASTEL_COLORS, rng = Math.random, overrideColor, resolvedMode } = options;
  const config = resolveKeepyUppyConfig(options.config);
  const radius = config.balloonSize;
  const palette = resolveBalloonPalette(colors, resolvedMode);
  const color = overrideColor ?? pickBalloonColor(palette, [], rng);
  const minX = Math.min(radius, Math.max(0, bounds.width / 2));
  const maxX = Math.max(minX, bounds.width - radius);
  const floorY = Math.max(radius, bounds.height - radius);

  return {
    id: `keepy-uppy-balloon-${Date.now()}-${Math.floor(rng() * 100000)}`,
    x: randomInRange(minX, maxX, rng),
    y: randomInRange(
      Math.min(radius, bounds.height * 0.22),
      Math.min(floorY, bounds.height * 0.56),
      rng,
    ),
    vx: randomInRange(-36, 36, rng),
    vy: randomInRange(-28, 18, rng),
    radius,
    color,
    groundedAt: null,
    resting: false,
  };
};

export const createInitialBalloons = (
  bounds: KeepyUppyBounds,
  options: CreateBalloonOptions = {},
): KeepyUppyBalloon[] => {
  const config = resolveKeepyUppyConfig(options.config);
  const count = config.balloonCount;
  return Array.from({ length: count }, (_, index) =>
    createBalloon(bounds, {
      ...options,
      rng: options.rng ?? Math.random,
      overrideColor: index === 0 ? options.overrideColor : undefined,
    }),
  );
};

export interface AddBalloonOptions {
  colors?: ThemeColors;
  rng?: () => number;
  resolvedMode?: string;
  config?: Partial<KeepyUppyConfig>;
}

export const addBalloon = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  options: AddBalloonOptions = {},
): KeepyUppyBalloon[] => {
  const { colors = PASTEL_COLORS, rng = Math.random, resolvedMode } = options;
  const maxBalloons = options.config
    ? resolveKeepyUppyConfig(options.config).balloonCount
    : MAX_BALLOONS;
  if (balloons.length >= maxBalloons) return balloons;
  const palette = resolveBalloonPalette(colors, resolvedMode);
  const used = balloons.map((balloon) => balloon.color);
  const color = pickBalloonColor(palette, used, rng);
  return [
    ...balloons,
    createBalloon(bounds, {
      colors,
      rng,
      overrideColor: color,
      resolvedMode,
      config: options.config,
    }),
  ];
};

export const isBalloonResting = (balloon: KeepyUppyBalloon): boolean =>
  balloon.resting === true || (balloon.groundedAt !== null && Math.abs(balloon.vy) < 1);

export const tapBalloon = (
  balloon: KeepyUppyBalloon,
  tapX: number,
  tapY: number,
  easyMode = false,
  configOverrides?: Partial<KeepyUppyConfig>,
): KeepyUppyBalloon => {
  const config = resolveKeepyUppyConfig(configOverrides);
  const dx = balloon.x - tapX;
  const dy = balloon.y - tapY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const horizontalPush = (dx / distance) * (config.profile === 'left-and-right' ? 170 : 130);
  const upwardPush =
    Math.max(0.65, -dy / distance + 0.9) * (config.profile === 'large-and-slow' ? 190 : 280);
  const nextVelocity = velocityClamp(balloon.vx + horizontalPush, balloon.vy - upwardPush);

  return {
    ...balloon,
    ...nextVelocity,
    vy: easyMode ? Math.min(nextVelocity.vy, -80) : nextVelocity.vy,
    groundedAt: null,
    resting: false,
  };
};

export const flickBalloon = (
  balloon: KeepyUppyBalloon,
  deltaX: number,
  deltaY: number,
  durationMs: number,
  configOverrides?: Partial<KeepyUppyConfig>,
): KeepyUppyBalloon => {
  const config = resolveKeepyUppyConfig(configOverrides);
  const safeDurationMs = Math.max(60, durationMs);
  const velocityScale = 1000 / safeDurationMs;
  const horizontalPush = clamp(deltaX * velocityScale * 0.3, -240, 240);
  const verticalPush = clamp(
    -deltaY * velocityScale * (config.profile === 'large-and-slow' ? 0.35 : 0.55),
    -320,
    320,
  );
  const nextVelocity = velocityClamp(balloon.vx + horizontalPush, balloon.vy - verticalPush);

  return { ...balloon, ...nextVelocity, groundedAt: null, resting: false };
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
      if (distance >= minDistance) continue;

      const nx = distance === 0 ? 1 : dx / distance;
      const ny = distance === 0 ? 0 : dy / distance;
      const overlap = (minDistance - distance) / 2;
      first.x -= nx * overlap;
      first.y -= ny * overlap;
      second.x += nx * overlap;
      second.y += ny * overlap;

      const relativeVelocityX = second.vx - first.vx;
      const relativeVelocityY = second.vy - first.vy;
      const speedAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
      if (speedAlongNormal < 0) {
        const impulse = speedAlongNormal * 0.75;
        first.vx += impulse * nx;
        first.vy += impulse * ny;
        second.vx -= impulse * nx;
        second.vy -= impulse * ny;
        first.resting = false;
        second.resting = false;
        first.groundedAt = null;
        second.groundedAt = null;
      }
      const firstVelocity = velocityClamp(first.vx, first.vy);
      const secondVelocity = velocityClamp(second.vx, second.vy);
      Object.assign(first, firstVelocity);
      Object.assign(second, secondVelocity);
    }
  }
  return next;
};

export const stepBalloons = (
  balloons: KeepyUppyBalloon[],
  bounds: KeepyUppyBounds,
  deltaSeconds: number,
  nowMs: number,
  configOverrides?: Partial<KeepyUppyConfig>,
): { balloons: KeepyUppyBalloon[]; popped: number } => {
  const config = resolveKeepyUppyConfig(configOverrides);
  const safeDelta = clamp(deltaSeconds, 0, 1 / (config.reducedMotion ? 12 : 24));
  const gravity = config.gravity * (config.reducedMotion ? 0.72 : 1);

  const moved = balloons.map((balloon) => {
    const floorY = Math.max(balloon.radius, bounds.height - balloon.radius);
    const minX = Math.min(balloon.radius, Math.max(0, bounds.width / 2));
    const maxX = Math.max(minX, bounds.width - balloon.radius);
    if (isBalloonResting(balloon)) {
      return {
        ...balloon,
        x: clamp(balloon.x, minX, maxX),
        y: floorY,
        vx: 0,
        vy: 0,
        groundedAt: balloon.groundedAt ?? nowMs,
        resting: true,
      };
    }

    let vx = clamp(
      balloon.vx * AIR_DRAG,
      -KEEPY_UPPY_VELOCITY_LIMITS.horizontal,
      KEEPY_UPPY_VELOCITY_LIMITS.horizontal,
    );
    let vy = (balloon.vy + gravity * safeDelta) * AIR_DRAG;
    let x = balloon.x + vx * safeDelta;
    let y = balloon.y + vy * safeDelta;
    if (x < minX) {
      x = minX;
      vx = Math.abs(vx) * BOUNCE;
    } else if (x > maxX) {
      x = maxX;
      vx = -Math.abs(vx) * BOUNCE;
    }
    if (y < balloon.radius) {
      y = balloon.radius;
      vy = Math.abs(vy) * 0.3;
    }

    let groundedAt = balloon.groundedAt;
    let resting = balloon.resting === true;
    if (y >= floorY) {
      y = floorY;
      vx = clamp(vx, -KEEPY_UPPY_VELOCITY_LIMITS.horizontal, KEEPY_UPPY_VELOCITY_LIMITS.horizontal);
      vy = 0;
      groundedAt = groundedAt ?? nowMs;
      resting = true;
    } else if (groundedAt !== null) {
      groundedAt = null;
    }
    const nextVelocity = velocityClamp(vx, vy);
    return { ...balloon, x, y, ...nextVelocity, groundedAt, resting };
  });

  // Ground contact is always recoverable. `popped` remains for the old callback API.
  return { balloons: resolveBalloonCollisions(moved), popped: 0 };
};
