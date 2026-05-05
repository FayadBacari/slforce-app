import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { StreamChat } from 'stream-chat';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../auth/data/repositories/users.repository';
import { UserDocument } from '../../auth/data/schemas/user.schema';
import { UpdateProfileRequestDto } from '../presentation/dto/update-profile.dto';
import {
  AuthenticatedUserResponse,
} from '../../auth/presentation/dto/auth-response.dto';
import { UserRole } from '../../../shared/types/user-role.enum';
import type {
  PrivacySettingsResponseDto,
} from '../presentation/dto/privacy-settings.dto';

export interface PlatformStatsResponse {
  coachCount:   number;
  athleteCount: number;
}

@Injectable()
export class UsersService implements OnModuleInit {
  // Server-side Stream client — used to sync the showOnlineStatus flag to Stream
  // so that other mobile clients can read it from channel members immediately.
  private streamServerClient!: StreamChat;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService:   ConfigService,
  ) {}

  onModuleInit(): void {
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
    return this.formatUserForClient(userInDatabase);
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
    return this.formatUserForClient(updatedUser);
  }

  // GET /users/stats — returns platform-wide counts (public endpoint, no auth)
  async getPlatformStats(): Promise<PlatformStatsResponse> {
    const [coachCount, athleteCount] = await Promise.all([
      this.usersRepository.countByRole(UserRole.Coach),
      this.usersRepository.countByRole(UserRole.Athlete),
    ]);
    return { coachCount, athleteCount };
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
        // Stream's UserResponse type only declares standard fields — custom fields
        // are accepted at runtime but require a cast to silence TypeScript.
        await this.streamServerClient.upsertUsers([{
          id:               userId,
          showOnlineStatus: settings.showOnlineStatus,
        } as unknown as Parameters<typeof this.streamServerClient.upsertUsers>[0][0]]);
      } catch (streamError) {
        // Non-fatal — privacy flag is saved in MongoDB; Stream will reflect it
        // the next time the user is fetched by the chat service.
        console.error('[UsersService] Stream upsertUsers failed (non-fatal):', streamError);
      }
    }

    return {
      isProfilePublic:  settings.isProfilePublic  ?? (user.isProfilePublic  ?? true),
      showOnlineStatus: settings.showOnlineStatus ?? (user.showOnlineStatus ?? true),
    };
  }

  // ─── INTERNAL ────────────────────────────────────────────────────────────
  private formatUserForClient(userDocument: UserDocument): AuthenticatedUserResponse {
    return {
      id:              (userDocument._id as Types.ObjectId).toString(),
      email:           userDocument.email,
      firstName:       userDocument.firstName,
      lastName:        userDocument.lastName,
      role:            userDocument.role,
      profilePhotoUrl: userDocument.profilePhotoUrl,
      disciplines:     userDocument.disciplines ?? [],
      // Coach-specific fields — present only when filled by the coach
      speciality:      userDocument.speciality,
      bio:             userDocument.bio,
      location:        userDocument.location,
      monthlyRate:     userDocument.monthlyRate,
      experienceYears: userDocument.experienceYears,
      // Athlete-specific fields — present only when filled by the athlete
      gender:          userDocument.gender,
      weightCategory:  userDocument.weightCategory,
      weightKg:        userDocument.weightKg,
      heightCm:        userDocument.heightCm,
      recordMuscleUp:  userDocument.recordMuscleUp,
      recordTraction:  userDocument.recordTraction,
      recordDips:      userDocument.recordDips,
      recordSquat:     userDocument.recordSquat,
    };
  }
}
