import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { StreamChat } from 'stream-chat';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../auth/data/repositories/users.repository';
import { AuthTokensService } from '../../auth/services/auth-tokens.service';
import { UpdateProfileRequestDto } from '../presentation/dto/update-profile.dto';
import { UserRole } from '../../../shared/types/user-role.enum';
import { formatUserForClient } from '../../../shared/utils/format-user-for-client.util';
import type { AuthenticatedUserResponse } from '../../auth/presentation/dto/auth-response.dto';
import type { PrivacySettingsResponseDto } from '../presentation/dto/privacy-settings.dto';

export interface PlatformStatsResponse {
  coachCount:   number;
  athleteCount: number;
}

// Named alias for the exact element type that upsertUsers() expects.
// Stream's SDK types only declare standard fields — custom fields such as
// `showOnlineStatus` are valid at runtime but require an `as unknown` cast
// to silence TypeScript. The alias removes the verbose inline Parameters<...>.
type StreamUserInput = Parameters<InstanceType<typeof StreamChat>['upsertUsers']>[0][0];

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  // Server-side Stream client — used to sync the showOnlineStatus flag to Stream
  // so that other mobile clients can read it from channel members immediately.
  private streamServerClient!: StreamChat;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authTokensService: AuthTokensService,
    private readonly configService:   ConfigService,
  ) {}

  onModuleInit(): void {
    // Stream API keys are validated at startup by the Joi schema.
    const apiKey    = this.configService.getOrThrow<string>('STREAM_API_KEY');
    const apiSecret = this.configService.getOrThrow<string>('STREAM_API_SECRET');
    // getInstance() returns the shared singleton — same instance as ChatService.
    this.streamServerClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  // GET /users/profile — returns the current user's profile
  async getCurrentUserProfile(currentUserId: string): Promise<AuthenticatedUserResponse> {
    const userInDatabase = await this.usersRepository.findOneById(currentUserId);
    if (!userInDatabase) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return formatUserForClient(userInDatabase);
  }

  // PUT /users/profile — updates allowed fields and returns the new profile
  async updateCurrentUserProfile(
    currentUserId: string,
    fieldsToUpdate: UpdateProfileRequestDto,
  ): Promise<AuthenticatedUserResponse> {
    const updatedUser = await this.usersRepository.updateProfileFields(currentUserId, fieldsToUpdate);
    if (!updatedUser) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return formatUserForClient(updatedUser);
  }

  // GET /users/stats — returns platform-wide counts (public endpoint, no auth)
  async getPlatformStats(): Promise<PlatformStatsResponse> {
    const [coachCount, athleteCount] = await Promise.all([
      this.usersRepository.countByRole(UserRole.Coach),
      this.usersRepository.countByRole(UserRole.Athlete),
    ]);
    return { coachCount, athleteCount };
  }

  // ─── DELETE /users/account ─────────────────────────────────────────────────
  //
  // Soft-delete flow (Option B):
  //   1. Revoke every refresh token → no new access token can ever be issued
  //   2. Anonymise the MongoDB document (PII wiped, isActive=false, deletedAt set)
  //   3. Best-effort: update the Stream user so ghost avatar disappears in chats
  //
  // The document is intentionally kept in MongoDB so Stripe payment history and
  // any future audit/legal requests remain traceable.
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // 1. Revoke all refresh tokens — existing access tokens expire naturally (7d)
    //    but can no longer be renewed, so the account is effectively locked out.
    await this.authTokensService.revokeAllRefreshTokensForUser(
      user._id as Types.ObjectId,
    );

    // 2. Anonymise + soft-delete the MongoDB document
    await this.usersRepository.softDeleteAccount(userId);

    // 3. Best-effort: overwrite the Stream user with a neutral identity so
    //    ongoing conversations show "Compte Supprimé" instead of the real name/photo.
    try {
      await this.streamServerClient.upsertUsers([
        { id: userId, name: 'Compte Supprimé' } as unknown as StreamUserInput,
      ]);
    } catch {
      // Non-fatal — chat will update on the next cache refresh
    }
  }

  // ─── GET /users/privacy ────────────────────────────────────────────────────
  async getPrivacySettings(userId: string): Promise<PrivacySettingsResponseDto> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return {
      isProfilePublic:  user.isProfilePublic  ?? true,
      showOnlineStatus: user.showOnlineStatus ?? true,
    };
  }

  // ─── PATCH /users/privacy ──────────────────────────────────────────────────
  //
  // Saves the privacy flags to MongoDB, then syncs `showOnlineStatus` to the
  // Stream user object via the server-side admin client.
  //
  // Why sync to Stream?
  //   The chat screen reads `channel.state.members[userId].user?.showOnlineStatus`
  //   to decide whether to show the real presence or display "Désactivé". Since
  //   Stream delivers this field to every connected client automatically, no extra
  //   API call is needed on the receiving end.
  async updatePrivacySettings(
    userId:   string,
    settings: { isProfilePublic?: boolean; showOnlineStatus?: boolean },
  ): Promise<PrivacySettingsResponseDto> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    await this.usersRepository.updatePrivacySettings(userId, settings);

    // Sync showOnlineStatus to Stream so the change is visible to other users
    // in existing chat sessions without them needing to reconnect.
    //
    // This is best-effort: a Stream API failure (network, cold-start, etc.) must
    // NOT propagate up and fail the HTTP response — the MongoDB update already
    // committed above is the source of truth. We log the error and move on.
    if (settings.showOnlineStatus !== undefined) {
      try {
        await this.streamServerClient.upsertUsers([
          { id: userId, showOnlineStatus: settings.showOnlineStatus } as unknown as StreamUserInput,
        ]);
      } catch (streamError) {
        // Non-fatal — privacy flag is saved in MongoDB; Stream will reflect it
        // the next time the user is fetched by the chat service.
        this.logger.error('Stream upsertUsers failed (non-fatal):', streamError);
      }
    }

    return {
      isProfilePublic:  settings.isProfilePublic  ?? (user.isProfilePublic  ?? true),
      showOnlineStatus: settings.showOnlineStatus ?? (user.showOnlineStatus ?? true),
    };
  }

}
