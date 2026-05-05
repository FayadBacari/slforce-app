import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  // Saves a new refresh token (already hashed by the service).
  async storeOne(params: {
    userId:    Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.refreshTokenModel.create(params);
  }

  // Used during refresh: returns the document if the hashed token exists and is not expired.
  async findValidOneByHash(tokenHash: string): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  // Used at logout — deletes a single token.
  async deleteOneByHash(tokenHash: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({ tokenHash }).exec();
  }

  // Used at password change / account compromise — deletes ALL tokens of a user.
  async deleteAllByUserId(userId: Types.ObjectId): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId }).exec();
  }
}
