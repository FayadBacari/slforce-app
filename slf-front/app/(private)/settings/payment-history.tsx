import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { COLORS } from '@shared/design-system';
import { formatAmountInEuros } from '@shared/utils/format-currency.util';
import { formatFullDateInFrench as formatDate } from '@shared/utils/format-date.util';
import { usePaymentHistory } from '@modules/payments/presentation/hooks/use-payment-history.hook';
import { buildPaymentHistoryStyles } from '@screen-styles/settings/payment-history.styles';
import type { SentPaymentEntity } from '@modules/payments/domain/entities/payment.entity';

export default function PaymentHistoryPage() {
  const { theme } = useTheme();
  const styles    = buildPaymentHistoryStyles(theme);

  const {
    displayedPayments,
    totalSpent,
    thisMonthSpent,
    isLoading,
    errorMessage,
    reload,
  } = usePaymentHistory();

  const statusColor: Record<SentPaymentEntity['status'], string> = {
    completed: COLORS.semantic.success,
    pending:   COLORS.semantic.warning,
    failed:    COLORS.semantic.danger,
    cancelled: theme.colors.textSecondary,
  };

  const statusLabel: Record<SentPaymentEntity['status'], string> = {
    completed: 'Payé',
    pending:   'En attente',
    failed:    'Échoué',
    cancelled: 'Annulé',
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
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

  // ── Error ───────────────────────────────────────────────────────────────────
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

  return (
    <AppScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Stats cards ──────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.brandPrimary + '18' }]}>
            <Text style={{ fontSize: 28 }}>💳</Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
            <Text style={styles.statValue}>{formatAmountInEuros(totalSpent)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.semantic.warning + '18' }]}>
            <Text style={{ fontSize: 28 }}>📅</Text>
            <Text style={styles.statLabel}>Ce mois-ci</Text>
            <Text style={styles.statValue}>{formatAmountInEuros(thisMonthSpent)}</Text>
          </View>
        </View>

        {/* ── Payment list ─────────────────────────────────────────────────── */}
        {displayedPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucun paiement pour l'instant</Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {displayedPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentCardLeft}>
                  <Text style={styles.paymentPartyName}>{payment.coachName}</Text>
                  {payment.description ? (
                    <Text style={styles.paymentDescription} numberOfLines={1}>
                      {payment.description}
                    </Text>
                  ) : null}
                  <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                </View>
                <View style={styles.paymentCardRight}>
                  <Text style={styles.paymentAmount}>
                    - {formatAmountInEuros(payment.amountInEuros)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor[payment.status] + '22' }]}>
                    <Text style={[styles.statusLabel, { color: statusColor[payment.status] }]}>
                      {statusLabel[payment.status]}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </AppScreenWrapper>
  );
}
