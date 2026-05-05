import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from '../schemas/password-reset-token.schema';

@Injectable()
export class PasswordResetRepository {
  constructor(
    @InjectModel(PasswordResetToken.name)
    private readonly model: Model<PasswordResetTokenDocument>,
  ) {}

  // Creates a new token entry — deletes any existing one for this user first
  // so only one active reset link exists at a time.
  async create(params: {
    userId:    Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.model.deleteMany({ userId: params.userId }).exec();
    await this.model.create(params);
  }

  // Returns the document if the hash matches AND the token is still within its TTL.
  async findValidOneByHash(tokenHash: string): Promise<PasswordResetTokenDocument | null> {
    return this.model.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  // Removes the token after use — reset links are single-use.
  async deleteOneByHash(tokenHash: string): Promise<void> {
    await this.model.deleteOne({ tokenHash }).exec();
  }
}
