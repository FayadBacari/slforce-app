import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetTokenDocument = PasswordResetToken & Document<Types.ObjectId>;

// Stores short-lived password-reset tokens (hashed, never plain-text).
//
// TTL index on `expiresAt` makes MongoDB automatically clean up expired
// documents — no cron job needed. The token is valid for 30 minutes.
@Schema({
  collection: 'password_reset_tokens',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class PasswordResetToken {
  @Prop({ required: true, index: true })
  userId!: Types.ObjectId;

  // SHA-256 hash of the plain token sent to the user — never stored in clear text.
  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  // Mongo TTL index: the document is automatically removed once this date is past.
  @Prop({ required: true, index: { expires: 0 } })
  expiresAt!: Date;

  createdAt!: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
