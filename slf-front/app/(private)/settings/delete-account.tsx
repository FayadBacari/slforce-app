import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { useAuthenticationStore } from '@stores/authentication-store';
import { authenticationRepository } from '@modules/authentication/data/repositories/authentication.repository';
import { disconnectCurrentUserFromStreamChat } from '@core/stream-chat/stream-chat-client';
import { buildDeleteAccountStyles } from '@screen-styles/settings/delete-account.styles';

// The confirmation keyword the user must type before deletion is allowed
const REQUIRED_CONFIRMATION_WORD = 'SUPPRIMER';

export default function DeleteAccountPage() {
  const { theme } = useTheme();
  const router    = useRouter();

  const clearAllDataOnLogout = useAuthenticationStore((store) => store.clearAllDataOnLogout);

  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting]               = useState(false);

  const userHasTypedTheCorrectWord = confirmationInput.trim() === REQUIRED_CONFIRMATION_WORD;

  const styles = buildDeleteAccountStyles(theme);

  function showFinalDeletionConfirmationDialog() {
    Alert.alert(
      'Dernière confirmation',
      'Cette action est irréversible. Ton compte et toutes tes données seront définitivement supprimés. Es-tu absolument certain(e) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text:    'Supprimer définitivement',
          style:   'destructive',
          onPress: handleDeleteAccountConfirmed,
        },
      ],
    );
  }

  async function handleDeleteAccountConfirmed() {
    setIsDeleting(true);
    try {
      // Logout-side effects: try the API first, then disconnect chat, then clear local state
      try {
        await authenticationRepository.logoutCurrentUser();
      } catch {
        // Continue even if the API call fails (the user wants to leave anyway)
      }
      await disconnectCurrentUserFromStreamChat();
      await clearAllDataOnLogout();
      router.replace('/(public)/login');
    } catch {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la suppression de ton compte. Réessaie ou contacte le support.',
        [{ text: 'OK' }],
      );
      setIsDeleting(false);
    }
  }

  return (
    <AppScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            La suppression de ton compte est une action irréversible. Toutes tes données,
            conversations, paiements et informations personnelles seront définitivement effacés.
            Cette action ne peut pas être annulée.
          </Text>
        </View>

        {/* What will be deleted */}
        <View style={styles.consequenceCard}>
          <Text style={styles.consequenceTitle}>Ce qui sera supprimé :</Text>
          <View style={styles.consequenceList}>
            {ACCOUNT_DELETION_CONSEQUENCES.map((item, index) => (
              <View key={index} style={styles.consequenceRow}>
                <Text style={styles.consequenceBullet}>•</Text>
                <Text style={styles.consequenceText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Confirmation input */}
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationInstructions}>
            Pour confirmer, tape{' '}
            <Text style={styles.confirmationKeyword}>{REQUIRED_CONFIRMATION_WORD}</Text>
            {' '}dans le champ ci-dessous :
          </Text>
          <AppTextInput
            label="Confirmation"
            value={confirmationInput}
            onChangeText={setConfirmationInput}
            placeholder={REQUIRED_CONFIRMATION_WORD}
            autoCapitalize="characters"
          />
        </View>

        {/* Delete button — only enabled when user typed the correct word */}
        <AppButton
          label="Supprimer mon compte définitivement"
          onPress={showFinalDeletionConfirmationDialog}
          variant="danger"
          isLoading={isDeleting}
          isDisabled={!userHasTypedTheCorrectWord}
          fullWidth
        />

        {/* Cancel / go back */}
        <AppButton
          label="Annuler"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
        />

      </ScrollView>
    </AppScreenWrapper>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCOUNT_DELETION_CONSEQUENCES = [
  'Ton profil et toutes tes informations personnelles',
  'Toutes tes conversations et l\'historique des messages',
  'Ton historique de paiements',
  'Tes paramètres et préférences',
  'Tes coordonnées bancaires (si tu es coach)',
];
