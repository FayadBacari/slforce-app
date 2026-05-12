import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, type PaymentDocument, type PaymentStatus } from '../schemas/payment.schema';

// ─── PaymentLean / PopulatedUserSummary ──────────────────────────────────────
//
// Un document Mongoose renvoyé par `.lean()` n'est PAS un Document : il perd
// les méthodes (`save()`, virtuals, getters). Le caster en `PaymentDocument`
// était techniquement faux et masquait des bugs (méthodes Mongoose appelées
// sur un POJO).
//
// Ces types décrivent exactement la shape obtenue après `.lean() + populate()`.

// User minimal renvoyé par populate('senderId'|'receiverId', 'firstName lastName profilePhotoUrl').
export interface PopulatedUserSummary {
  _id:              Types.ObjectId;
  firstName:        string;
  lastName:         string;
  profilePhotoUrl?: string;
}

// Payment "lean" — fields seulement, sans méthodes Mongoose.
// Note : senderId et receiverId sont des `Types.ObjectId` quand non-populated,
// et `PopulatedUserSummary` quand populated. On exprime cette dualité avec
// un union pour conserver le contrat de type honnête.
export interface PaymentLean {
  _id:                   Types.ObjectId;
  senderId:              Types.ObjectId | PopulatedUserSummary;
  receiverId:            Types.ObjectId | PopulatedUserSummary;
  amountInCents:         number;
  status:                PaymentStatus;
  description?:          string;
  stripePaymentIntentId?: string;
  createdAt:             Date;
  updatedAt:             Date;
}

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  // Returns all payments sent by a given user (athlete perspective).
  // Populates receiverId so we can display the coach's name.
  async findPaymentsSentByUser(userId: string): Promise<PaymentLean[]> {
    return this.paymentModel
      .find({ senderId: new Types.ObjectId(userId) })
      .populate('receiverId', 'firstName lastName profilePhotoUrl')
      .sort({ createdAt: -1 })
      .lean<PaymentLean[]>()
      .exec();
  }

  // Returns all payments received by a given user (coach perspective).
  // Populates senderId so we can display the athlete's name.
  async findPaymentsReceivedByUser(userId: string): Promise<PaymentLean[]> {
    return this.paymentModel
      .find({ receiverId: new Types.ObjectId(userId) })
      .populate('senderId', 'firstName lastName profilePhotoUrl')
      .sort({ createdAt: -1 })
      .lean<PaymentLean[]>()
      .exec();
  }

  // Looks up a payment by its Stripe PaymentIntent ID.
  // Used to enforce idempotency — prevents the same payment from being recorded twice.
  async findByStripePaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<PaymentLean | null> {
    return this.paymentModel
      .findOne({ stripePaymentIntentId })
      .lean<PaymentLean>()
      .exec();
  }

  // ─── Persiste un paiement réussi de façon ATOMIQUE et IDEMPOTENTE ────────
  //
  // Utilise `updateOne` avec `upsert: true` + `$setOnInsert` plutôt que la
  // séquence `find → check → create`. Avantages :
  //   • Atomique au niveau Mongo — pas de race condition entre webhook et
  //     /confirm s'ils arrivent à la même milliseconde
  //   • L'index unique sparse sur `stripePaymentIntentId` est la garantie
  //     ultime ; `upsert` exploite cet index sans throw E11000
  //   • La valeur de retour `upsertedId` indique si on a réellement inséré
  //     (true → nouveau paiement) ou trouvé l'existant (false → idempotent skip)
  async upsertPaymentByStripePaymentIntentId(params: {
    senderId:              Types.ObjectId;
    receiverId:            Types.ObjectId;
    amountInCents:         number;
    status:                PaymentStatus;
    description?:          string;
    stripePaymentIntentId: string;
  }): Promise<{ wasInserted: boolean; insertedId: string | null }> {
    const result = await this.paymentModel.updateOne(
      { stripePaymentIntentId: params.stripePaymentIntentId },
      {
        $setOnInsert: {
          senderId:              params.senderId,
          receiverId:            params.receiverId,
          amountInCents:         params.amountInCents,
          status:                params.status,
          description:           params.description,
          stripePaymentIntentId: params.stripePaymentIntentId,
        },
      },
      { upsert: true },
    ).exec();

    // upsertedCount === 1 signifie qu'on a inséré un nouveau document.
    // Sinon (0), un document existait déjà — opération idempotente, no-op.
    const wasInserted = result.upsertedCount === 1;
    const upsertedObjectId = result.upsertedId as Types.ObjectId | null | undefined;

    return {
      wasInserted,
      insertedId: wasInserted && upsertedObjectId
        ? upsertedObjectId.toString()
        : null,
    };
  }

  // ─── GET /payments/received — total revenu agrégé côté Mongo ─────────────
  //
  // Avant : on chargeait tous les paiements en RAM puis on faisait `.reduce()`.
  // Pour un coach actif (5k paiements/mois), c'était 5k docs lus à chaque
  // requête. Maintenant Mongo agrège côté DB et ne renvoie que 2 nombres.
  async getReceivedTotalsForCoach(coachId: string): Promise<{
    totalEarningsInCents: number;
    thisMonthInCents:     number;
  }> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const rows = await this.paymentModel
      .aggregate<{ totalEarningsInCents: number; thisMonthInCents: number }>([
        {
          $match: {
            receiverId: new Types.ObjectId(coachId),
            status:     'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalEarningsInCents: { $sum: '$amountInCents' },
            thisMonthInCents: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', startOfThisMonth] },
                  '$amountInCents',
                  0,
                ],
              },
            },
          },
        },
        { $project: { _id: 0, totalEarningsInCents: 1, thisMonthInCents: 1 } },
      ])
      .exec();

    // Aucun paiement → l'aggregation renvoie un array vide.
    return rows[0] ?? { totalEarningsInCents: 0, thisMonthInCents: 0 };
  }

  // Returns a per-month revenue summary for the past 12 months (coach perspective).
  // Uses MongoDB $group aggregation — returns an array of { year, month, totalInCents }.
  async getMonthlyRevenueForCoach(
    coachId: string,
  ): Promise<Array<{ year: number; month: number; totalInCents: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    return this.paymentModel
      .aggregate([
        {
          $match: {
            receiverId: new Types.ObjectId(coachId),
            status:     'completed',
            createdAt:  { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year:  { $year:  '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalInCents: { $sum: '$amountInCents' },
          },
        },
        {
          $project: {
            _id:          0,
            year:         '$_id.year',
            month:        '$_id.month', // 1 = January … 12 = December
            totalInCents: 1,
          },
        },
        { $sort: { year: 1, month: 1 } },
      ])
      .exec();
  }
}
