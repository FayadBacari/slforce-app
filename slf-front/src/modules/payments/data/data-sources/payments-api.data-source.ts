import { apiClient } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import type {
  SentPaymentEntity,
  ReceivedPaymentEntity,
  MonthlyRevenueEntity,
  CoachEarningsEntity,
} from '../../domain/entities/payment.entity';
import type { BankAccountStatus } from '../../domain/entities/bank-account.entity';

// ─── Raw API shapes (backend DTOs at the wire level) ──────────────────────────

interface SentPaymentRaw {
  id:             string;
  coachName:      string;
  coachPhotoUrl?: string;
  amountInEuros:  number;
  status:         SentPaymentEntity['status'];
  date:           string;   // ISO string — we convert to Date in the repository
  description?:   string;
}

interface ReceivedPaymentRaw {
  id:               string;
  athleteName:      string;
  athletePhotoUrl?: string;
  amountInEuros:    number;
  status:           ReceivedPaymentEntity['status'];
  date:             string;
}

interface MonthlySummaryRaw {
  year:         number;
  month:        number;
  label:        string;
  totalInEuros: number;
}

interface PaymentHistoryResponseRaw  { payments: SentPaymentRaw[] }
interface CoachPaymentsResponseRaw   { payments: ReceivedPaymentRaw[]; totalEarnings: number; thisMonth: number }
interface MonthlyChartResponseRaw    { months:   MonthlySummaryRaw[] }

// ─── GET /payments/sent ───────────────────────────────────────────────────────
// Returns the athlete's full payment history (money sent to coaches).

export async function callGetPaymentHistoryApiEndpoint(): Promise<SentPaymentEntity[]> {
  const response = await apiClient.get<BackendSuccessEnvelope<PaymentHistoryResponseRaw>>(
    API_ENDPOINTS.payments.getAllPaymentsSentByCurrentUser,
  );
  const { payments } = unwrapBackendEnvelope(response);
  // Convert ISO date strings → Date objects
  return payments.map((p) => ({ ...p, date: new Date(p.date) }));
}

// ─── GET /payments/received ───────────────────────────────────────────────────
// Returns the coach's earnings: transaction list + totalEarnings + thisMonth.

export async function callGetCoachEarningsApiEndpoint(): Promise<CoachEarningsEntity> {
  const response = await apiClient.get<BackendSuccessEnvelope<CoachPaymentsResponseRaw>>(
    API_ENDPOINTS.payments.getAllPaymentsReceivedByCurrentUser,
  );
  const raw = unwrapBackendEnvelope(response);
  return {
    totalEarnings: raw.totalEarnings,
    thisMonth:     raw.thisMonth,
    payments:      raw.payments.map((p) => ({ ...p, date: new Date(p.date) })),
  };
}

// ─── GET /payments/summary/monthly ───────────────────────────────────────────
// Returns 12 months of revenue data for the LineChart.

export async function callGetMonthlyChartDataApiEndpoint(): Promise<MonthlyRevenueEntity[]> {
  const response = await apiClient.get<BackendSuccessEnvelope<MonthlyChartResponseRaw>>(
    API_ENDPOINTS.payments.getMonthlyPaymentSummary,
  );
  const { months } = unwrapBackendEnvelope(response);
  return months;
}

// ─── GET /payments/bank-account ───────────────────────────────────────────────
// Returns the Stripe Connect account status for the current coach.

export async function callGetBankAccountStatusApiEndpoint(): Promise<BankAccountStatus> {
  const response = await apiClient.get<BackendSuccessEnvelope<BankAccountStatus>>(
    API_ENDPOINTS.payments.getCoachBankAccountDetails,
  );
  return unwrapBackendEnvelope(response);
}

// ─── POST /payments/bank-account/onboarding ──────────────────────────────────
// Creates a Stripe Express account (if needed) and returns the onboarding URL.

export async function callStartBankAccountOnboardingApiEndpoint(): Promise<string> {
  const response = await apiClient.post<BackendSuccessEnvelope<{ onboardingUrl: string }>>(
    `${API_ENDPOINTS.payments.saveCoachBankAccountDetails}/onboarding`,
  );
  return unwrapBackendEnvelope(response).onboardingUrl;
}

// ─── GET /payments/bank-account/dashboard ────────────────────────────────────
// Returns a one-time Stripe Express dashboard URL.

export async function callGetBankAccountDashboardUrlApiEndpoint(): Promise<string> {
  const response = await apiClient.get<BackendSuccessEnvelope<{ dashboardUrl: string }>>(
    `${API_ENDPOINTS.payments.getCoachBankAccountDetails}/dashboard`,
  );
  return unwrapBackendEnvelope(response).dashboardUrl;
}

// ─── DELETE /payments/bank-account ────────────────────────────────────────────
// Disconnects (deletes) the Stripe Express account.

export async function callDisconnectBankAccountApiEndpoint(): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.payments.getCoachBankAccountDetails);
}

// ─── POST /payments/intent ────────────────────────────────────────────────────
// Creates a Stripe PaymentIntent so the mobile app can present the native
// payment sheet (Apple Pay / Google Pay / card). Athletes only.
// Returns `clientSecret` (for the SDK) and `publishableKey` (for StripeProvider).

interface InitiatePaymentParams {
  coachId:       string;
  amountInCents: number;
  description?:  string;
}

interface PaymentIntentRaw {
  clientSecret:    string;
  publishableKey:  string;
  paymentIntentId: string;
}

export async function callInitiatePaymentApiEndpoint(
  params: InitiatePaymentParams,
): Promise<PaymentIntentRaw> {
  const response = await apiClient.post<BackendSuccessEnvelope<PaymentIntentRaw>>(
    API_ENDPOINTS.payments.createPaymentIntent,
    params,
  );
  return unwrapBackendEnvelope(response);
}

// ─── POST /payments/confirm ───────────────────────────────────────────────────
// Sent after presentPaymentSheet() resolves without error.
// The server re-retrieves the PaymentIntent from Stripe to verify status
// before writing the record to MongoDB.

export async function callConfirmPaymentApiEndpoint(
  paymentIntentId: string,
): Promise<void> {
  await apiClient.post<BackendSuccessEnvelope<void>>(
    API_ENDPOINTS.payments.confirmPayment,
    { paymentIntentId },
  );
}
