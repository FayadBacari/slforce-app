import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';
import { AppAvatar } from '@shared/components/app-avatar/app-avatar';
import { useMakePayment } from '@modules/payments/presentation/hooks/use-make-payment.hook';
import { buildMakePaymentStyles } from '../styles/make-payment.styles';

// ─── Quick-select amounts (€) ────────────────────────────────────────────────
const PRESET_AMOUNTS = [20, 30, 50, 80, 100, 150];

// ─── MakePaymentScreen ────────────────────────────────────────────────────────
//
// Opens from the chat ⋮ menu ("Effectuer un paiement") — athletes only.
// Params: coachId, coachName (forwarded by the menu).
//
// Flow:
//   1. Athlete picks an amount (preset or manual) + optional note
//   2. Taps "Payer X €" → calls POST /payments/intent on our backend
//   3. Backend creates a Stripe PaymentIntent (transfer_data → coach)
//   4. Native payment sheet opens — Apple Pay, Google Pay, or card
//   5. Success screen shown on confirmation
export function MakePaymentScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const styles    = buildMakePaymentStyles(theme);

  // ─── Params ───────────────────────────────────────────────────────────────
  const rawParams = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const readParam = (key: string): string => {
    const v = rawParams[key];
    if (Array.isArray(v)) return v[0] ?? '';
    return v ?? '';
  };
  const coachName = readParam('coachName') || 'Coach';
  const coachId   = readParam('coachId');

  // ─── Local state ──────────────────────────────────────────────────────────
  const [amountText, setAmountText]    = useState('');
  const [description, setDescription] = useState('');

  const parsedAmount   = parseFloat(amountText.replace(',', '.'));
  const isAmountValid  = !isNaN(parsedAmount) && parsedAmount >= 0.50; // Stripe minimum

  // ─── Payment hook (Stripe payment sheet) ──────────────────────────────────
  const { status, isLoading, isSuccess, errorMessage, initializePayment, resetPayment } =
    useMakePayment();

  // Filters input so only digits and one decimal separator are accepted.
  // Commas are normalised to dots (French keyboard) and any extra decimal
  // points after the first are stripped.
  const handleAmountChanged = useCallback((text: string) => {
    // 1. Strip everything that isn't a digit, a dot, or a comma
    let cleaned = text.replace(/[^0-9.,]/g, '');
    // 2. Normalise French comma → dot
    cleaned = cleaned.replace(',', '.');
    // 3. Collapse multiple decimal points — keep only the first
    const [integer = '', ...decimals] = cleaned.split('.');
    cleaned = decimals.length > 0
      ? `${integer}.${decimals.join('')}`
      : integer;
    setAmountText(cleaned);
  }, []);

  const handlePresetPressed = useCallback((amount: number) => {
    setAmountText(String(amount));
  }, []);

  const handlePayPressed = useCallback(async () => {
    if (!isAmountValid || !coachId) return;
    await initializePayment({
      coachId,
      coachName,
      amountInCents: Math.round(parsedAmount * 100),
      description:   description.trim() || undefined,
    });
  }, [isAmountValid, coachId, coachName, parsedAmount, description, initializePayment]);

  // ─── Success state ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Paiement confirmé !</Text>
          <Text style={styles.successSubtitle}>
            {`Votre paiement de ${parsedAmount.toFixed(2).replace('.', ',')} € a bien été envoyé à ${coachName}.`}
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.successButtonText}>Retour à la conversation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.6}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Effectuer un paiement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ─── Recipient card ─────────────────────────────────────────── */}
          <View style={styles.recipientCard}>
            <AppAvatar photoUrl={undefined} fullName={coachName || 'Coach'} size="md" />
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientLabel}>Paiement vers</Text>
              <Text style={styles.recipientName}>{coachName}</Text>
            </View>
            {/* Stripe logo pill */}
            <View style={styles.stripePill}>
              <Text style={styles.stripePillText}>Stripe</Text>
            </View>
          </View>

          {/* ─── Amount input ────────────────────────────────────────────── */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionLabel}>Montant</Text>
            <View style={styles.amountInputRow}>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={handleAmountChanged}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={8}
                editable={!isLoading}
              />
              <Text style={styles.currencySymbol}>€</Text>
            </View>

            {/* Quick-select preset buttons */}
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetChip,
                    amountText === String(amount) && styles.presetChipSelected,
                  ]}
                  onPress={() => handlePresetPressed(amount)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      amountText === String(amount) && styles.presetChipTextSelected,
                    ]}
                  >
                    {amount} €
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── Optional note ───────────────────────────────────────────── */}
          <View style={styles.noteSection}>
            <Text style={styles.sectionLabel}>Note (facultatif)</Text>
            <TextInput
              style={styles.noteInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex : séance du 15 mai, programme mensuel…"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {/* ─── Error banner ─────────────────────────────────────────────── */}
          {status === 'error' && errorMessage ? (
            <TouchableOpacity
              style={styles.errorBanner}
              onPress={resetPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.errorBannerIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorBannerTitle}>Paiement échoué</Text>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
              <Text style={styles.errorBannerDismiss}>✕</Text>
            </TouchableOpacity>
          ) : null}

          {/* ─── Confirm / Pay button ────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.payButton,
              (!isAmountValid || isLoading) && styles.payButtonDisabled,
            ]}
            onPress={handlePayPressed}
            disabled={!isAmountValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                {isAmountValid
                  ? `Payer ${parsedAmount.toFixed(2).replace('.', ',')} €`
                  : 'Entrez un montant (min. 0,50 €)'}
              </Text>
            )}
          </TouchableOpacity>

          {/* ─── Apple Pay hint ──────────────────────────────────────────── */}
          <View style={styles.methodsHint}>
            <Text style={styles.methodsHintText}>
              {Platform.OS === 'ios'
                ? '💳  Carte bancaire · 🍎 Apple Pay · sécurisé par Stripe'
                : '💳  Carte bancaire · sécurisé par Stripe'}
            </Text>
          </View>

          <Text style={styles.secureNote}>
            Vos données bancaires ne transitent jamais par nos serveurs.
            Paiement traité et sécurisé par Stripe Inc.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

