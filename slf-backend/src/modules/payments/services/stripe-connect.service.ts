import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

// ─── Shape returned by getAccountStatus() ────────────────────────────────────
export interface StripeAccountStatus {
  isConnected:     boolean;
  stripeAccountId: string;
  chargesEnabled:  boolean;
  payoutsEnabled:  boolean;
  requiresAction:  boolean;   // true when onboarding is started but incomplete
  email:           string | null;
  country:         string | null;
}

type StripeInstance = InstanceType<typeof Stripe>;

// Derived from the SDK so the type is always correct regardless of Stripe version.
// Using Stripe.PaymentIntent directly triggers TS2694 on stripe@22 because the CJS
// `export = Stripe` pattern makes the namespace unavailable through the default import.
type StripePaymentIntent = Awaited<ReturnType<StripeInstance['paymentIntents']['retrieve']>>;

@Injectable()
export class StripeConnectService {
  private readonly stripe: StripeInstance;

  // The two backend routes Stripe will redirect to after the onboarding flow.
  // These serve HTML pages that immediately redirect to the slforce:// deep link
  // (Stripe only accepts HTTP/HTTPS — custom schemes are rejected as "Not a valid URL").
  private readonly stripeReturnUrl:  string;
  private readonly stripeRefreshUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey);

    // Use the typed config namespace so values are always resolved through the
    // same Joi-validated layer — no raw process.env bypasses.
    const appUrl    = this.configService.getOrThrow<string>('app.appUrl');
    const apiPrefix = this.configService.getOrThrow<string>('app.apiPrefix');

    this.stripeReturnUrl  = `${appUrl}/${apiPrefix}/payments/stripe/return`;
    this.stripeRefreshUrl = `${appUrl}/${apiPrefix}/payments/stripe/refresh`;
  }

  // ─── Create or resume the onboarding flow ──────────────────────────────────
  //
  // If the coach has no Stripe account yet, we create one (Express type).
  // Then we always generate a fresh Account Link — links expire after a few
  // minutes so we never cache them.
  //
  // Returns the URL to open in the system browser.
  async createOnboardingUrl(params: {
    existingStripeAccountId?: string;
    coachEmail:               string;
    coachFirstName:           string;
    coachLastName:            string;
  }): Promise<{ onboardingUrl: string; stripeAccountId: string }> {
    let accountId = params.existingStripeAccountId;

    // Create a new Express account if the coach doesn't have one yet
    if (!accountId) {
      const account = await this.stripe.accounts.create({
        type:    'express',
        country: 'FR',
        email:   params.coachEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        business_profile: {
          mcc:                 '7941',  // Sports clubs & fields
          product_description: 'Street Lifting coaching services',
        },
        business_type: 'individual',
        individual: {
          first_name: params.coachFirstName,
          last_name:  params.coachLastName,
          email:      params.coachEmail,
        },
      });
      accountId = account.id;
    }

    // Create a fresh one-time onboarding link (expires in ~5 min)
    const accountLink = await this.stripe.accountLinks.create({
      account:     accountId,
      type:        'account_onboarding',
      return_url:  this.stripeReturnUrl,
      refresh_url: this.stripeRefreshUrl,
    });

    // accountId is guaranteed to be set at this point (either from params or freshly created)
    return { onboardingUrl: accountLink.url, stripeAccountId: accountId as string };
  }

  // ─── Retrieve live account status from Stripe ─────────────────────────────
  async getAccountStatus(stripeAccountId: string): Promise<StripeAccountStatus> {
    const account = await this.stripe.accounts.retrieve(stripeAccountId);

    const requiresAction =
      account.charges_enabled !== true || account.payouts_enabled !== true;

    return {
      isConnected:     true,
      stripeAccountId: account.id,
      chargesEnabled:  account.charges_enabled  === true,
      payoutsEnabled:  account.payouts_enabled   === true,
      requiresAction,
      email:           account.email   ?? null,
      country:         account.country ?? null,
    };
  }

  // ─── Express dashboard link ───────────────────────────────────────────────
  // Gives the coach direct access to their Stripe Express dashboard (payouts,
  // transaction history, bank account management).
  async createDashboardLoginLink(stripeAccountId: string): Promise<string> {
    const loginLink = await this.stripe.accounts.createLoginLink(stripeAccountId);
    return loginLink.url;
  }

  // ─── Create a Payment Intent that routes funds to the coach ─────────────────
  //
  // Uses Stripe Connect's "destination charge" pattern:
  //   • The charge appears on the athlete's card statement as "SLForce"
  //   • Funds are automatically transferred to the coach's Express account
  //   • A platform fee can be deducted before the transfer (0 for now)
  //
  // Returns the client_secret — the mobile SDK needs this to present the
  // payment sheet and confirm the payment without exposing the secret key.
  async createPaymentIntentForCoach(params: {
    coachStripeAccountId:  string;
    amountInCents:         number;
    currency:              string;
    applicationFeeInCents: number;
    athleteId:             string;
    coachId:               string;
    description?:          string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount:                 params.amountInCents,
      currency:               params.currency,
      application_fee_amount: params.applicationFeeInCents,
      transfer_data: {
        destination: params.coachStripeAccountId,
      },
      // automatic_payment_methods enables Apple Pay, Google Pay, cards, etc.
      // without having to enumerate payment methods one by one.
      automatic_payment_methods: { enabled: true },
      metadata: {
        athleteId:   params.athleteId,
        coachId:     params.coachId,
        description: params.description ?? '',
      },
    });

    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException('Stripe n\'a pas retourné de client_secret.');
    }

    return {
      clientSecret:     paymentIntent.client_secret,
      paymentIntentId:  paymentIntent.id,
    };
  }

  // ─── Retrieve a PaymentIntent (for server-side verification) ─────────────
  // Called by the confirm endpoint to check that `status === 'succeeded'`
  // before recording the payment in our database.
  async retrievePaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // ─── Disconnect / delete the Express account ─────────────────────────────
  // Deletes the Stripe Express account entirely.
  // The coach will need to re-onboard to receive payments again.
  async deleteExpressAccount(stripeAccountId: string): Promise<void> {
    try {
      await this.stripe.accounts.del(stripeAccountId);
    } catch (error: unknown) {
      // If the account is already deleted or not found on Stripe, still
      // clear the reference from our DB — don't block the user.
      const stripeError = error as { code?: string };
      if (stripeError.code !== 'resource_missing') {
        throw new InternalServerErrorException('Impossible de déconnecter le compte Stripe.');
      }
    }
  }
}
