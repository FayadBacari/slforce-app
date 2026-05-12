import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  PaymentsRepository,
  type PaymentLean,
  type PopulatedUserSummary,
} from '../data/repositories/payments.repository';
import { StripeConnectService, type StripeWebhookEvent } from './stripe-connect.service';
import { StripeEventsRepository } from '../data/repositories/stripe-events.repository';
import { UsersRepository } from '@modules/users/data/repositories/users.repository';
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
import type {
  PaymentIntentResponseDto,
  ConfirmPaymentResponseDto,
} from '../presentation/dto/payment-intent.dto';
import { ConfigService } from '@nestjs/config';

// Abbreviated French month labels for the chart X-axis
const FRENCH_MONTH_LABELS = [
  '', // index 0 unused (months are 1-based)
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

// Helper de typage : narrow d'un champ populé sur PaymentLean.
// `senderId` / `receiverId` sont `Types.ObjectId | PopulatedUserSummary` — selon
// que la query a fait un `.populate()`. Quand on sait qu'on a populated, ce
// helper donne accès aux champs user de façon type-safe.
function asPopulatedUser(
  field: Types.ObjectId | PopulatedUserSummary,
): PopulatedUserSummary {
  // Si le populate a échoué silencieusement (user supprimé puis populated),
  // on a juste l'ObjectId. On renvoie un placeholder anonymisé plutôt que de
  // throw — le paiement reste affiché mais signalé comme "compte supprimé".
  if (field instanceof Types.ObjectId) {
    return {
      _id:       field,
      firstName: 'Compte',
      lastName:  'Supprimé',
    };
  }
  return field;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository:    PaymentsRepository,
    private readonly stripeConnectService:  StripeConnectService,
    private readonly stripeEventsRepository: StripeEventsRepository,
    private readonly usersRepository:       UsersRepository,
    private readonly configService:         ConfigService,
  ) {}

  // ─── GET /payments/sent (athlete) ──────────────────────────────────────────
  // Returns all payments sent by the current user, with the coach's name.
  async getPaymentsSentByCurrentUser(userId: string): Promise<PaymentHistoryResponseDto> {
    const leanPayments = await this.paymentsRepository.findPaymentsSentByUser(userId);

    const payments: SentPaymentDto[] = leanPayments.map((doc) => {
      const coach = asPopulatedUser(doc.receiverId);
      return {
        id:            doc._id.toString(),
        coachName:     `${coach.firstName} ${coach.lastName}`,
        coachPhotoUrl: coach.profilePhotoUrl,
        amountInEuros: doc.amountInCents / 100,
        status:        doc.status,
        date:          doc.createdAt.toISOString(),
        description:   doc.description,
      };
    });

    return { payments };
  }

  // ─── GET /payments/received (coach) ────────────────────────────────────────
  //
  // Renvoie la liste des paiements reçus + totaux pour les cards de stats.
  //
  // Optimisation : les totaux sont calculés via une AGGREGATION Mongo
  // (`paymentsRepository.getReceivedTotalsForCoach`) plutôt qu'en chargeant
  // tous les paiements en RAM puis en faisant `.reduce()` côté Node. Pour un
  // coach actif avec 5k paiements/mois, c'est la différence entre 5k docs
  // chargés (~5 MB) et 2 nombres renvoyés (~24 octets).
  async getPaymentsReceivedByCurrentUser(userId: string): Promise<CoachPaymentsResponseDto> {
    // 1. Charge en parallèle la liste pour l'affichage ET les totaux agrégés
    const [leanPayments, totalsInCents] = await Promise.all([
      this.paymentsRepository.findPaymentsReceivedByUser(userId),
      this.paymentsRepository.getReceivedTotalsForCoach(userId),
    ]);

    // 2. Projette les paiements vers le DTO HTTP
    const payments: ReceivedPaymentDto[] = leanPayments.map((doc) => {
      const athlete = asPopulatedUser(doc.senderId);
      return {
        id:               doc._id.toString(),
        athleteName:      `${athlete.firstName} ${athlete.lastName}`,
        athletePhotoUrl:  athlete.profilePhotoUrl,
        amountInEuros:    doc.amountInCents / 100,
        status:           doc.status,
        date:             doc.createdAt.toISOString(),
      };
    });

    return {
      payments,
      totalEarnings: totalsInCents.totalEarningsInCents / 100,
      thisMonth:     totalsInCents.thisMonthInCents     / 100,
    };
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
  // Appelé par le mobile après `presentPaymentSheet()` résolu sans erreur.
  //
  // Modèle de sécurité :
  //   • Le PaymentIntent est récupéré directement depuis Stripe — le client ne
  //     peut pas forger un statut "succeeded".
  //   • On vérifie que `metadata.athleteId` correspond au caller authentifié —
  //     un athlète ne peut pas confirmer le paiement d'un autre.
  //   • L'index unique-sparse sur stripePaymentIntentId rend l'opération
  //     idempotente — retenter après un network blip ne crée pas de doublon.
  //
  // Cette route reste utile MÊME avec le webhook : c'est le chemin "happy path"
  // qui confirme le paiement instantanément côté UI mobile, sans attendre
  // l'événement async de Stripe.
  async confirmPayment(params: {
    athleteId:       string;
    paymentIntentId: string;
  }): Promise<ConfirmPaymentResponseDto> {
    // 1. Retrieve the live PaymentIntent from Stripe (source of truth)
    const paymentIntent =
      await this.stripeConnectService.retrievePaymentIntent(params.paymentIntentId);

    // 2. Gate : seul un intent "succeeded" est acceptable
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        'Le paiement n\'a pas encore été confirmé par Stripe. Réessayez dans quelques secondes.',
      );
    }

    // 3. Gate : le caller doit être l'athlète qui a initié l'intent
    if (paymentIntent.metadata?.athleteId !== params.athleteId) {
      throw new ForbiddenException('Ce paiement ne vous appartient pas.');
    }

    // 4. Persistance idempotente (logique partagée avec le webhook)
    const { paymentId, wasNewlyRecorded } =
      await this.persistSucceededPaymentIfNew(paymentIntent);

    // 5. Si on n'a rien créé (webhook arrivé avant), on lookup l'ID existant
    //    pour quand même renvoyer une valeur au mobile.
    if (!paymentId) {
      const existing = await this.paymentsRepository.findByStripePaymentIntentId(
        paymentIntent.id,
      );
      // Garde-fou : l'upsert s'est forcément exécuté juste au-dessus, donc
      // `existing` ne peut pas être null sauf bug — on throw plutôt que de
      // renvoyer une réponse menteuse.
      if (!existing) {
        throw new BadRequestException(
          'Paiement introuvable après upsert — anomalie, contacte le support.',
        );
      }
      return {
        paymentId:        existing._id.toString(),
        wasNewlyRecorded: false,
      };
    }

    return { paymentId, wasNewlyRecorded };
  }

  // ─── POST /payments/webhook (Stripe → backend) ─────────────────────────────
  //
  // Sert de filet de sécurité quand le mobile crashe entre presentPaymentSheet()
  // et POST /payments/confirm — sans webhook, le coach aurait l'argent mais
  // l'app ne verrait jamais le paiement en DB.
  //
  // DOUBLE COUCHE D'IDEMPOTENCE :
  //   1. Au niveau EVENT : `stripeEventsRepository.markEventAsProcessedIfNew()`
  //      garantit qu'un event Stripe répété (retry après timeout réseau) ne
  //      sera traité qu'une seule fois. Indispensable dès qu'on ajoute d'autres
  //      handlers que `payment_intent.succeeded` (refund, dispute...).
  //   2. Au niveau PAYMENT : `upsertPaymentByStripePaymentIntentId` exploite
  //      l'index unique sur `stripePaymentIntentId` pour résoudre les races
  //      entre webhook et /confirm s'ils arrivent à la même milliseconde.
  //
  // Le retour 200 est CRUCIAL — sans 2xx, Stripe retentera l'envoi avec
  // backoff jusqu'à 3 jours.
  async handleStripeWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    // Couche 1 — idempotence au niveau event Stripe (event.id PK unique).
    const { wasAlreadyProcessed } =
      await this.stripeEventsRepository.markEventAsProcessedIfNew({
        eventId:   event.id,
        eventType: event.type,
      });

    if (wasAlreadyProcessed) {
      this.logger.debug(`Stripe webhook ${event.type} (${event.id}) déjà traité — skip.`);
      return;
    }

    this.logger.log(`Stripe webhook reçu : ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        // event.data.object est typé `Stripe.PaymentIntent` — même shape que
        // la valeur retournée par paymentIntents.retrieve(), donc le helper
        // de persistance ci-dessous fonctionne tel quel.
        const paymentIntent = event.data.object as Parameters<
          typeof this.persistSucceededPaymentIfNew
        >[0];
        await this.persistSucceededPaymentIfNew(paymentIntent);
        return;
      }

      // Les autres event types sont reçus mais ignorés volontairement —
      // les ajouter ici à mesure des besoins (refund, dispute, etc.).
      default:
        this.logger.debug(`Webhook event type ignoré : ${event.type}`);
        return;
    }
  }

  // ─── Helper privé — persistance idempotente d'un paiement réussi ───────────
  //
  // Source unique de vérité pour transformer un PaymentIntent Stripe en
  // document Payment en DB. Appelée à la fois par /payments/confirm (chemin
  // synchrone côté client) et par le webhook (filet de sécurité asynchrone).
  //
  // L'upsert atomique élimine la race condition find→check→create qui
  // existait avant : deux callers concurrents qui arrivent simultanément
  // produisent une seule insertion (le second voit `wasInserted=false`).
  //
  // Retourne :
  //   • `paymentId` — l'ObjectId du document Payment si on l'a inséré dans
  //     cet appel (null si déjà existant — caller doit lookup pour le récupérer)
  //   • `wasNewlyRecorded` — true si cet appel a effectivement inséré
  private async persistSucceededPaymentIfNew(paymentIntent: {
    id:        string;
    amount:    number;
    metadata?: { athleteId?: string; coachId?: string; description?: string };
  }): Promise<{ paymentId: string | null; wasNewlyRecorded: boolean }> {
    // Garde-fou : metadata.athleteId/coachId sont écrits par
    // createPaymentIntentForCoach — toujours présents en théorie.
    if (!paymentIntent.metadata?.athleteId || !paymentIntent.metadata?.coachId) {
      this.logger.warn(
        `PaymentIntent ${paymentIntent.id} sans metadata athleteId/coachId — skip.`,
      );
      return { paymentId: null, wasNewlyRecorded: false };
    }

    const { wasInserted, insertedId } =
      await this.paymentsRepository.upsertPaymentByStripePaymentIntentId({
        senderId:              new Types.ObjectId(paymentIntent.metadata.athleteId),
        receiverId:            new Types.ObjectId(paymentIntent.metadata.coachId),
        amountInCents:         paymentIntent.amount,
        status:                'completed',
        description:           paymentIntent.metadata.description || undefined,
        stripePaymentIntentId: paymentIntent.id,
      });

    if (wasInserted) {
      this.logger.log(
        `Payment ${paymentIntent.id} persisted (amount: ${paymentIntent.amount}c)`,
      );
    }

    return {
      paymentId:        insertedId ?? null,
      wasNewlyRecorded: wasInserted,
    };
  }
}
