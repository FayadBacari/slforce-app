import React, { useRef } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/theme-provider';
import { buildOnboardingScreenStyles } from '../styles/register-onboarding-screen.styles';
import { RegistrationStepCard } from '../components/registration-step-card/registration-step-card';
import {
  useRegisterCoachOnboarding,
  SPECIALITY_OPTIONS,
  DISCIPLINE_OPTIONS,
} from '../hooks/use-register-coach-onboarding.hook';

export function RegisterCoachOnboardingScreen() {
  const { t }     = useTranslation();
  const { theme } = useTheme();
  const styles    = buildOnboardingScreenStyles(theme);
  const scrollRef = useRef<ScrollView>(null);

  const {
    currentStep, totalSteps, fadeAnim,
    profileData, setProfileData,
    loading, errorMessage,
    canProceed,
    handleBack, handleNext, handleSubmit,
    selectSpeciality, toggleDiscipline,
  } = useRegisterCoachOnboarding();

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  // ── Step content ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      case 1:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="👤"
            title={t('registerCoach.step1Title')}
            subtitle={t('registerCoach.step1Subtitle')}
          >
            <TextInput
              value={profileData.displayName}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, displayName: text }))}
              onFocus={scrollToBottom}
              placeholder={t('registerCoach.step1Placeholder')}
              placeholderTextColor={theme.colors.textDisabled}
              style={styles.input}
              autoFocus
              autoCapitalize="none"
              maxLength={30}
            />
          </RegistrationStepCard>
        );

      case 2:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="⭐"
            title={t('registerCoach.step2Title')}
            subtitle={t('registerCoach.step2Subtitle')}
          >
            <TextInput
              value={profileData.speciality}
              editable={false}
              placeholder={t('registerCoach.step2Placeholder')}
              placeholderTextColor={theme.colors.textDisabled}
              style={[styles.input, styles.inputReadOnly]}
            />
            <View style={styles.badgesRow}>
              {SPECIALITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => selectSpeciality(option)}
                  style={[
                    styles.badgeButton,
                    profileData.speciality === option && styles.badgeButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeButtonText,
                      profileData.speciality === option && styles.badgeButtonTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </RegistrationStepCard>
        );

      case 3:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="📍"
            title={t('registerCoach.step3Title')}
            subtitle={t('registerCoach.step3Subtitle')}
          >
            <TextInput
              value={profileData.location}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, location: text }))}
              onFocus={scrollToBottom}
              placeholder={t('registerCoach.step3Placeholder')}
              placeholderTextColor={theme.colors.textDisabled}
              style={styles.input}
              autoFocus
            />
          </RegistrationStepCard>
        );

      case 4:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="💰"
            title={t('registerCoach.step4Title')}
            subtitle={t('registerCoach.step4Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.pricePerMonth}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, pricePerMonth: text.replace(/[^0-9]/g, '') }))
                }
                onFocus={scrollToBottom}
                placeholder={t('registerCoach.step4Placeholder')}
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>€{t('registerCoach.month')}</Text>
            </View>
          </RegistrationStepCard>
        );

      case 5:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="🏆"
            title={t('registerCoach.step5Title')}
            subtitle={t('registerCoach.step5Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.experienceYears}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, experienceYears: text.replace(/[^0-9]/g, '') }))
                }
                onFocus={scrollToBottom}
                placeholder={t('registerCoach.step5Placeholder')}
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>ans</Text>
            </View>
          </RegistrationStepCard>
        );

      case 6:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="📝"
            title={t('registerCoach.step6Title')}
            subtitle={t('registerCoach.step6Subtitle')}
          >
            <TextInput
              value={profileData.description}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, description: text }))}
              onFocus={scrollToBottom}
              placeholder={t('registerCoach.step6Placeholder')}
              placeholderTextColor={theme.colors.textDisabled}
              multiline
              numberOfLines={5}
              style={styles.textArea}
              autoFocus
            />
            <Text style={[styles.feedbackChecking, { alignSelf: 'flex-end' }]}>
              {profileData.description.trim().length} / 20 min
            </Text>
          </RegistrationStepCard>
        );

      case 7:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="💪"
            title={t('registerCoach.step7Title')}
            subtitle={t('registerCoach.step7Subtitle')}
          >
            <View style={styles.badgesGrid}>
              {DISCIPLINE_OPTIONS.map((discipline) => {
                const isSelected = profileData.skills.includes(discipline);
                return (
                  <TouchableOpacity
                    key={discipline}
                    onPress={() => toggleDiscipline(discipline)}
                    style={[
                      styles.disciplineBadge,
                      isSelected && styles.disciplineBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.disciplineBadgeText,
                        isSelected && styles.disciplineBadgeTextSelected,
                      ]}
                    >
                      {discipline}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedInfoText}>
                {t('registerCoach.selectedCount', { count: profileData.skills.length })}
              </Text>
            </View>
          </RegistrationStepCard>
        );

      default:
        return null;
    }
  };

  const isLastStep   = currentStep === totalSteps;
  const progressFill = `${(currentStep / totalSteps) * 100}%`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 20}
      >
        {/* ── Progress ── */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressFill as any }]} />
          </View>
          <Text style={styles.progressText}>
            {t('registerCoach.stepProgress', { current: currentStep, total: totalSteps })}
          </Text>
        </View>

        {/* ── Step content ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {renderStep()}
        </ScrollView>

        {/* ── Error ── */}
        {errorMessage ? (
          <Text style={[styles.feedbackError, { textAlign: 'center', paddingHorizontal: 20, marginBottom: 4 }]}>
            {errorMessage}
          </Text>
        ) : null}

        {/* ── Navigation buttons ── */}
        <View style={styles.navigationBar}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← {t('registerCoach.back')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={isLastStep ? handleSubmit : handleNext}
            disabled={!canProceed || loading}
            style={[
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFull,
              (!canProceed || loading) && styles.nextButtonDisabled,
            ]}
          >
            <Text style={styles.nextButtonText}>
              {loading
                ? t('registerCoach.loading')
                : isLastStep
                  ? t('registerCoach.finish')
                  : t('registerCoach.next')}
            </Text>
            {!isLastStep && !loading && <Text style={styles.nextButtonText}> →</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
