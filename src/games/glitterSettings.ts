export type GlitterPreset = 'settle' | 'watch' | 'explore' | 'full';
export type GlitterParticleDensity = 'very-sparse' | 'sparse' | 'medium' | 'dense';
export type GlitterFallSpeed = 'very-slow' | 'slow' | 'normal';
export type GlitterColorCount = 1 | 3 | 6;

export interface GlitterFallSettings {
  preset: GlitterPreset;
  particleDensity: GlitterParticleDensity;
  fallSpeed: GlitterFallSpeed;
  colorCount: GlitterColorCount;
  ripples: boolean;
  shakeResponse: boolean;
  backgroundMotion: boolean;
  sound: boolean;
}

export const GLITTER_PRESETS: Record<GlitterPreset, GlitterFallSettings> = {
  settle: {
    preset: 'settle',
    particleDensity: 'very-sparse',
    fallSpeed: 'very-slow',
    colorCount: 1,
    ripples: false,
    shakeResponse: false,
    backgroundMotion: false,
    sound: false,
  },
  watch: {
    preset: 'watch',
    particleDensity: 'sparse',
    fallSpeed: 'slow',
    colorCount: 3,
    ripples: false,
    shakeResponse: false,
    backgroundMotion: false,
    sound: false,
  },
  explore: {
    preset: 'explore',
    particleDensity: 'medium',
    fallSpeed: 'slow',
    colorCount: 3,
    ripples: true,
    shakeResponse: false,
    backgroundMotion: true,
    sound: false,
  },
  full: {
    preset: 'full',
    particleDensity: 'dense',
    fallSpeed: 'normal',
    colorCount: 6,
    ripples: true,
    shakeResponse: true,
    backgroundMotion: true,
    sound: true,
  },
};

export const DEFAULT_GLITTER_SETTINGS = GLITTER_PRESETS.settle;

export const GLITTER_PARTICLE_COUNTS: Record<GlitterParticleDensity, number> = {
  'very-sparse': 10,
  sparse: 22,
  medium: 40,
  dense: 68,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const resolveGlitterSettings = (value: unknown): GlitterFallSettings => {
  const candidate = isObject(value) ? value : {};
  const preset =
    candidate.preset === 'settle' ||
    candidate.preset === 'watch' ||
    candidate.preset === 'explore' ||
    candidate.preset === 'full'
      ? candidate.preset
      : DEFAULT_GLITTER_SETTINGS.preset;
  const fallback = GLITTER_PRESETS[preset];

  return {
    preset,
    particleDensity:
      candidate.particleDensity === 'very-sparse' ||
      candidate.particleDensity === 'sparse' ||
      candidate.particleDensity === 'medium' ||
      candidate.particleDensity === 'dense'
        ? candidate.particleDensity
        : fallback.particleDensity,
    fallSpeed:
      candidate.fallSpeed === 'very-slow' ||
      candidate.fallSpeed === 'slow' ||
      candidate.fallSpeed === 'normal'
        ? candidate.fallSpeed
        : fallback.fallSpeed,
    colorCount:
      candidate.colorCount === 1 || candidate.colorCount === 3 || candidate.colorCount === 6
        ? candidate.colorCount
        : fallback.colorCount,
    ripples: typeof candidate.ripples === 'boolean' ? candidate.ripples : fallback.ripples,
    shakeResponse:
      typeof candidate.shakeResponse === 'boolean'
        ? candidate.shakeResponse
        : fallback.shakeResponse,
    backgroundMotion:
      typeof candidate.backgroundMotion === 'boolean'
        ? candidate.backgroundMotion
        : fallback.backgroundMotion,
    sound: typeof candidate.sound === 'boolean' ? candidate.sound : fallback.sound,
  };
};
