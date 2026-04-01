import enAU from './locales/en-AU.json';

// Define the translation resource type based on en-AU (the source of truth)
export type TranslationResources = typeof enAU;

// Helper type to extract all dot-notation keys from the translations
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[],
];

type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends readonly unknown[]
    ? never
    : T extends object
      ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
      : '';

// Export all valid translation keys as a union type
export type TranslationKey = Leaves<TranslationResources>;

const resolveTranslationValue = (key: string, translations: TranslationResources): unknown => {
  const parts = key.split('.');
  let current: unknown = translations;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

// Runtime validation helper
/**
 * Validates that a translation key returns a string (not an object)
 * Call this in __DEV__ mode to catch errors early
 *
 * Example:
 * const label = validateTranslation('games.patternTrain.difficulty.easy.label'); // ✓ Returns string
 * const bad = validateTranslation('games.patternTrain.difficulty'); // ✗ Throws in dev
 */
export function validateTranslation(
  key: string,
  translations: TranslationResources = enAU,
): string {
  const value = resolveTranslationValue(key, translations);

  if (value === undefined) {
    const error = `i18n Error: Key '${key}' not found`;
    if (__DEV__) {
      console.error(error);
      throw new Error(error);
    }
    return key;
  }

  if (typeof value !== 'string') {
    const error =
      `i18n Error: Key '${key}' returns ${typeof value}, expected string. ` +
      `This usually means you're trying to access a parent object instead of a leaf value.`;
    if (__DEV__) {
      console.error(error);
      throw new Error(error);
    }
    return key;
  }

  return value;
}

/**
 * Safe translation getter that returns null if key is invalid
 */
export function getTranslationSafe(
  key: string,
  translations: TranslationResources = enAU,
): string | null {
  const value = resolveTranslationValue(key, translations);
  return typeof value === 'string' ? value : null;
}
