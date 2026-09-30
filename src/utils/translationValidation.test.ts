import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resources } from '../i18n';
import { LANGUAGE_OPTIONS } from '../types/i18n';
import { validateTranslation } from '../i18n/types';

const localeDirectory = join(__dirname, '../i18n/locales');
const locales = Object.fromEntries(
  readdirSync(localeDirectory)
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => [
      filename.slice(0, -5),
      JSON.parse(readFileSync(join(localeDirectory, filename), 'utf8')),
    ]),
);

function flattenTranslations(
  value: unknown,
  prefix = '',
  result: Record<string, string> = {},
): Record<string, string> {
  if (typeof value === 'string') {
    expect(value.trim()).not.toBe('');
    result[prefix] = value;
  } else {
    expect(value).not.toBeNull();
    expect(typeof value).toBe('object');
    expect(Object.keys(value as object).length).toBeGreaterThan(0);
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flattenTranslations(child, prefix ? `${prefix}.${key}` : key, result);
    }
  }
  return result;
}

function placeholders(value: string): string[] {
  return Array.from(value.matchAll(/{{\s*-?\s*([^},]+)(?:,[^}]+)?\s*}}/g), (match) =>
    match[1].trim(),
  ).sort();
}

describe('Translation validation across every locale', () => {
  it('registers every locale file and exposes it as a supported language', () => {
    const languages = Object.keys(locales).sort();
    expect(Object.keys(resources).sort()).toEqual(languages);
    expect(LANGUAGE_OPTIONS.map(({ value }) => value).sort()).toEqual(languages);
  });

  for (const [language, translations] of Object.entries(locales)) {
    it(`${language} has the same complete leaf keys and interpolation placeholders as en-AU`, () => {
      const reference = flattenTranslations(locales['en-AU']);
      const actual = flattenTranslations(translations);
      expect(Object.keys(actual).sort()).toEqual(Object.keys(reference).sort());
      for (const key of Object.keys(reference)) {
        expect({ key, placeholders: placeholders(actual[key]) }).toEqual({
          key,
          placeholders: placeholders(reference[key]),
        });
        expect(validateTranslation(key, translations)).toBe(actual[key]);
      }
    });
  }

  it('rejects missing keys and parent objects in development', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => validateTranslation('games.patternTrain.difficulty')).toThrow();
      expect(() => validateTranslation('missing.translation')).toThrow();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
