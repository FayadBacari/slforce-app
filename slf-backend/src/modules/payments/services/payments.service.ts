import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PaymentsRepository } from '../data/repositories/payments.repository';
import { StripeConnectService } from './stripe-connect.service';
import { UsersRepository } from '../../auth/data/repositories/users.repository';
import type {
  SentPaymentDto,
  ReceivedPaymentDto,
  MonthlySummaryDto,
  PaymentHistoryResponseDto,
  CoachPaymentsResponseDto,
  MonthlyChartResponseDto,
} from '../presentation/dto/payment-response.dto';
import type {
  BankAccountStatusResponseDto,
  OnboardingUrlResponseDto,
  DashboardUrlResponseDto,
} from '../presentation/dto/bank-account-response.dto';
import type { PaymentIntentResponseDto } from '../presentation/dto/payment-intent.dto';
import { ConfigService } from '@nestjs/config';

// Abbreviated French month labels for the chart X-axis
const FRENCH_MONTH_LABELS = [
  '', // index 0 unused (months are 1-based)
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository:   PaymentsRepository,
    private readonly stripeConnectService: StripeConnectService,
    private readonly usersRepository:      UsersRepository,
    private readonly configService:        ConfigService,
  ) {}

  // ─── GET /payments/sent (athlete) ──────────────────────────────────────────
  // Returns all payments sent by the current user, with the coach's name.
  async getPaymentsSentByCurrentUser(userId: string): Promise<PaymentHistoryResponseDto> {
    const paymentDocuments = await this.paymentsRepository.findPaymentsSentByUser(userId);

    const payments: SentPaymentDto[] = paymentDocuments.map((doc) => {
      // receiverId is populated by Mongoose — cast to the populated shape
      const coach = doc.receiverId as unknown as {
        _id: Types.ObjectId;
        firstName: string;
        lastName: string;
        profilePhotoUrl?: string;
      };

      return {
        id:            (doc._id as Types.ObjectId).toString(),
        coachName:     `${coach.firstName} ${coach.lastName}`,
        coachPhotoUrl: coach.profilePhotoUrl,
        amountInEuros: doc.amountInCents / 100,
        status:        doc.status,
        date:          (doc.createdAt as Date).toISOString(),
        description:   doc.description,
      };
    });

    return { payments };
  }

  // ─── GET /payments/received (coach) ────────────────────────────────────────
  // Returns all payments received by the current user, with the athlete's name,
  // plus total and current-month totals for the stats cards.
  async getPaymentsReceivedByCurrentUser(userId: string): Promise<CoachPaymentsResponseDto> {
    const paymentDocuments = await this.paymentsRepository.findPaymentsReceivedByUser(userId);

    const payments: ReceivedPaymentDto[] = paymentDocuments.map((doc) => {
      const athlete = doc.senderId as unknown as {
        _id: Types.ObjectId;
        firstName: string;
        lastName: string;
        profilePhotoUrl?: string;
      };

      return {
        id:               (doc._id as Types.ObjectId).toString(),
        athleteName:      `${athlete.firstName} ${athlete.lastName}`,
        athletePhotoUrl:  athlete.profilePhotoUrl,
        amountInEuros:    doc.amountInCents / 100,
        status:           doc.status,
        date:             (doc.createdAt as Date).toISOString(),
      };
    });

    // Compute totals on the server — avoids sending raw numbers to the client
    const completedPayments = payments.filter((p) => p.status === 'completed');
    const totalEarnings = completedPayments.reduce((sum, p) => sum + p.amountInEuros, 0);

    const now   = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    const thisMonth = completedPayments.reduce((sum, p) => {
      const d = new Date(p.date);
      return d.getMonth() === month && d.getFullYear() === year
        ? sum + p.amountInEuros
        : sum;
    }, 0);

    return { payments, totalEarnings, thisMonth };
  }

  // ─── GET /payments/summary/monthly (coach) ─────────────────────────────────
  // Returns the last 12 months of revenue as chart-ready data points.
  // Months with no payments are filled with 0 so the chart always shows 12 bars.
  async getMonthlyChartDataForCoach(coachId: string): Promise<MonthlyChartResponseDto> {
    const rawMonths = await this.paymentsRepository.getMonthlyRevenueForCoach(coachId);

    // Build a lookup map: 'YYYY-MM' → totalInCents
    const revenueByYearMonth = new Map<string, number>();
    for (const row of rawMonths) {
      revenueByYearMonth.set(`${row.year}-${row.month}`, row.totalInCents);
    }

    // Generate 12 consecutive months ending on the current month
    const months: MonthlySummaryDto[] = [];
    const today = new Date();

    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const year  = date.getFullYear();
      const month = date.getMonth() + 1; // 1-based for MongoDB compatibility

      const totalInCents = revenueByYearMonth.get(`${year}-${month}`) ?? 0;

      months.push({
        year,
        month,
        label:        FRENCH_MONTH_LABELS[month],
        totalInEuros: totalInCents / 100,
      });
    }

    return { months };
  }

  // ─── GET /payments/bank-account ────────────────────────────────────────────
  // Returns the Stripe Connect status for the coach.
  async getBankAccountStatus(coachId: string): Promise<BankAccountStatusResponseDto> {
    const coach = await this.usersRepository.findOneById(coachId);
    if (!coach) throw new NotFoundException('Coach introuvable.');

    if (!coach.stripeAccountId) {
      return { isConnected: false };
    }

    // Fetch live status from Stripe (chargesEnabled, payoutsEnabled, etc.)
    return this.stripeConnectService.getAccountStatus(coach.stripeAccountId);
  }

  // ─── POST /payments/bank-account/onboarding ────────────────────────────────
  // Creates a Stripe Express account (if needed) and returns the onboarding URL.
  async startBankAccountOnboarding(coachId: string): Promise<OnboardingUrlResponseDto> {
    const coach = await this.usersRepository.findOneById(coachId);
    if (!coach) throw new NotFoundException('Coach introuvable.');

    const { onboardingUrl, stripeAccountId } =
      await this.stripeConnectService.createOnboardingUrl({
        existingStripeAccountId: coach.stripeAccountId,
        coachEmail:              coach.email,
        coachFirstName:          coach.firstName,
        coachLastName:           coach.lastName,
      });

    // Persist the Stripe account ID (no-op if it was already saved)
    if (!coach.stripeAccountId) {
      await this.usersRepository.updateStripeAccountId(coachId, stripeAccountId);
    }

    return { onboardingUrl };
  }

  // ─── GET /payments/bank-account/dashboard ──────────────────────────────────
  // Returns a one-time Stripe Express dashboard login link.
  async getDashboardUrl(coachId: string): Promise<DashboardUrlResponseDto> {
    const coach = await this.usersRepository.findOneById(coachId);
    if (!coach?.stripeAccountId) {
      throw new NotFoundException('Aucun compte Stripe associé à ce coach.');
    }

    const dashboardUrl = await this.stripeConnectService.createDashboardLoginLink(
      coach.stripeAccountId,
    );
    return { dashboardUrl };
  }

  // ─── DELETE /payments/bank-account ─────────────────────────────────────────
  // Deletes the Stripe Express account and clears the reference in our DB.
  async disconnectBankAccount(coachId: string): Promise<void> {
    const coach = await this.usersRepository.findOneById(coachId);
    if (!coach?.stripeAccountId) return; // already disconnected — nothing to do

    await this.stripeConnectService.deleteExpressAccount(coach.stripeAccountId);
    await this.usersRepository.updateStripeAccountId(coachId, null);
  }

  // ─── POST /payments/intent (athlete) ───────────────────────────────────────
  //
  // Creates a Stripe PaymentIntent and returns its client_secret so the mobile
  // SDK can present the native payment sheet (Apple Pay / Google Pay / card).
  //
  // The charge is a "destination charge": the athlete is debited on our platform
  // and the funds are transferred directly to the coach's Stripe Express account.
  //
  // The publishableKey is echoed back so the mobile app never has to hard-code it.
  async initiatePayment(params: {
    athleteId:    string;
    coachId:      string;
    amountInCents: number;
    description?: string;
  }): Promise<PaymentIntentResponseDto> {
    // 1. Load the target coach and ensure they have a Stripe Connect account
    const coach = await this.usersRepository.findOneById(params.coachId);
    if (!coach) {
      throw new NotFoundException('Coach introuvable.');
    }
    if (!coach.stripeAccountId) {
      throw new BadRequestException(
        'Ce coach n\'a pas encore configuré son compte de paiement Stripe. ' +
        'Demandez-lui de compléter son inscription avant d\'effectuer un paiement.',
      );
    }

    // 2. Delegate to Stripe — creates a PaymentIntent with transfer_data
    const { clientSecret, paymentIntentId } =
      await this.stripeConnectService.createPaymentIntentForCoach({
        coachStripeAccountId:  coach.stripeAccountId,
        amountInCents:         params.amountInCents,
        currency:              'eur',
        applicationFeeInCents: 0,   // No platform fee for now — add later if needed
        athleteId:             params.athleteId,
        coachId:               params.coachId,
        description:           params.description,
      });

    // 3. Return the client secret, the intent ID (needed for confirmation), and
    //    the publishable key so the mobile app never has to hard-code it.
    const publishableKey = this.configService.getOrThrow<string>('STRIPE_PUBLISHABLE_KEY');

    return { clientSecret, publishableKey, paymentIntentId };
  }

  // ─── POST /payments/confirm (athlete) ──────────────────────────────────────
  //
  // Called by the mobile app after `presentPaymentSheet()` resolves without error.
  //
  // Security model:
  //   • We retrieve the PaymentIntent directly from Stripe — the frontend cannot
  //     forge a "succeeded" status.
  //   • We verify that `metadata.athleteId` matches the authenticated caller —
  //     prevents one athlete from confirming another athlete's payment.
  //   • The stripePaymentIntentId unique-sparse index makes this call idempotent —
  //     retrying after a network blip never creates duplicate records.
  async confirmPayment(params: {
    athleteId:       string;
    paymentIntentId: string;
  }): Promise<void> {
    // 1. Retrieve the live PaymentIntent from Stripe
    const paymentIntent =
      await this.stripeConnectService.retrievePaymentIntent(params.paymentIntentId);

    // 2. Gate: only accept succeeded intents
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        'Le paiement n\'a pas encore été confirmé par Stripe. Réessayez dans quelques secondes.',
      );
    }

    // 3. Gate: caller must be the athlete who initiated the intent
    if (paymentIntent.metadata?.athleteId !== params.athleteId) {
      throw new ForbiddenException('Ce paiement ne vous appartient pas.');
    }

    // 4. Idempotency check — skip silently if already recorded
    const existing = await this.paymentsRepository.findByStripePaymentIntentId(
      params.paymentIntentId,
    );
    if (existing) return;

    // 5. Persist the confirmed payment in our database
    await this.paymentsRepository.createPaymentRecord({
      senderId:              new Types.ObjectId(paymentIntent.metadata.athleteId),
      receiverId:            new Types.ObjectId(paymentIntent.metadata.coachId),
      amountInCents:         paymentIntent.amount,
      status:                'completed',
      description:           paymentIntent.metadata?.description || undefined,
      stripePaymentIntentId: params.paymentIntentId,
    });
  }
}
