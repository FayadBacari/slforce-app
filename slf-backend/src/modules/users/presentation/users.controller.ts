import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UsersService, type PlatformStatsResponse } from '../services/users.service';
import { ChatService } from '@modules/chat/services/chat.service';
import { CloudinaryService } from '@core/cloudinary/cloudinary.service';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import type { AuthenticatedUserPayload } from '@shared/types/authenticated-request.interface';
import { UpdateProfileRequestDto } from './dto/update-profile.dto';
import type { AuthenticatedUserResponse } from '@modules/auth/presentation/dto/auth-response.dto';
import { Public } from '@shared/decorators/public-route.decorator';
import {
  UpdatePrivacySettingsBodyDto,
  type PrivacySettingsResponseDto,
} from './dto/privacy-settings.dto';

// Toutes les routes ici nécessitent un JWT valide (le JwtAuthGuard global s'en
// charge), à l'exception de celles annotées @Public().
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  // 5 MB max — assez pour une photo HD, refuse les uploads abusifs.
  private static readonly MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService:       UsersService,
    private readonly chatService:        ChatService,
    private readonly cloudinaryService:  CloudinaryService,
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

  // ─── POST /api/v1/users/profile/photo — upload de photo de profil ─────────
  //
  // Accepte multipart/form-data avec un champ "photo".
  //
  // Architecture : memory storage (pas de fichier sur disque) → buffer streamé
  // directement vers Cloudinary → URL HTTPS persistée en MongoDB.
  //
  // Pourquoi pas de stockage local ?
  //   • Les filesystems Render / Fly / K8s sont éphémères — fichiers perdus
  //     au moindre redéploiement.
  //   • Cloudinary délivre les images via CDN avec transformation à la volée
  //     (resize, format auto webp/avif, qualité auto).
  @Post('profile/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      // Memory storage — le fichier vit en RAM le temps de l'upload Cloudinary.
      // Pas d'écriture disque, pas de cleanup à gérer.
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Seules les images sont acceptées.'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: UsersController.MAX_PROFILE_PHOTO_SIZE_BYTES },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ photoUrl: string }> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Le fichier reçu est vide.');
    }

    // 0. Récupère l'ancien publicId pour pouvoir nettoyer après — AVANT
    //    d'écrire le nouveau dans le profil.
    const previousProfile = await this.usersService.getCurrentUserProfileSnapshot(
      currentUser.userId,
    );
    const previousPublicId = previousProfile.profilePhotoPublicId;

    // 1. Upload vers Cloudinary — renvoie une URL HTTPS stable + un publicId.
    const { secureUrl, publicId } = await this.cloudinaryService.uploadProfilePhoto(
      file.buffer,
      file.mimetype,
      currentUser.userId,
    );

    // 2. Persiste l'URL ET le publicId en MongoDB — source de vérité.
    //    Méthode dédiée car le publicId est un champ INTERNE qui ne doit
    //    jamais transiter par UpdateProfileRequestDto (contrat HTTP public).
    await this.usersService.updateCurrentUserPhotoMetadata(
      currentUser.userId,
      secureUrl,
      publicId,
    );

    // 3. Best-effort : sync l'avatar vers Stream Chat. Fire-and-forget MAIS
    //    avec `.catch()` pour ne pas générer un `unhandledRejection` qui peut
    //    crasher le process selon la config Node.
    this.chatService.updateUserImageInStream(currentUser.userId, secureUrl)
      .catch((chatError: unknown) => {
        this.logger.warn(
          `Stream avatar sync failed for user ${currentUser.userId} (non-fatal)`,
          chatError,
        );
      });

    // 4. Best-effort : supprime l'ancienne photo Cloudinary pour ne pas
    //    accumuler des fichiers orphelins (quota Cloudinary épuisé en 6 mois
    //    sinon). On ne touche pas si la précédente était un avatar généré
    //    (pas de publicId associé — cas des comptes créés sans upload réel).
    if (previousPublicId && previousPublicId !== publicId) {
      this.cloudinaryService.deletePhotoByPublicId(previousPublicId)
        .catch((deleteError: unknown) => {
          this.logger.warn(
            `Cloudinary cleanup failed for old publicId ${previousPublicId} (non-fatal)`,
            deleteError,
          );
        });
    }

    return { photoUrl: secureUrl };
  }

  // ─── Account deletion ─────────────────────────────────────────────────────

  // DELETE /api/v1/users/account
  // Soft-delete : révoque les sessions, anonymise les PII en MongoDB, met à
  // jour l'identité Stream. Le document reste en DB pour audit/Stripe.
  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<void> {
    await this.usersService.deleteAccount(currentUser.userId);
  }

  // ─── Privacy settings ─────────────────────────────────────────────────────

  // GET /api/v1/users/privacy
  @Get('privacy')
  getPrivacySettings(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): Promise<PrivacySettingsResponseDto> {
    return this.usersService.getPrivacySettings(currentUser.userId);
  }

  // PATCH /api/v1/users/privacy
  // Met à jour un ou les deux flags privacy. Seuls les champs fournis sont
  // écrits. Sync aussi showOnlineStatus vers Stream pour répercuter l'état
  // dans les écrans chat des autres utilisateurs.
  @Patch('privacy')
  updatePrivacySettings(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
    @Body() body:               UpdatePrivacySettingsBodyDto,
  ): Promise<PrivacySettingsResponseDto> {
    return this.usersService.updatePrivacySettings(currentUser.userId, body);
  }
}
