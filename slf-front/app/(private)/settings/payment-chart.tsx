import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { useAuthenticationStore } from '@stores/authentication-store';
import { COLORS } from '@shared/design-system';
import { usePaymentChart } from '@modules/payments/presentation/hooks/use-payment-chart.hook';
import { buildPaymentChartStyles } from '@screen-styles/settings/payment-chart.styles';
import type { ReceivedPaymentEntity } from '@modules/payments/domain/entities/payment.entity';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PaymentChartPage() {
  // ALL hooks must be called unconditionally (React rules of hooks)
  const { theme }    = useTheme();
  const loggedInUser = useAuthenticationStore((store) => store.loggedInUser);
  const styles       = buildPaymentChartStyles(theme);
  const screenWidth  = Dimensions.get('window').width;

  const {
    totalEarnings,
    thisMonthEarnings,
    displayedTransactions,
    chartData,
    isLoading,
    errorMessage,
    reload,
  } = usePaymentChart();

  const chartConfig = useMemo(() => ({
    backgroundColor:        theme.colors.cardBackground,
    backgroundGradientFrom: theme.colors.cardBackground,
    backgroundGradientTo:   theme.colors.cardBackground,
    decimalPlaces:           0,
    color:       (opacity = 1) => `rgba(${hexToRgb(COLORS.brand.primary)}, ${opacity})`,
    labelColor:  (opacity = 1) => {
      const rgb = theme.isDark ? '209, 213, 219' : '107, 114, 128';
      return `rgba(${rgb}, ${opacity})`;
    },
    style:        { borderRadius: 16 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.brand.primary },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke:          theme.colors.divider,
      strokeWidth:     1,
    },
  }), [theme]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    [],
  );

  // ── Guard (after all hooks) ───────────────────────────────────────────────
  if (loggedInUser?.role !== 'coach') {
    return <Redirect href="/(private)/settings" />;
  }

  // ── Status config ─────────────────────────────────────────────────────────
  const statusConfig: Record<ReceivedPaymentEntity['status'], { color: string; label: string }> = {
    completed: { color: theme.colors.success, label: 'Payé'       },
    pending:   { color: theme.colors.warning, label: 'En attente' },
    failed:    { color: theme.colors.danger,  label: 'Échoué'     },
    cancelled: { color: theme.colors.textSecondary, label: 'Annulé' },
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppScreenWrapper>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Chargement…</Text>
        </View>
      </AppScreenWrapper>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (errorMessage) {
    return (
      <AppScreenWrapper>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: theme.colors.danger, fontSize: 15, textAlign: 'center' }}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={reload}
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.brandPrimary, borderRadius: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </AppScreenWrapper>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppScreenWrapper noHorizontalPadding>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Stats grid ──────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={{ fontSize: 28 }}>💰</Text>
            <Text style={styles.statLabel}>Total des revenus</Text>
            <Text style={styles.statValue}>{totalEarnings.toFixed(2)} €</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={{ fontSize: 28 }}>📈</Text>
            <Text style={styles.statLabel}>Ce mois-ci</Text>
            <Text style={styles.statValue}>{thisMonthEarnings.toFixed(2)} €</Text>
          </View>
        </View>

        {/* ── Revenue chart ────────────────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={{ fontSize: 20 }}>📊</Text>
            <Text style={styles.chartCardTitle}>Évolution sur 12 mois</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 40, 340)}
              height={220}
              chartConfig={chartConfig}
              bezier
              fromZero
              segments={4}
              style={{ marginVertical: 4, borderRadius: 16 }}
            />
          </ScrollView>

          <View style={styles.chartLegendRow}>
            <View style={styles.chartLegendDot} />
            <Text style={styles.chartLegendLabel}>Revenus mensuels (€)</Text>
          </View>
        </View>

        {/* ── Recent transactions ──────────────────────────────────────────── */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsCardHeader}>
            <View style={styles.transactionsCardTitleRow}>
              <Text style={{ fontSize: 20 }}>📋</Text>
              <Text style={styles.transactionsCardTitle}>Transactions récentes</Text>
            </View>
            <View style={styles.transactionsBadge}>
              <Text style={styles.transactionsBadgeText}>{displayedTransactions.length}</Text>
            </View>
          </View>

          {displayedTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun paiement pour l'instant</Text>
            </View>
          ) : (
            displayedTransactions.map((tx) => {
              const config = statusConfig[tx.status];
              return (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionItemLeft}>
                    <Text style={styles.transactionItemName}>{tx.athleteName}</Text>
                    <Text style={styles.transactionItemDate}>
                      {dateFormatter.format(tx.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionItemRight}>
                    <Text style={styles.transactionItemAmount}>
                      +{tx.amountInEuros.toFixed(2)} €
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Info box ─────────────────────────────────────────────────────── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxIcon}>💡</Text>
          <View style={styles.infoBoxContent}>
            <Text style={styles.infoBoxTitle}>Virements automatiques</Text>
            <Text style={styles.infoBoxText}>
              Les paiements sont automatiquement virés sur ton compte bancaire tous les 7 jours.
              Assure-toi que ton IBAN est bien configuré dans "Compte bancaire".
            </Text>
          </View>
        </View>

      </ScrollView>
    </AppScreenWrapper>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

// Converts '#3B82F6' → '59, 130, 246' for rgba() in chart config
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
