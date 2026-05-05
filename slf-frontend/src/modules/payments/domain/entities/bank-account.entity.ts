// The Stripe Connect account status for a coach.
// Mirrors the backend's BankAccountStatusResponseDto.

export type BankAccountStatus =
  | { isConnected: false }
  | {
      isConnected:     true;
      stripeAccountId: string;
      chargesEnabled:  boolean;
      payoutsEnabled:  boolean;
      // true when the coach opened Stripe onboarding but didn't complete it
      requiresAction:  boolean;
      email:           string | null;
      country:         string | null;
    };
