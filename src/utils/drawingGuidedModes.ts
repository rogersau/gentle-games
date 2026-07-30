import type { Point } from '../components/DrawingCanvas';

export type DrawingMode = 'free-draw' | 'gentle-trails' | 'copy-and-continue' | 'prompted-drawing';
export type GentleTrailPattern = 'straight' | 'wave' | 'spiral' | 'zigzag' | 'shape' | 'road';
export type CopyContinueActivity = 'copy-line' | 'complete-picture' | 'continue-pattern';

export interface DrawingGuidedConfig {
  mode: DrawingMode;
  pattern?: GentleTrailPattern;
  copyActivity?: CopyContinueActivity;
  tolerance: number;
  widePath: number;
  smoothing: number;
}

export interface GuidedAttempt {
  mode: Exclude<DrawingMode, 'free-draw'>;
  progress: number;
  completed: boolean;
  history: unknown[];
}

export const DRAWING_GUIDED_DEFAULTS: Readonly<Record<DrawingMode, DrawingGuidedConfig>> = {
  'free-draw': {
    mode: 'free-draw',
    tolerance: 0,
    widePath: 0,
    smoothing: 0.7,
  },
  'gentle-trails': {
    mode: 'gentle-trails',
    pattern: 'straight',
    tolerance: 34,
    widePath: 56,
    smoothing: 0.7,
  },
  'copy-and-continue': {
    mode: 'copy-and-continue',
    pattern: 'shape',
    copyActivity: 'copy-line',
    tolerance: 38,
    widePath: 62,
    smoothing: 0.7,
  },
  'prompted-drawing': {
    mode: 'prompted-drawing',
    pattern: 'wave',
    tolerance: 42,
    widePath: 68,
    smoothing: 0.7,
  },
};

export const createDrawingGuidedConfig = (
  mode: DrawingMode,
  overrides: Partial<DrawingGuidedConfig> = {},
): DrawingGuidedConfig => ({
  ...DRAWING_GUIDED_DEFAULTS[mode],
  ...overrides,
  mode,
  tolerance:
    mode === 'free-draw'
      ? 0
      : Math.max(1, overrides.tolerance ?? DRAWING_GUIDED_DEFAULTS[mode].tolerance),
  widePath:
    mode === 'free-draw'
      ? 0
      : Math.max(1, overrides.widePath ?? DRAWING_GUIDED_DEFAULTS[mode].widePath),
  smoothing: Math.max(
    0,
    Math.min(1, overrides.smoothing ?? DRAWING_GUIDED_DEFAULTS[mode].smoothing),
  ),
});

const pointAt = (width: number, height: number, x: number, y: number): Point => ({
  x: width * x,
  y: height * y,
});

export const createGuidedPath = (
  pattern: GentleTrailPattern,
  width: number,
  height: number,
): Point[] => {
  switch (pattern) {
    case 'straight':
      return Array.from({ length: 25 }, (_, index) =>
        pointAt(width, height, 0.12 + (0.76 * index) / 24, 0.5),
      );
    case 'wave':
      return Array.from({ length: 33 }, (_, index) => {
        const progress = index / 32;
        return pointAt(
          width,
          height,
          0.1 + progress * 0.8,
          0.5 + Math.sin(progress * Math.PI * 4) * 0.2,
        );
      });
    case 'spiral':
      return Array.from({ length: 45 }, (_, index) => {
        const progress = index / 44;
        const angle = progress * Math.PI * 4.5;
        const radius = 0.03 + progress * 0.37;
        return pointAt(
          width,
          height,
          0.5 + Math.cos(angle) * radius,
          0.5 + Math.sin(angle) * radius,
        );
      });
    case 'zigzag':
      return Array.from({ length: 17 }, (_, index) =>
        pointAt(width, height, 0.1 + (0.8 * index) / 16, index % 2 === 0 ? 0.28 : 0.72),
      );
    case 'shape':
      return Array.from({ length: 33 }, (_, index) => {
        const angle = (index / 32) * Math.PI * 2;
        return pointAt(width, height, 0.5 + Math.cos(angle) * 0.28, 0.5 + Math.sin(angle) * 0.28);
      });
    case 'road':
      return Array.from({ length: 29 }, (_, index) => {
        const progress = index / 28;
        return pointAt(
          width,
          height,
          0.5 + Math.sin(progress * Math.PI * 2) * 0.22,
          0.88 - progress * 0.76,
        );
      });
  }
};

export const createCopyAndContinueGuide = (
  activity: CopyContinueActivity,
  width: number,
  height: number,
): { model: Point[]; continuation: Point[] } => {
  if (activity === 'complete-picture') {
    const arc = (start: number, end: number) =>
      Array.from({ length: 17 }, (_, index) => {
        const angle = start + ((end - start) * index) / 16;
        return pointAt(width, height, 0.5 + Math.cos(angle) * 0.27, 0.5 + Math.sin(angle) * 0.27);
      });
    return {
      model: arc(Math.PI / 2, (Math.PI * 3) / 2),
      continuation: arc(-Math.PI / 2, Math.PI / 2),
    };
  }

  if (activity === 'continue-pattern') {
    return {
      model: Array.from({ length: 7 }, (_, index) =>
        pointAt(width, height, 0.08 + index * 0.055, index % 2 === 0 ? 0.35 : 0.65),
      ),
      continuation: Array.from({ length: 10 }, (_, index) =>
        pointAt(width, height, 0.54 + index * 0.042, index % 2 === 0 ? 0.35 : 0.65),
      ),
    };
  }

  return {
    model: Array.from({ length: 13 }, (_, index) =>
      pointAt(width, height, 0.12 + index * 0.022, 0.34),
    ),
    continuation: Array.from({ length: 13 }, (_, index) =>
      pointAt(width, height, 0.58 + index * 0.022, 0.66),
    ),
  };
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Progress is monotonic: an interrupted or wandering stroke never produces failure. */
export const advanceGuidedProgress = (
  path: Point[],
  progress: number,
  points: Point[],
  tolerance: number,
): number => {
  let nextProgress = Math.max(0, Math.min(progress, Math.max(0, path.length - 1)));
  for (const point of points) {
    let furthestMatch = -1;
    for (let index = nextProgress; index < path.length; index += 1) {
      if (distance(point, path[index]) <= tolerance) {
        furthestMatch = index;
      }
    }
    if (furthestMatch >= 0) nextProgress = furthestMatch;
  }
  return nextProgress;
};

export const guidedProgressFraction = (path: Point[], progress: number): number =>
  path.length <= 1 ? 0 : Math.min(1, Math.max(0, progress / (path.length - 1)));

export const isGuidedPathComplete = (path: Point[], progress: number): boolean =>
  path.length > 0 && progress >= path.length - 1;

export const isTemporaryDrawingMode = (
  mode: DrawingMode,
): mode is Exclude<DrawingMode, 'free-draw'> => mode !== 'free-draw';
