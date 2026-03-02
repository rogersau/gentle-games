export type SupportedLanguage = 'en-AU' | 'en-US';

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en-AU', label: '🇦🇺 English (Australia)' },
  { value: 'en-US', label: '🇺🇸 English (United States)' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en-AU';
