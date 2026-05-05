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
  useRegisterAthleteOnboarding,
  MALE_WEIGHT_CATEGORIES,
  FEMALE_WEIGHT_CATEGORIES,
} from '../hooks/use-register-athlete-onboarding.hook';

export function RegisterAthleteOnboardingScreen() {
  const { t }   = useTranslation();
  const { theme } = useTheme();
  const styles    = buildOnboardingScreenStyles(theme);
  const scrollRef = useRef<ScrollView>(null);

  const {
    currentStep, totalSteps, fadeAnim,
    profileData, setProfileData,
    loading, errorMessage,
    canProceed,
    handleBack, handleNext, handleSubmit,
    handleRecordChange,
  } = useRegisterAthleteOnboarding();

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const categories =
    profileData.gender === 'female' ? FEMALE_WEIGHT_CATEGORIES : MALE_WEIGHT_CATEGORIES;

  // ── Step content ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      case 1:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="👤"
            title={t('registerAthlete.step1Title')}
            subtitle={t('registerAthlete.step1Subtitle')}
          >
            <TextInput
              value={profileData.displayName}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, displayName: text }))}
              onFocus={scrollToBottom}
              placeholder={t('registerAthlete.step1Placeholder')}
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
            icon="⚥"
            title={t('registerAthlete.step2Title')}
            subtitle={t('registerAthlete.step2Subtitle')}
          >
            <View style={styles.badgesRow}>
              {([
                { value: 'male'   as const, label: t('registerAthlete.man') },
                { value: 'female' as const, label: t('registerAthlete.woman') },
              ]).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setProfileData((prev) => ({ ...prev, gender: option.value }))}
                  style={[
                    styles.badgeButton,
                    profileData.gender === option.value && styles.badgeButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeButtonText,
                      profileData.gender === option.value && styles.badgeButtonTextSelected,
                    ]}
                  >
                    {option.label}
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
            icon="⚖️"
            title={t('registerAthlete.step3Title')}
            subtitle={t('registerAthlete.step3Subtitle')}
          >
            <View style={styles.badgesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setProfileData((prev) => ({ ...prev, weightCategory: cat }))}
                  style={[
                    styles.disciplineBadge,
                    profileData.weightCategory === cat && styles.disciplineBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.disciplineBadgeText,
                      profileData.weightCategory === cat && styles.disciplineBadgeTextSelected,
                    ]}
                  >
                    {cat} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </RegistrationStepCard>
        );

      case 4:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="⚖️"
            title={t('registerAthlete.step4Title')}
            subtitle={t('registerAthlete.step4Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.weightKg}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, weightKg: text.replace(/[^0-9.]/g, '') }))
                }
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>kg</Text>
            </View>
          </RegistrationStepCard>
        );

      case 5:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="📏"
            title={t('registerAthlete.step5Title')}
            subtitle={t('registerAthlete.step5Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.heightCm}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, heightCm: text.replace(/[^0-9]/g, '') }))
                }
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>cm</Text>
            </View>
          </RegistrationStepCard>
        );

      case 6:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="🏋️"
            title={t('registerAthlete.step6Title')}
            subtitle={t('registerAthlete.step6Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.records.muscleUp}
                onChangeText={(text) => handleRecordChange('muscleUp', text)}
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>kg</Text>
            </View>
          </RegistrationStepCard>
        );

      case 7:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="🧗"
            title={t('registerAthlete.step7Title')}
            subtitle={t('registerAthlete.step7Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.records.traction}
                onChangeText={(text) => handleRecordChange('traction', text)}
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>kg</Text>
            </View>
          </RegistrationStepCard>
        );

      case 8:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="💪"
            title={t('registerAthlete.step8Title')}
            subtitle={t('registerAthlete.step8Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.records.dips}
                onChangeText={(text) => handleRecordChange('dips', text)}
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>kg</Text>
            </View>
          </RegistrationStepCard>
        );

      case 9:
        return (
          <RegistrationStepCard
            styles={styles} fadeAnim={fadeAnim}
            icon="🏋️‍♂️"
            title={t('registerAthlete.step9Title')}
            subtitle={t('registerAthlete.step9Subtitle')}
          >
            <View style={styles.numericInputRow}>
              <TextInput
                value={profileData.records.squat}
                onChangeText={(text) => handleRecordChange('squat', text)}
                onFocus={scrollToBottom}
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="numeric"
                style={styles.numericInput}
                autoFocus
              />
              <Text style={styles.unitLabel}>kg</Text>
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
            {t('registerAthlete.stepProgress', { current: currentStep, total: totalSteps })}
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
              <Text style={styles.backButtonText}>← {t('registerAthlete.back')}</Text>
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
                ? t('registerAthlete.loading')
                : isLastStep
                  ? t('registerAthlete.finish')
                  : t('registerAthlete.next')}
            </Text>
            {!isLastStep && !loading && <Text style={styles.nextButtonText}> →</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
