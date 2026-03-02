import 'i18next';
import type { TranslationResources } from './types';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationResources;
    };
  }
}
