import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../data/repositories/users.repository';
import { AuthTokensService } from '@modules/auth/services/auth-tokens.service';
import { ChatService } from '@modules/chat/services/chat.service';
import { CloudinaryService } from '@core/cloudinary/cloudinary.service';
import { UpdateProfileRequestDto } from '../presentation/dto/update-profile.dto';
import { UserRole } from '@shared/types/user-role.enum';
import { formatUserForClient } from '../utils/format-user-for-client.util';
import type { AuthenticatedUserResponse } from '@modules/auth/presentation/dto/auth-response.dto';
import type { PrivacySettingsResponseDto } from '../presentation/dto/privacy-settings.dto';

// Projection minimale du document utilisateur — utilisée par UsersController
// pour les opérations qui ont besoin de champs serveur non exposés au client
// (ex: profilePhotoPublicId pour le cleanup Cloudinary).
export interface UserSnapshotForOps {
  profilePhotoPublicId?: string;
}

export interface PlatformStatsResponse {
  coachCount:   number;
  athleteCount: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository:    UsersRepository,
    private readonly authTokensService:  AuthTokensService,
    // ChatService centralise désormais TOUS les appels au SDK Stream serveur.
    // UsersService ne crée plus son propre client (cf. correction "Stream client mutualisé").
    private readonly chatService:        ChatService,
    // Pour nettoyer la photo Cloudinary lors de la suppression de compte.
    private readonly cloudinaryService:  CloudinaryService,
  ) {}

  // GET (interne) — snapshot des champs serveur non exposés via le DTO public.
  // Utilisé par UsersController pour récupérer le publicId Cloudinary actuel
  // avant d'overwrite avec une nouvelle photo.
  async getCurrentUserProfileSnapshot(currentUserId: string): Promise<UserSnapshotForOps> {
    const user = await this.usersRepository.findOneById(currentUserId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return {
      profilePhotoPublicId: user.profilePhotoPublicId,
    };
  }

  // GET /users/profile — renvoie le profil de l'utilisateur courant
  async getCurrentUserProfile(currentUserId: string): Promise<AuthenticatedUserResponse> {
    const userInDatabase = await this.usersRepository.findOneById(currentUserId);
    if (!userInDatabase) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return formatUserForClient(userInDatabase);
  }

  // PUT /users/profile — met à jour les champs autorisés et renvoie le profil mis à jour
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

  // ─── Mise à jour interne de la photo de profil ────────────────────────────
  //
  // Stocke à la fois l'URL CDN (consommée par le front) et le publicId Cloudinary
  // (consommé en interne pour pouvoir supprimer la photo plus tard).
  //
  // N'est PAS exposé via UpdateProfileRequestDto : le publicId est une donnée
  // serveur, jamais envoyée depuis le client (qui ne devrait pas la connaître).
  async updateCurrentUserPhotoMetadata(
    currentUserId: string,
    photoUrl:      string,
    photoPublicId: string,
  ): Promise<AuthenticatedUserResponse> {
    const updatedUser = await this.usersRepository.updateProfileFields(currentUserId, {
      profilePhotoUrl:      photoUrl,
      profilePhotoPublicId: photoPublicId,
    });
    if (!updatedUser) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return formatUserForClient(updatedUser);
  }

  // GET /users/stats — public, renvoie les compteurs plateforme
  async getPlatformStats(): Promise<PlatformStatsResponse> {
    const [coachCount, athleteCount] = await Promise.all([
      this.usersRepository.countByRole(UserRole.Coach),
      this.usersRepository.countByRole(UserRole.Athlete),
    ]);
    return { coachCount, athleteCount };
  }

  // ─── DELETE /users/account ─────────────────────────────────────────────────
  //
  // Soft-delete (Option B) :
  //   1. Révoquer toutes les refresh tokens → plus aucun access token issuable
  //   2. Anonymiser le document MongoDB (PII wipe, isActive=false, deletedAt set)
  //   3. Best-effort : marquer l'identité Stream comme "Compte Supprimé"
  //
  // Le document reste en MongoDB pour l'historique Stripe et les éventuelles
  // demandes audit/légales — seul le contenu personnel est anonymisé.
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const previousPhotoPublicId = user.profilePhotoPublicId;

    // 1. Révoque toutes les refresh tokens — les access tokens existants
    //    expirent naturellement (15min) mais ne peuvent plus être renouvelés,
    //    donc le compte est verrouillé immédiatement après expiration.
    await this.authTokensService.revokeAllRefreshTokensForUser(
      user._id as Types.ObjectId,
    );

    // 2. Anonymise + soft-delete le document MongoDB
    await this.usersRepository.softDeleteAccount(userId);

    // 3. Best-effort : update l'identité Stream pour que les conversations
    //    en cours affichent "Compte Supprimé" au lieu du vrai nom.
    //    Une erreur Stream ne doit JAMAIS bloquer la suppression — la source
    //    de vérité est MongoDB, déjà committée à l'étape 2.
    try {
      await this.chatService.markUserAsDeletedInStream(userId);
    } catch (chatError) {
      this.logger.warn('Sync Stream "deleted" non-fatal', chatError);
    }

    // 4. Best-effort : supprime la photo Cloudinary associée pour respecter
    //    le RGPD (les PII ne doivent pas survivre à la suppression de compte)
    //    et libérer du quota CDN. Un échec ici est non-bloquant et loggé.
    if (previousPhotoPublicId) {
      try {
        await this.cloudinaryService.deletePhotoByPublicId(previousPhotoPublicId);
      } catch (cloudinaryError) {
        this.logger.warn(
          `Cloudinary cleanup failed for deleted account ${userId} (non-fatal)`,
          cloudinaryError,
        );
      }
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
  // Sauvegarde les flags privacy en MongoDB, puis sync `showOnlineStatus` vers
  // l'objet user Stream via ChatService (pas de client Stream dupliqué ici).
  //
  // Pourquoi sync vers Stream ?
  //   L'écran chat lit `channel.state.members[userId].user?.showOnlineStatus`
  //   pour décider d'afficher la vraie présence ou "Désactivé". Stream propage
  //   ce champ à tous les clients connectés sans round-trip API supplémentaire.
  async updatePrivacySettings(
    userId:   string,
    settings: { isProfilePublic?: boolean; showOnlineStatus?: boolean },
  ): Promise<PrivacySettingsResponseDto> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    await this.usersRepository.updatePrivacySettings(userId, settings);

    // Sync vers Stream uniquement si showOnlineStatus a changé.
    // Best-effort : un fail Stream NE DOIT PAS faire échouer la réponse HTTP.
    // MongoDB est la source de vérité, l'update s'est déjà committé au-dessus.
    if (settings.showOnlineStatus !== undefined) {
      try {
        await this.chatService.updateUserPresenceVisibilityInStream(
          userId,
          settings.showOnlineStatus,
        );
      } catch (chatError) {
        this.logger.warn('Sync Stream "showOnlineStatus" non-fatal', chatError);
      }
    }

    return {
      isProfilePublic:  settings.isProfilePublic  ?? (user.isProfilePublic  ?? true),
      showOnlineStatus: settings.showOnlineStatus ?? (user.showOnlineStatus ?? true),
    };
  }
}
