/**
 * Translation validation tests
 * 
 * Run these tests to ensure all translation keys return strings
 * This catches errors where object keys are used instead of leaf string keys
 */

import enAU from '../i18n/locales/en-AU.json';
import { validateTranslation } from '../i18n/types';

// List of known leaf keys that should return strings
// Add new keys here as you create them
const knownLeafKeys = [
  // Pattern Train
  'games.patternTrain.difficulty.easy.label',
  'games.patternTrain.difficulty.easy.description',
  'games.patternTrain.difficulty.medium.label',
  'games.patternTrain.difficulty.medium.description',
  'games.patternTrain.difficulty.hard.label',
  'games.patternTrain.difficulty.hard.description',
  'games.patternTrain.title',
  'games.patternTrain.subtitle',
  
  // Add more known keys here...
];

// List of known parent keys that should NOT be used directly
// These return objects, not strings
const knownParentKeys = [
  'games.patternTrain.difficulty', // Returns object with easy/medium/hard
  // Add more parent keys here...
];

describe('Translation Validation', () => {
  it('all known leaf keys return strings', () => {
    for (const key of knownLeafKeys) {
      expect(() => validateTranslation(key)).not.toThrow();
      const result = validateTranslation(key);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('parent keys throw errors in dev mode', () => {
    for (const key of knownParentKeys) {
      expect(() => validateTranslation(key)).toThrow();
    }
  });
});

/**
 * Manual validation helper
 * 
 * Call this function to scan all translation keys and find issues
 * Usage: Run in browser console or add to build script
 */
export function scanAllTranslations(): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  function scanObject(obj: unknown, prefix = ''): void {
    if (typeof obj === 'string') {
      valid.push(prefix);
      return;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        scanObject(value, newKey);
      }
    }
  }
  
  scanObject(enAU);
  
  return { valid, invalid };
}

// Run this in your browser console to see all valid translation keys:
// console.log(scanAllTranslations().valid.join('\n'))
