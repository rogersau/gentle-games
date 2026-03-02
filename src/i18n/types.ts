import enAU from './locales/en-AU.json';

// Define the translation resource type based on en-AU (the source of truth)
export type TranslationResources = typeof enAU;

// Helper type to extract all dot-notation keys from the translations
type Join<K, P> = K extends string | number ?
  P extends string | number ?
    `${K}${'' extends P ? '' : '.'}${P}`
  : never
: never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];

type Leaves<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
  { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
: '';

// Export all valid translation keys as a union type
export type TranslationKey = Leaves<TranslationResources>;

// Extend i18next types for type-safe translations
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationResources;
    };
  }
}
