import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme } from './light-theme';
import { darkTheme } from './dark-theme';
import type { AppTheme } from './theme.types';
import {
  readValueFromSecureStorage,
  saveValueToSecureStorage,
} from '@core/storage/secure-storage';
import { SECURE_STORAGE_KEYS } from '@core/storage/secure-storage-keys';

// The data that every component can access through the theme context
interface ThemeContextValue {
  theme: AppTheme;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The provider wraps the entire app and makes the theme available everywhere.
// It remembers the user's preference in secure storage so it persists between sessions.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with the system color scheme while we load the saved preference
  const systemColorScheme = useColorScheme();
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState<boolean>(
    systemColorScheme === 'dark',
  );

  // On first load, check if the user has a saved theme preference
  useEffect(() => {
    async function loadSavedThemePreference() {
      const savedPreference = await readValueFromSecureStorage(
        SECURE_STORAGE_KEYS.isDarkModeEnabled,
      );

      if (savedPreference !== null) {
        // The user has a saved preference — use it
        setIsDarkModeEnabled(savedPreference === 'true');
      } else {
        // No saved preference — follow the system setting
        setIsDarkModeEnabled(systemColorScheme === 'dark');
      }
    }

    loadSavedThemePreference();
  }, [systemColorScheme]);

  // When the user switches the theme, save the new preference immediately
  const toggleDarkMode = useCallback(async () => {
    const newDarkModeState = !isDarkModeEnabled;
    setIsDarkModeEnabled(newDarkModeState);
    await saveValueToSecureStorage(
      SECURE_STORAGE_KEYS.isDarkModeEnabled,
      String(newDarkModeState),
    );
  }, [isDarkModeEnabled]);

  const currentTheme = isDarkModeEnabled ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook used by every component that needs the current theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a <ThemeProvider>.');
  }
  return context;
}
