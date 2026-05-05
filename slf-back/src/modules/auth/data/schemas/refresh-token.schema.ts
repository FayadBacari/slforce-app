import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document<Types.ObjectId>;

// We persist refresh tokens server-side to support revocation:
//   - On logout, we delete the matching token → it can't be reused.
//   - On password change / account compromise, we delete ALL tokens of the user.
//
// The token value stored here is HASHED (sha256). We never keep it in plaintext.
@Schema({
  collection: 'refresh_tokens',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class RefreshToken {
  @Prop({ required: true, index: true })
  userId!: Types.ObjectId;

  // SHA-256 hash of the actual JWT refresh token. Indexed for fast lookup.
  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  // Mongo TTL index — automatically deletes expired tokens.
  @Prop({ required: true, index: { expires: 0 } })
  expiresAt!: Date;

  createdAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
