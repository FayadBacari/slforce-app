import { apiClient, withIdempotencyKey } from '@core/api/api-client';
import { API_ENDPOINTS } from '@core/api/api-endpoints';
import { unwrapBackendEnvelope, type BackendSuccessEnvelope } from '@core/api/api-response-envelope';
import type {
  SentPaymentEntity,
  ReceivedPaymentEntity,
  MonthlyRevenueEntity,
  CoachEarningsEntity,
} from '../../domain/entities/payment.entity';
import type { BankAccountStatus } from '../../domain/entities/bank-account.entity';

// ─── Wire-shapes (DTOs backend au niveau HTTP) ───────────────────────────────
// Mirror des DTOs côté backend (`payment-response.dto.ts`, etc.). Tant qu'on
// n'a pas un package partagé, on duplique ici à la main avec discipline.

interface SentPaymentRaw {
  id:             string;
  coachName:      string;
  coachPhotoUrl?: string;
  amountInEuros:  number;
  status:         SentPaymentEntity['status'];
  date:           string;   // ISO string — converti en Date dans le mapper
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
// Retourne l'historique de paiements envoyés par l'athlète courant.

export async function callGetPaymentHistoryApiEndpoint(): Promise<SentPaymentEntity[]> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<PaymentHistoryResponseRaw>>(
    API_ENDPOINTS.payments.getAllPaymentsSentByCurrentUser,
  );
  const { payments } = unwrapBackendEnvelope(httpResponse);
  return payments.map((p) => ({ ...p, date: new Date(p.date) }));
}

// ─── GET /payments/received ───────────────────────────────────────────────────
// Renvoie la liste + totaux (totalEarnings, thisMonth) pour le dashboard coach.

export async function callGetCoachEarningsApiEndpoint(): Promise<CoachEarningsEntity> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<CoachPaymentsResponseRaw>>(
    API_ENDPOINTS.payments.getAllPaymentsReceivedByCurrentUser,
  );
  const raw = unwrapBackendEnvelope(httpResponse);
  return {
    totalEarnings: raw.totalEarnings,
    thisMonth:     raw.thisMonth,
    payments:      raw.payments.map((p) => ({ ...p, date: new Date(p.date) })),
  };
}

// ─── GET /payments/summary/monthly ───────────────────────────────────────────
// 12 mois de revenus pour le LineChart coach.

export async function callGetMonthlyChartDataApiEndpoint(): Promise<MonthlyRevenueEntity[]> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<MonthlyChartResponseRaw>>(
    API_ENDPOINTS.payments.getMonthlyPaymentSummary,
  );
  const { months } = unwrapBackendEnvelope(httpResponse);
  return months;
}

// ─── GET /payments/bank-account ───────────────────────────────────────────────
// Statut Stripe Connect du coach courant.

export async function callGetBankAccountStatusApiEndpoint(): Promise<BankAccountStatus> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<BankAccountStatus>>(
    API_ENDPOINTS.payments.bankAccount,
  );
  return unwrapBackendEnvelope(httpResponse);
}

// ─── POST /payments/bank-account/onboarding ──────────────────────────────────
// Crée un compte Stripe Express si nécessaire et renvoie l'URL d'onboarding.

export async function callStartBankAccountOnboardingApiEndpoint(): Promise<string> {
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<{ onboardingUrl: string }>>(
    API_ENDPOINTS.payments.bankAccountOnboarding,
  );
  return unwrapBackendEnvelope(httpResponse).onboardingUrl;
}

// ─── GET /payments/bank-account/dashboard ────────────────────────────────────
// Renvoie une URL one-shot vers le dashboard Stripe Express du coach.

export async function callGetBankAccountDashboardUrlApiEndpoint(): Promise<string> {
  const httpResponse = await apiClient.get<BackendSuccessEnvelope<{ dashboardUrl: string }>>(
    API_ENDPOINTS.payments.bankAccountDashboard,
  );
  return unwrapBackendEnvelope(httpResponse).dashboardUrl;
}

// ─── DELETE /payments/bank-account ────────────────────────────────────────────
// Déconnecte (supprime) le compte Stripe Express du coach.

export async function callDisconnectBankAccountApiEndpoint(): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.payments.bankAccount);
}

// ─── POST /payments/intent ────────────────────────────────────────────────────
// Crée un Stripe PaymentIntent. Retourne le client_secret pour le SDK mobile
// + publishableKey + paymentIntentId. Athletes only.

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
  // Créer un intent est une opération avec side-effect (création d'objet
  // Stripe). Un double-tap mobile génèrerait 2 intents — chacun chargeable
  // par le SDK même si un seul est confirmé. Avec Idempotency-Key, le
  // backend pourra dédoublonner quand le middleware sera en place.
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<PaymentIntentRaw>>(
    API_ENDPOINTS.payments.createPaymentIntent,
    params,
    withIdempotencyKey(),
  );
  return unwrapBackendEnvelope(httpResponse);
}

// ─── POST /payments/confirm ───────────────────────────────────────────────────
// Envoyé après que presentPaymentSheet() résolve sans erreur.
// Le serveur re-récupère le PaymentIntent depuis Stripe pour vérifier
// `status === 'succeeded'` avant de persister l'enregistrement.

// Shape du retour confirm — aligné sur `ConfirmPaymentResponseDto` côté back.
export interface ConfirmPaymentResult {
  // ObjectId Mongo du document Payment — exposable côté UI pour navigation.
  paymentId:        string;
  // false si le webhook avait déjà persisté le paiement avant /confirm.
  wasNewlyRecorded: boolean;
}

export async function callConfirmPaymentApiEndpoint(
  paymentIntentId: string,
): Promise<ConfirmPaymentResult> {
  // Idempotency-Key : double-tap "Confirmer" → une seule persist DB côté back.
  const httpResponse = await apiClient.post<BackendSuccessEnvelope<ConfirmPaymentResult>>(
    API_ENDPOINTS.payments.confirmPayment,
    { paymentIntentId },
    withIdempotencyKey(),
  );
  return unwrapBackendEnvelope(httpResponse);
}
