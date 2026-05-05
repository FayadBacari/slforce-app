// ─── GET /payments/bank-account ──────────────────────────────────────────────

export type BankAccountStatusResponseDto =
  | { isConnected: false }
  | {
      isConnected:     true;
      stripeAccountId: string;
      chargesEnabled:  boolean;
      payoutsEnabled:  boolean;
      // true when the coach started onboarding but hasn't finished it yet
      requiresAction:  boolean;
      email:           string | null;
      country:         string | null;
    };

// ─── POST /payments/bank-account/onboarding ──────────────────────────────────

export interface OnboardingUrlResponseDto {
  onboardingUrl: string;
}

// ─── GET /payments/bank-account/dashboard ────────────────────────────────────

export interface DashboardUrlResponseDto {
  dashboardUrl: string;
}
