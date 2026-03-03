import type enAU from './locales/en-AU.json';

// Define the translation resource type based on en-AU (the source of truth)
export type TranslationResources = typeof enAU;

// Simple string key type for flexibility
export type TranslationKey = string;

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
  translations: TranslationResources = enAU
): string {
  const parts = key.split('.');
  let current: unknown = translations;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      const error = `i18n Error: Key '${key}' not found`;
      if (__DEV__) {
        console.error(error);
        throw new Error(error);
      }
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  if (typeof current !== 'string') {
    const error = `i18n Error: Key '${key}' returns ${typeof current}, expected string. ` +
      `This usually means you're trying to access a parent object instead of a leaf value.`;
    if (__DEV__) {
      console.error(error);
      throw new Error(error);
    }
    return key;
  }
  
  return current;
}

/**
 * Safe translation getter that returns null if key is invalid
 */
export function getTranslationSafe(
  key: string,
  translations: TranslationResources = enAU
): string | null {
  try {
    return validateTranslation(key, translations);
  } catch {
    return null;
  }
}
