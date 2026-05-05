import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { useLanguage, type AppLanguage } from '@shared/i18n/i18n-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { buildLanguageStyles } from '@screen-styles/settings/language.styles';

// The languages the user can choose from
const AVAILABLE_LANGUAGES: { code: AppLanguage; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'Anglais',  nativeLabel: 'English',  flag: '🇬🇧' },
];

export default function LanguagePage() {
  const { theme } = useTheme();
  const { currentLanguage, changeLanguageTo } = useLanguage();
  const styles = buildLanguageStyles(theme);

  return (
    <AppScreenWrapper>
      <View style={styles.container}>
        <View style={styles.languageList}>
          {AVAILABLE_LANGUAGES.map((language) => {
            const isCurrentlySelected = language.code === currentLanguage;

            return (
              <TouchableOpacity
                key={language.code}
                style={[styles.languageRow, isCurrentlySelected && styles.selectedLanguageRow]}
                onPress={() => changeLanguageTo(language.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmoji}>{language.flag}</Text>
                <View style={styles.languageTextSection}>
                  <Text style={styles.nativeLabel}>{language.nativeLabel}</Text>
                  <Text style={styles.translatedLabel}>{language.label}</Text>
                </View>
                {isCurrentlySelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </AppScreenWrapper>
  );
}
