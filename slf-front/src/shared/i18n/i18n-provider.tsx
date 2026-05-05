import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './i18n-setup';
import {
  readValueFromSecureStorage,
  saveValueToSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';

// Supported language codes
export type AppLanguage = 'fr' | 'en';

// The data accessible through the language context
interface LanguageContextValue {
  currentLanguage: AppLanguage;
  changeLanguageTo: (newLanguage: AppLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Wraps the app and provides language switching to every component.
// Remembers the user's language preference between sessions.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('fr');

  // On first load, restore the user's saved language preference
  useEffect(() => {
    async function loadSavedLanguagePreference() {
      const savedLanguage = await readValueFromSecureStorage(
        SECURE_STORAGE_KEYS.selectedLanguage,
      );
      if (savedLanguage === 'fr' || savedLanguage === 'en') {
        setCurrentLanguage(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      }
    }

    loadSavedLanguagePreference();
  }, []);

  // Changes the language and saves the preference for future sessions
  const changeLanguageTo = useCallback(async (newLanguage: AppLanguage) => {
    setCurrentLanguage(newLanguage);
    await i18n.changeLanguage(newLanguage);
    await saveValueToSecureStorage(SECURE_STORAGE_KEYS.selectedLanguage, newLanguage);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ currentLanguage, changeLanguageTo }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

// Hook used by every component that needs to switch languages
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside a <LanguageProvider>.');
  }
  return context;
}
