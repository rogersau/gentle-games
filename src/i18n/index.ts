import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE } from '../types/i18n';

// Import translation files
import enAU from './locales/en-AU.json';
import enUS from './locales/en-US.json';

const resources = {
  'en-AU': {
    translation: enAU,
  },
  'en-US': {
    translation: enUS,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en-AU',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

export const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language);
};

export const getCurrentLanguage = (): string => {
  return i18n.language || DEFAULT_LANGUAGE;
};
