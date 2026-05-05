import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { AppButton } from '@shared/components/app-button/app-button';
import { useAuthenticationStore } from '@stores/authentication-store';
import { COLORS } from '@shared/design-system';
import { useBankAccount } from '@modules/payments/presentation/hooks/use-bank-account.hook';
import { buildBankAccountStyles } from '@screen-styles/settings/bank-account.styles';

// ─── BankAccountPage ──────────────────────────────────────────────────────────
// Three possible states:
//   1. Not connected   → hero card + "Ajouter un compte bancaire" CTA
//   2. Onboarding incomplete → warning + "Compléter l'inscription Stripe" CTA
//   3. Fully connected → status card + "Tableau de bord" + disconnect button

export default function BankAccountPage() {
  const { theme }    = useTheme();
  const loggedInUser = useAuthenticationStore((store) => store.loggedInUser);
  const styles       = buildBankAccountStyles(theme);

  const {
    status,
    isLoading,
    isActing,
    errorMessage,
    reload,
    handleConnectAccount,
    handleOpenDashboard,
    handleDisconnect,
  } = useBankAccount();

  // Guard — only coaches access this page (Redirect is after hooks, safe)
  if (loggedInUser?.role !== 'coach') {
    return <Redirect href="/(private)/settings" />;
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppScreenWrapper>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
          <Text style={styles.centeredStateText}>Chargement…</Text>
        </View>
      </AppScreenWrapper>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (errorMessage) {
    return (
      <AppScreenWrapper>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={reload} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </AppScreenWrapper>
    );
  }

  const isConnected      = status?.isConnected === true;
  const requiresAction   = isConnected && status.requiresAction;
  const isFullyActive    = isConnected && !status.requiresAction;

  return (
    <AppScreenWrapper noHorizontalPadding>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ──────────────────────────────────────────────────────────────────
            STATE 1 — Not connected at all
        ────────────────────────────────────────────────────────────────── */}
        {!isConnected && (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrapper}>
                <Text style={styles.heroIcon}>🏦</Text>
              </View>

              <Text style={styles.heroTitle}>Recevez vos paiements</Text>
              <Text style={styles.heroSubtitle}>
                Connectez un compte bancaire via Stripe pour recevoir automatiquement
                les paiements de vos athlètes.
              </Text>

              <View style={styles.featureList}>
                {STRIPE_FEATURES.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <View style={styles.featureCheck}>
                      <Text style={styles.featureCheckIcon}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <AppButton
                label="Ajouter un compte bancaire"
                onPress={handleConnectAccount}
                isLoading={isActing}
                fullWidth
                size="large"
              />

              <StripePoweredBy />
            </View>

            <SecurityInfoBox />
          </>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            STATE 2 — Connected but onboarding incomplete
        ────────────────────────────────────────────────────────────────── */}
        {requiresAction && (
          <>
            <View style={styles.warningCard}>
              <View style={styles.warningIconWrapper}>
                <Text style={styles.warningIcon}>⚠️</Text>
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Inscription incomplète</Text>
                <Text style={styles.warningText}>
                  Ton inscription Stripe n'est pas finalisée. Tu ne peux pas encore
                  recevoir de paiements. Complète les étapes manquantes pour activer ton compte.
                </Text>
              </View>
            </View>

            <AppButton
              label="Compléter l'inscription Stripe"
              onPress={handleConnectAccount}
              isLoading={isActing}
              fullWidth
              size="large"
            />

            <View style={styles.stripeLogoRow}>
              <StripePoweredBy />
            </View>
          </>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            STATE 3 — Fully connected and active
        ────────────────────────────────────────────────────────────────── */}
        {isFullyActive && (
          <>
            {/* Status card */}
            <View style={styles.connectedCard}>
              <View style={styles.connectedCardHeader}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeIcon}>✅</Text>
                </View>
                <View style={styles.connectedCardTitleBlock}>
                  <Text style={styles.connectedTitle}>Compte Stripe connecté</Text>
                  {status.email ? (
                    <Text style={styles.connectedEmail}>{status.email}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.connectedDivider} />

              {/* Capabilities pills */}
              <View style={styles.statusPillRow}>
                <StatusPill
                  label="Paiements"
                  active={status.chargesEnabled}
                  theme={theme}
                  styles={styles}
                />
                <StatusPill
                  label="Virements"
                  active={status.payoutsEnabled}
                  theme={theme}
                  styles={styles}
                />
              </View>
            </View>

            {/* Dashboard CTA */}
            <AppButton
              label="Tableau de bord Stripe"
              onPress={handleOpenDashboard}
              isLoading={isActing}
              fullWidth
              size="large"
            />

            <View style={styles.stripeLogoRow}>
              <StripePoweredBy />
            </View>

            {/* Disconnect */}
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              activeOpacity={0.7}
            >
              <Text style={styles.disconnectButtonText}>
                Déconnecter mon compte Stripe
              </Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </AppScreenWrapper>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StripePoweredBy() {
  const { theme } = useTheme();
  const styles    = buildBankAccountStyles(theme);
  return (
    <View style={styles.stripeLogoRow}>
      <Text style={styles.stripePoweredText}>Propulsé par</Text>
      <Text style={styles.stripeBrandText}>stripe</Text>
    </View>
  );
}

function SecurityInfoBox() {
  const { theme } = useTheme();
  const styles    = buildBankAccountStyles(theme);
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxIcon}>🔒</Text>
      <View style={styles.infoBoxContent}>
        <Text style={styles.infoBoxTitle}>Données 100 % sécurisées</Text>
        <Text style={styles.infoBoxText}>
          SLForce ne voit jamais tes coordonnées bancaires. Toute la vérification
          d'identité (KYC) et le stockage des données sont gérés directement par Stripe,
          certifié PCI DSS niveau 1.
        </Text>
      </View>
    </View>
  );
}

interface StatusPillProps {
  label:  string;
  active: boolean;
  theme:  ReturnType<typeof useTheme>['theme'];
  styles: ReturnType<typeof buildBankAccountStyles>;
}

function StatusPill({ label, active, theme, styles }: StatusPillProps) {
  const color = active ? COLORS.semantic.success : COLORS.semantic.warning;
  return (
    <View style={[styles.statusPill, { backgroundColor: color + '18' }]}>
      <View style={[styles.statusPillDot, { backgroundColor: color }]} />
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const STRIPE_FEATURES = [
  'Virements automatiques chaque semaine',
  "Vérification d'identité sécurisée (KYC)",
  'Protection contre les fraudes',
  'Tableau de bord dédié à tes revenus',
];
