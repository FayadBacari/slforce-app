import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shared/theme/theme-provider';
import { AppHeader } from '@shared/components/app-header/app-header';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { buildAthleteProfileStyles } from '@screen-styles/athlete/profile.styles';
import {
  useAthleteProfileScreen,
  RECORD_CARDS,
  GENDER_OPTIONS,
} from '@modules/users/presentation/hooks/use-athlete-profile-screen.hook';

export default function AthleteProfilePage() {
  const { theme } = useTheme();
  const styles    = buildAthleteProfileStyles(theme);

  const {
    loggedInUser,
    gender,
    weightCategory,
    weightKg,
    heightCm,
    records,
    isEditingProfile,
    setIsEditingProfile,
    isEditingRecords,
    setIsEditingRecords,
    totalKilograms,
    handleAtUsername,
    currentGender,
    weightCategoryList,
    updateAthleteProfileField,
    updateAthleteRecord,
    saveProfileToServer,
  } = useAthleteProfileScreen();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Ma Fiche Athlète" subtitle="Street Lifting Records" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 1. Profil Athlète card ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitleEmoji}>👤</Text>
              <Text style={styles.cardTitleText}>Profil Athlète</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, isEditingProfile && styles.editButtonActive]}
              onPress={() => setIsEditingProfile((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonIcon}>{isEditingProfile ? '✖️' : '✏️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <AppAvatar
                photoUrl={loggedInUser?.profilePhotoUrl}
                fullName={`${loggedInUser?.firstName ?? ''} ${loggedInUser?.lastName ?? ''}`.trim() || 'Athlète'}
                sizeOverride={140}
              />
            </View>
            <Text style={styles.nameText}>{loggedInUser?.firstName || 'Athlète'}</Text>
            <Text style={styles.handleText}>{handleAtUsername}</Text>
          </View>

          {/* GENRE */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionLabel}>Genre</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const isActive = option.key === currentGender;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.genderButton, isActive && styles.genderButtonActive]}
                    onPress={() => { if (isEditingProfile) void updateAthleteProfileField('gender', option.key); }}
                    activeOpacity={isEditingProfile ? 0.7 : 1}
                  >
                    <Text style={styles.genderEmoji}>{option.emoji}</Text>
                    <Text style={[styles.genderLabel, isActive && styles.genderLabelActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CATÉGORIE DE POIDS */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionLabel}>Catégorie de poids</Text>
            <View style={styles.weightGrid}>
              {weightCategoryList.map((cat) => {
                const isActive = cat === weightCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.weightChip, isActive && styles.weightChipActive]}
                    onPress={() => { if (isEditingProfile) void updateAthleteProfileField('weightCategory', cat); }}
                    activeOpacity={isEditingProfile ? 0.7 : 1}
                  >
                    <Text style={[styles.weightChipLabel, isActive && styles.weightChipLabelActive]}>
                      {cat} kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* POIDS */}
          <View style={styles.numericFieldRow}>
            <Text style={styles.numericFieldIcon}>⚖️</Text>
            <Text style={styles.numericFieldLabel}>Poids (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={(v) => void updateAthleteProfileField('weightKg', v.replace(/[^0-9]/g, ''))}
              editable={isEditingProfile}
              keyboardType="numeric"
              style={styles.numericFieldInput}
            />
          </View>

          {/* TAILLE */}
          <View style={styles.numericFieldRow}>
            <Text style={styles.numericFieldIcon}>📏</Text>
            <Text style={styles.numericFieldLabel}>Taille (cm)</Text>
            <TextInput
              value={heightCm}
              onChangeText={(v) => void updateAthleteProfileField('heightCm', v.replace(/[^0-9]/g, ''))}
              editable={isEditingProfile}
              keyboardType="numeric"
              style={styles.numericFieldInput}
            />
          </View>

          {isEditingProfile && (
            <TouchableOpacity
              style={styles.saveRecordsButton}
              onPress={() => { void saveProfileToServer(); setIsEditingProfile(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.saveRecordsButtonText}>💾  Enregistrer le profil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 2. Records personnels card ──────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitleEmoji}>🥇</Text>
              <Text style={styles.cardTitleText}>Records Personnels</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, isEditingRecords && styles.editButtonActive]}
              onPress={() => setIsEditingRecords((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonIcon}>{isEditingRecords ? '✖️' : '✏️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recordsList}>
            {RECORD_CARDS.map((recordCard) => (
              <View
                key={recordCard.key}
                style={[styles.recordItem, styles[recordCard.colorKey]]}
              >
                <View style={styles.recordItemHeaderRow}>
                  <Text style={[styles.recordItemLabel, recordCard.isOnDark && styles.recordItemLabelOnDark]}>
                    {recordCard.label}
                  </Text>
                  <Text style={styles.recordItemTrendEmoji}>📈</Text>
                </View>

                <View style={[styles.recordItemValueRow, recordCard.isOnDark && styles.recordItemValueRowOnDark]}>
                  <View style={{ width: 24 }} />
                  <TextInput
                    value={records[recordCard.key]}
                    onChangeText={(v) => void updateAthleteRecord(recordCard.key, v.replace(/[^0-9]/g, ''))}
                    editable={isEditingRecords}
                    keyboardType="numeric"
                    style={[
                      styles.recordItemValue,
                      recordCard.isOnDark && styles.recordItemValueOnDark,
                      isEditingRecords && styles.recordItemValueEditable,
                    ]}
                  />
                  <Text style={[styles.recordItemUnit, recordCard.isOnDark && styles.recordItemUnitOnDark]}>
                    kg
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {isEditingRecords && (
            <TouchableOpacity
              style={styles.saveRecordsButton}
              onPress={() => { void saveProfileToServer(); setIsEditingRecords(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.saveRecordsButtonText}>💾  Enregistrer mes records</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3. Total Street Lifting ─────────────────────────────────────────── */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardContent}>
            <View style={styles.totalCardLeft}>
              <Text style={styles.totalCardLabel}>Total Street Lifting</Text>
              <Text style={styles.totalCardValue}>{totalKilograms}.00</Text>
              <Text style={styles.totalCardUnit}>kg combinés</Text>
            </View>
            <Text style={styles.totalCardEmoji}>🎯</Text>
          </View>
        </View>

        {/* ── 4. Tip box ──────────────────────────────────────────────────────── */}
        <View style={styles.tipBox}>
          <Text style={styles.tipBoxEmoji}>💡</Text>
          <View style={styles.tipBoxContent}>
            <Text style={styles.tipBoxTitle}>Comment améliorer ton score ?</Text>
            <Text style={styles.tipBoxText}>
              Ton total Street Lifting est la somme de tes 4 records. Continue à t'entraîner
              régulièrement avec ton coach pour battre tes records ! 🔥
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
