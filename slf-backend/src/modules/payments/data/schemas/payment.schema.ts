import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document<Types.ObjectId>;

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// The "payments" collection records every money transfer from an athlete to a coach.
// Amounts are stored in cents (integer) to avoid floating-point precision issues.
@Schema({
  collection: 'payments',
  timestamps:  true,   // adds createdAt / updatedAt automatically
  versionKey:  false,
})
export class Payment {
  // The athlete who initiated the payment
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  // The coach who receives the payment
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  receiverId!: Types.ObjectId;

  // Amount in euro cents — e.g. 8000 = 80.00 €
  @Prop({ required: true, min: 0 })
  amountInCents!: number;

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'] satisfies PaymentStatus[],
    default: 'pending',
  })
  status!: PaymentStatus;

  // Optional label — e.g. "Coaching mensuel · Avril 2025"
  @Prop({ trim: true })
  description?: string;

  // Stripe PaymentIntent ID — used as an idempotency key so that retrying a
  // confirmation call never creates a duplicate payment record.
  // sparse: true — the index only covers documents where the field exists.
  @Prop({ trim: true, index: { unique: true, sparse: true } })
  stripePaymentIntentId?: string;

  // Timestamps managed by Mongoose `timestamps: true`
  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
