import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, type PaymentDocument, type PaymentStatus } from '../schemas/payment.schema';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  // Returns all payments sent by a given user (athlete perspective).
  // Populates receiverId so we can display the coach's name.
  async findPaymentsSentByUser(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ senderId: new Types.ObjectId(userId) })
      .populate('receiverId', 'firstName lastName profilePhotoUrl')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as PaymentDocument[];
  }

  // Returns all payments received by a given user (coach perspective).
  // Populates senderId so we can display the athlete's name.
  async findPaymentsReceivedByUser(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ receiverId: new Types.ObjectId(userId) })
      .populate('senderId', 'firstName lastName profilePhotoUrl')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as PaymentDocument[];
  }

  // Looks up a payment by its Stripe PaymentIntent ID.
  // Used to enforce idempotency — prevents the same payment from being recorded twice.
  async findByStripePaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ stripePaymentIntentId }).lean().exec() as Promise<PaymentDocument | null>;
  }

  // Persists a confirmed payment record.
  // Call this once `payment_intent.succeeded` is verified.
  async createPaymentRecord(params: {
    senderId:              Types.ObjectId;
    receiverId:            Types.ObjectId;
    amountInCents:         number;
    status:                PaymentStatus;
    description?:          string;
    stripePaymentIntentId: string;
  }): Promise<PaymentDocument> {
    return this.paymentModel.create(params);
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
