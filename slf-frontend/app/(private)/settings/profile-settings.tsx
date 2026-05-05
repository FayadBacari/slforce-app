import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppTextInput } from '@shared/components/app-text-input/app-text-input';
import { AppButton } from '@shared/components/app-button/app-button';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { useAuthenticationStore } from '@stores/authentication-store';
import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import { DISCIPLINE_OPTIONS } from '@modules/authentication/presentation/hooks/use-register-coach-onboarding.hook';
import { buildProfileSettingsStyles } from '@screen-styles/settings/profile-settings.styles';

// Shape returned by GET /users/profile — we only care about disciplines here
interface ProfileFromServer {
  disciplines?: string[];
}

export default function ProfileSettingsPage() {
  const { t }        = useTranslation();
  const { theme }    = useTheme();
  const styles       = buildProfileSettingsStyles(theme);

  const loggedInUser       = useAuthenticationStore((store) => store.loggedInUser);
  const updateProfilePhoto = useAuthenticationStore((store) => store.updateProfilePhotoUrl);
  const updateDisciplines  = useAuthenticationStore((store) => store.updateDisciplines);

  const isCoach = loggedInUser?.role === 'coach';

  const [firstNameInput, setFirstNameInput] = useState(loggedInUser?.firstName ?? '');
  const [lastNameInput, setLastNameInput]   = useState(loggedInUser?.lastName  ?? '');
  const [emailInput, setEmailInput]         = useState(loggedInUser?.email     ?? '');
  const [isSaving, setIsSaving]             = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── Disciplines (coach only) ───────────────────────────────────────────────
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    loggedInUser?.disciplines ?? [],
  );
  const [isSavingDisciplines, setIsSavingDisciplines] = useState(false);

  // Load current disciplines from the backend on mount so they're always fresh
  // (the auth store only has the value from the last login, not post-edit changes)
  useEffect(() => {
    if (!isCoach) return;

    let cancelled = false;
    async function loadDisciplines() {
      try {
        const response = await apiClient.get<BackendSuccessEnvelope<ProfileFromServer>>(
          API_ENDPOINTS.userProfile.getMyProfile,
        );
        if (!cancelled) {
          const profile = unwrapBackendEnvelope(response);
          setSelectedDisciplines(profile.disciplines ?? []);
        }
      } catch {
        // Keep the value from the auth store as fallback
      }
    }
    void loadDisciplines();
    return () => { cancelled = true; };
  }, [isCoach]);

  const toggleDiscipline = useCallback((discipline: string) => {
    setSelectedDisciplines((prev) =>
      prev.includes(discipline)
        ? prev.filter((d) => d !== discipline)
        : [...prev, discipline],
    );
  }, []);

  async function handleSaveDisciplines(): Promise<void> {
    setIsSavingDisciplines(true);
    try {
      await apiClient.put(API_ENDPOINTS.userProfile.updateMyProfile, {
        disciplines: selectedDisciplines,
      });
      // Keep the auth store in sync so search results reflect the change immediately
      updateDisciplines(selectedDisciplines);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les disciplines. Réessaie.');
    } finally {
      setIsSavingDisciplines(false);
    }
  }

  // ── Photo picker ──────────────────────────────────────────────────────────

  async function pickImageFromSource(source: 'camera' | 'gallery'): Promise<string | null> {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire pour prendre une photo.");
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire pour choisir une photo.");
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:    ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:        [1, 1],
        quality:       0.8,
      });
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    }
  }

  function handleChangePhoto(): void {
    Alert.alert('Changer la photo de profil', 'Choisir une source', [
      { text: '📷  Caméra',  onPress: () => void processPickedPhoto('camera')  },
      { text: '🖼️  Galerie', onPress: () => void processPickedPhoto('gallery') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function processPickedPhoto(source: 'camera' | 'gallery'): Promise<void> {
    const pickedUri = await pickImageFromSource(source);
    if (!pickedUri) return;

    setIsUploadingPhoto(true);
    try {
      // Build a multipart/form-data payload.
      // React Native's XHR layer accepts { uri, type, name } for files.
      const extension = pickedUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const formData  = new FormData();
      formData.append('photo', {
        uri:  pickedUri,
        type: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
        name: `profile-photo.${extension}`,
      } as unknown as Blob);

      // POST to the backend — it saves the file to disk AND persists the remote
      // URL to MongoDB in one request, then returns the public URL.
      const uploadResponse = await apiClient.post<BackendSuccessEnvelope<{ photoUrl: string }>>(
        API_ENDPOINTS.userProfile.uploadProfilePhoto,
        formData,
        // Tell axios not to JSON-stringify this payload; React Native's XHR
        // will automatically add the correct Content-Type + boundary.
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const { photoUrl } = unwrapBackendEnvelope(uploadResponse);

      // Reflect the new remote URL everywhere in the app (in-memory store +
      // SecureStorage quick-load cache for the next app startup).
      await updateProfilePhoto(photoUrl);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la photo. Vérifie ta connexion et réessaie.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  // ── Form save (name) ──────────────────────────────────────────────────────

  async function handleSaveChanges(): Promise<void> {
    setIsSaving(true);
    try {
      await apiClient.put(API_ENDPOINTS.userProfile.updateMyProfile, {
        firstName: firstNameInput.trim() || undefined,
        lastName:  lastNameInput.trim()  || undefined,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications. Réessaie.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fullName = `${loggedInUser?.firstName ?? ''} ${loggedInUser?.lastName ?? ''}`.trim();

  return (
    <AppScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Avatar section ─────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
            ) : (
              <AppAvatar
                photoUrl={loggedInUser?.profilePhotoUrl}
                fullName={fullName || 'Utilisateur'}
                size="xl"
              />
            )}

            {!isUploadingPhoto && (
              <View style={styles.editPhotoBadge}>
                <Text style={styles.editPhotoBadgeEmoji}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto} activeOpacity={0.7}>
            <Text style={styles.changePhotoLabel}>
              {isUploadingPhoto ? 'Mise à jour…' : 'Changer la photo de profil'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Nom / Prénom ────────────────────────────────────────────────── */}
        <View style={styles.formSection}>
          <View style={styles.nameRow}>
            <AppTextInput
              label={t('auth.firstNamePlaceholder')}
              value={firstNameInput}
              onChangeText={setFirstNameInput}
              autoCapitalize="words"
              containerStyle={styles.halfInput}
            />
            <AppTextInput
              label={t('auth.lastNamePlaceholder')}
              value={lastNameInput}
              onChangeText={setLastNameInput}
              autoCapitalize="words"
              containerStyle={styles.halfInput}
            />
          </View>

          <AppTextInput
            label={t('auth.emailPlaceholder')}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>

        <AppButton
          label={t('profile.save')}
          onPress={handleSaveChanges}
          isLoading={isSaving}
          fullWidth
        />

        {/* ── Disciplines (coaches only) ──────────────────────────────────── */}
        {isCoach && (
          <View style={styles.disciplinesSection}>
            <Text style={styles.disciplinesSectionTitle}>Mes disciplines</Text>

            <View style={styles.disciplinesGrid}>
              {DISCIPLINE_OPTIONS.map((discipline) => {
                const isSelected = selectedDisciplines.includes(discipline);
                return (
                  <TouchableOpacity
                    key={discipline}
                    onPress={() => toggleDiscipline(discipline)}
                    style={[styles.disciplineChip, isSelected && styles.disciplineChipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.disciplineChipLabel,
                      isSelected && styles.disciplineChipLabelSelected,
                    ]}>
                      {isSelected ? '✓ ' : ''}{discipline}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppButton
              label="Sauvegarder les disciplines"
              onPress={handleSaveDisciplines}
              isLoading={isSavingDisciplines}
              fullWidth
            />
          </View>
        )}

      </ScrollView>
    </AppScreenWrapper>
  );
}
