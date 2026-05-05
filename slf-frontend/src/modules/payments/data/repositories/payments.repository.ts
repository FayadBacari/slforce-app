import type { SentPaymentEntity, CoachEarningsEntity, MonthlyRevenueEntity } from '../../domain/entities/payment.entity';
import type { BankAccountStatus } from '../../domain/entities/bank-account.entity';
import {
  callGetPaymentHistoryApiEndpoint,
  callGetCoachEarningsApiEndpoint,
  callGetMonthlyChartDataApiEndpoint,
  callGetBankAccountStatusApiEndpoint,
  callStartBankAccountOnboardingApiEndpoint,
  callGetBankAccountDashboardUrlApiEndpoint,
  callDisconnectBankAccountApiEndpoint,
  callInitiatePaymentApiEndpoint,
  callConfirmPaymentApiEndpoint,
} from '../data-sources/payments-api.data-source';

class PaymentsRepository {
  // ── Payment history (athlete) ──────────────────────────────────────────────
  async getPaymentHistory(): Promise<SentPaymentEntity[]> {
    return callGetPaymentHistoryApiEndpoint();
  }

  // ── Coach earnings (payment chart) ────────────────────────────────────────
  async getCoachEarnings(): Promise<CoachEarningsEntity> {
    return callGetCoachEarningsApiEndpoint();
  }

  async getMonthlyChartData(): Promise<MonthlyRevenueEntity[]> {
    return callGetMonthlyChartDataApiEndpoint();
  }

  // ── Stripe Connect bank account ────────────────────────────────────────────
  async getBankAccountStatus(): Promise<BankAccountStatus> {
    return callGetBankAccountStatusApiEndpoint();
  }

  async startBankAccountOnboarding(): Promise<string> {
    return callStartBankAccountOnboardingApiEndpoint();
  }

  async getBankAccountDashboardUrl(): Promise<string> {
    return callGetBankAccountDashboardUrlApiEndpoint();
  }

  async disconnectBankAccount(): Promise<void> {
    return callDisconnectBankAccountApiEndpoint();
  }

  // ── Stripe payment intent (athlete → coach) ───────────────────────────────
  // Creates a PaymentIntent on the backend and returns the clientSecret needed
  // by the Stripe mobile SDK to present the native payment sheet.
  async initiatePayment(params: {
    coachId:       string;
    amountInCents: number;
    description?:  string;
  }): Promise<{ clientSecret: string; publishableKey: string; paymentIntentId: string }> {
    return callInitiatePaymentApiEndpoint(params);
  }

  // Confirms a successful payment on the backend.
  // The backend re-retrieves the intent from Stripe and writes the record to MongoDB.
  async confirmPayment(paymentIntentId: string): Promise<void> {
    return callConfirmPaymentApiEndpoint(paymentIntentId);
  }
}

// Single shared instance — follows the same pattern as searchRepository
export const paymentsRepository = new PaymentsRepository();
