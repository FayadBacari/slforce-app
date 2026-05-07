import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, Patch, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersService, PlatformStatsResponse } from '../services/users.service';
import { ChatService } from '../../chat/services/chat.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUserPayload } from '../../../shared/types/authenticated-request.interface';
import { UpdateProfileRequestDto } from './dto/update-profile.dto';
import { AuthenticatedUserResponse } from '../../auth/presentation/dto/auth-response.dto';
import { Public } from '../../../shared/decorators/public-route.decorator';
import {
  UpdatePrivacySettingsBodyDto,
  type PrivacySettingsResponseDto,
} from './dto/privacy-settings.dto';

// All routes here require a valid JWT (the global JwtAuthGuard handles that).
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService:  UsersService,
    private readonly chatService:   ChatService,
    private readonly configService: ConfigService,
  ) {}

  // GET /api/v1/users/stats — public, no JWT required
  // Returns the number of active coaches and athletes on the platform.
  @Public()
  @Get('stats')
  getPlatformStats(): Promise<PlatformStatsResponse> {
    return this.usersService.getPlatformStats();
  }

  // GET /api/v1/users/profile
  @Get('profile')
  getMyProfile(@CurrentUser() currentUser: AuthenticatedUserPayload): Promise<AuthenticatedUserResponse> {
    return this.usersService.getCurrentUserProfile(currentUser.userId);
  }

  // PUT /api/v1/users/profile
  @Put('profile')
  updateMyProfile(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @Body() fieldsToUpdate: UpdateProfileRequestDto,
  ): Promise<AuthenticatedUserResponse> {
    return this.usersService.updateCurrentUserProfile(currentUser.userId, fieldsToUpdate);
  }

  // POST /api/v1/users/profile/photo — upload a profile photo
  // Accepts multipart/form-data with a "photo" field.
  // Saves the file to disk, persists the remote URL in MongoDB, and returns it.
  @Post('profile/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = randomBytes(16).toString('hex');
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Seules les images sont acceptées.'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ photoUrl: string }> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    // Use APP_URL as the base so photos are served over HTTPS in production.
    // Constructing http://host:port manually would break mixed-content rules.
    const appUrl   = this.configService.getOrThrow<string>('app.appUrl');
    const photoUrl = `${appUrl}/uploads/${file.filename}`;

    // Write the remote URL to MongoDB — this is the single source of truth
    await this.usersService.updateCurrentUserProfile(currentUser.userId, { profilePhotoUrl: photoUrl });

    // Best-effort: sync the new avatar to Stream Chat so the chat UI reflects
    // the change immediately without waiting for the user to reconnect.
    // We fire this without awaiting so a Stream error never blocks the response.
    void this.chatService.updateUserImageInStream(currentUser.userId, photoUrl);

    return { photoUrl };
  }

  // ─── Account deletion ─────────────────────────────────────────────────────

  // DELETE /api/v1/users/account
  // Soft-deletes the account: revokes all sessions, anonymises PII in MongoDB,
  // and updates the Stream identity. The document is kept for audit/Stripe history.
  // Returns 204 No Content on success.
  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<void> {
    await this.usersService.deleteAccount(currentUser.userId);
  }

  // ─── Privacy settings ─────────────────────────────────────────────────────

  // GET /api/v1/users/privacy
  // Returns the current user's privacy flags.
  @Get('privacy')
  getPrivacySettings(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<PrivacySettingsResponseDto> {
    return this.usersService.getPrivacySettings(currentUser.userId);
  }

  // PATCH /api/v1/users/privacy
  // Updates one or both privacy flags. Only provided fields are written.
  // Also syncs showOnlineStatus to Stream so chat screens reflect it immediately.
  @Patch('privacy')
  updatePrivacySettings(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @Body() body:               UpdatePrivacySettingsBodyDto,
  ): Promise<PrivacySettingsResponseDto> {
    return this.usersService.updatePrivacySettings(currentUser.userId, body);
  }
}
