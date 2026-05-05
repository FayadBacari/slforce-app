import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frenchTranslations from './locales/fr';
import englishTranslations from './locales/en';

// Configures the i18n library once when the app starts.
// This file is the ONLY place where i18n is configured.
// Every component uses the useTranslation hook to access translated text.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: frenchTranslations },
      en: { translation: englishTranslations },
    },
    lng: 'fr',          // Default language is French
    fallbackLng: 'fr',  // Fall back to French if a translation key is missing
    interpolation: {
      escapeValue: false, // React already escapes values, no need to do it twice
    },
    // Hermes (React Native's JS engine) doesn't ship the full Intl.PluralRules API,
    // so we use the v3 format which doesn't depend on it.
    compatibilityJSON: 'v3',
  });

export { i18n };
