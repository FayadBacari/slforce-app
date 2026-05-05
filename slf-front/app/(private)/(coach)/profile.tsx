import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme/theme-provider';
import { useAuthenticationStore } from '@stores/authentication-store';
import { useCoachProfileStore } from '@stores/coach-profile-store';
import { AppHeader } from '@shared/components/app-header/app-header';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { DISCIPLINE_OPTIONS } from '@modules/authentication/presentation/hooks/use-register-coach-onboarding.hook';
import { buildCoachProfileStyles } from '@screen-styles/coach/profile.styles';

export default function CoachProfilePage() {
  const { theme }    = useTheme();
  const loggedInUser = useAuthenticationStore((s) => s.loggedInUser);
  const styles       = buildCoachProfileStyles(theme);

  // ── Profile store ───────────────────────────────────────────────────────────
  const {
    isHydrated,
    displayName,
    speciality,
    location,
    pricePerMonth,
    experienceYears,
    description,
    skills,
    fetchProfileFromServer,
    updateCoachProfileField,
    updateSkills,
    saveProfileToServer,
  } = useCoachProfileStore();

  // Local draft for disciplines while the edit panel is open
  const [pendingSkills, setPendingSkills] = useState<string[]>(skills);

  // Keep draft in sync when store hydrates (e.g. first open)
  useEffect(() => { setPendingSkills(skills); }, [skills]);

  const togglePendingSkill = useCallback((skill: string) => {
    setPendingSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      void fetchProfileFromServer();
    }
  }, [isHydrated, fetchProfileFromServer]);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingRates, setIsEditingRates]     = useState(false);

  const handleAtUsername = displayName
    ? `@${displayName.toLowerCase().replace(/\s+/g, '_')}`
    : `@${((loggedInUser?.firstName ?? '') + (loggedInUser?.lastName ?? '')).toLowerCase().replace(/\s+/g, '_') || 'coach'}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Mon profil" subtitle="Mon Espace Coach" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 1. Identity card ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <AppAvatar
              photoUrl={loggedInUser?.profilePhotoUrl}
              fullName={`${loggedInUser?.firstName ?? ''} ${loggedInUser?.lastName ?? ''}`}
              size="lg"
            />
            <View style={styles.identityTextSection}>
              <Text style={styles.identityName}>
                {loggedInUser?.firstName} {loggedInUser?.lastName}
              </Text>
              <Text style={styles.identitySpeciality}>
                {speciality || 'Spécialité non renseignée'}
              </Text>
              <Text style={styles.identityMeta}>{handleAtUsername}</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Profil coach card ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardEmoji}>🦍</Text>
              <Text style={styles.cardTitle}>Mon profil coach</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, isEditingDetails && styles.editButtonActive]}
              onPress={() => setIsEditingDetails((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonIcon}>{isEditingDetails ? '✖️' : '✏️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text>📝</Text>
              <Text style={styles.fieldLabel}>Description</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={(v) => void updateCoachProfileField('description', v)}
              editable={isEditingDetails}
              multiline
              numberOfLines={3}
              placeholder="Décris-toi en quelques mots..."
              style={[styles.textArea, !isEditingDetails && styles.textAreaDisabled]}
            />
          </View>

          {/* Spécialité */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text>⭐</Text>
              <Text style={styles.fieldLabel}>Spécialité</Text>
            </View>
            {isEditingDetails ? (
              <TextInput
                value={speciality}
                onChangeText={(v) => void updateCoachProfileField('speciality', v)}
                style={styles.inputUnderlined}
              />
            ) : (
              <View style={styles.specialityBadge}>
                <Text style={styles.specialityBadgeText}>
                  {speciality || '—'}
                </Text>
              </View>
            )}
          </View>

          {/* Localisation */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text>📍</Text>
              <Text style={styles.fieldLabel}>Ville</Text>
            </View>
            {isEditingDetails ? (
              <TextInput
                value={location}
                onChangeText={(v) => void updateCoachProfileField('location', v)}
                style={styles.inputUnderlined}
              />
            ) : (
              <Text style={styles.fieldValue}>{location || '—'}</Text>
            )}
          </View>

          {/* Disciplines */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text>💪</Text>
              <Text style={styles.fieldLabel}>Disciplines</Text>
            </View>
            {isEditingDetails ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {DISCIPLINE_OPTIONS.map((option) => {
                  const isSelected = pendingSkills.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => togglePendingSkill(option)}
                      activeOpacity={0.7}
                      style={[
                        styles.specialityBadge,
                        isSelected && { borderColor: theme.colors.brandPrimary, backgroundColor: `${theme.colors.brandPrimary}18` },
                      ]}
                    >
                      <Text style={[
                        styles.specialityBadgeText,
                        isSelected && { color: theme.colors.brandPrimary, fontWeight: '700' },
                      ]}>
                        {isSelected ? '✓ ' : ''}{option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              skills.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {skills.map((skill) => (
                    <View key={skill} style={styles.specialityBadge}>
                      <Text style={styles.specialityBadgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.fieldValue}>—</Text>
              )
            )}
          </View>

          {isEditingDetails && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                await updateSkills(pendingSkills);
                void saveProfileToServer();
                setIsEditingDetails(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>💾  Enregistrer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3. Tarifs & expérience card ───────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardEmoji}>💼</Text>
              <Text style={styles.cardTitle}>Tarifs & expérience</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, isEditingRates && styles.editButtonActive]}
              onPress={() => setIsEditingRates((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonIcon}>{isEditingRates ? '✖️' : '✏️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Tarif mensuel */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text>💶</Text>
              <Text style={styles.fieldLabel}>Tarif mensuel</Text>
            </View>
            {isEditingRates ? (
              <View style={styles.rateRow}>
                <TextInput
                  value={pricePerMonth}
                  onChangeText={(v) => void updateCoachProfileField('pricePerMonth', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  style={styles.inputUnderlined}
                />
                <Text style={styles.rateUnit}>€ / mois</Text>
              </View>
            ) : (
              <View style={styles.rateRow}>
                <Text style={styles.rateValue}>{pricePerMonth || '—'}</Text>
                <Text style={styles.rateUnit}>€ / mois</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Athlètes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              {isEditingRates ? (
                <TextInput
                  value={experienceYears}
                  onChangeText={(v) => void updateCoachProfileField('experienceYears', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  style={[styles.statValue, styles.inputUnderlined]}
                />
              ) : (
                <Text style={styles.statValue}>{experienceYears || '0'}</Text>
              )}
              <Text style={styles.statLabel}>Années</Text>
            </View>
          </View>

          {isEditingRates && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => { void saveProfileToServer(); setIsEditingRates(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>💾  Enregistrer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 4. Visibilité banner ──────────────────────────────────────────── */}
        <View style={styles.visibilityBanner}>
          <Text style={styles.visibilityBannerEmoji}>👁️</Text>
          <View style={styles.visibilityBannerContent}>
            <Text style={styles.visibilityBannerTitle}>Visibilité du profil</Text>
            <Text style={styles.visibilityBannerText}>
              Ton profil est public — il apparaît dans la recherche des athlètes.
              Tu peux désactiver la visibilité dans Paramètres → Confidentialité.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
