import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

// ─── CloudinaryService ─────────────────────────────────────────────────────────
//
// Wrapper fin autour du SDK Cloudinary v2.
//
// Pourquoi Cloudinary plutôt qu'un disque local ?
//   • Render / Fly / K8s : le filesystem est éphémère — les fichiers sont
//     perdus à chaque redéploiement ou cold-start. Stockage local = bug en prod.
//   • Cloudinary délivre les images sur un CDN global avec transformations à la
//     volée (resize, crop, format webp/avif) → photos plus rapides + plus légères.
//   • Le quota gratuit (25 GB / 25k transformations / mois) couvre largement
//     les besoins jusqu'à plusieurs dizaines de milliers d'utilisateurs actifs.
//
// API exposée :
//   uploadProfilePhoto(buffer, mimetype, userId) → { secureUrl, publicId }
//   deletePhotoByPublicId(publicId)              → void

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId:  string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {}

  // Configuration globale du SDK au boot — le SDK v2 stocke la config en interne,
  // donc on n'a pas besoin de la repasser à chaque appel.
  onModuleInit(): void {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>('cloudinary.cloudName'),
      api_key:    this.configService.getOrThrow<string>('cloudinary.apiKey'),
      api_secret: this.configService.getOrThrow<string>('cloudinary.apiSecret'),
      secure:     true,   // toutes les URLs renvoyées en HTTPS
    });
    this.logger.log('Cloudinary SDK configuré.');
  }

  // ─── Upload d'une photo de profil ──────────────────────────────────────────
  //
  // Reçoit le buffer mémoire (multer memoryStorage) et le pushe vers Cloudinary.
  // Le `public_id` inclut l'userId + un suffixe random pour pouvoir empiler
  // plusieurs versions historiques sans collision.
  //
  // Transformations appliquées au upload :
  //   • dossier `slforce/profile-photos/` — facilite la navigation dashboard
  //   • crop carré 512×512 centré visage — uniformise les avatars
  //   • format auto — Cloudinary délivre webp/avif si supporté par le client
  //   • qualité auto — compression intelligente, pas de réglage manuel à maintenir
  async uploadProfilePhoto(
    fileBuffer:  Buffer,
    mimeType:    string,
    ownerUserId: string,
  ): Promise<CloudinaryUploadResult> {
    // Le mimetype a déjà été validé en amont par le fileFilter de multer
    // (cf. UsersController). On le log uniquement pour aider au debug en cas
    // d'upload corrompu — Cloudinary détecte le format réel depuis les magic
    // bytes du buffer, indépendamment de cet en-tête.
    this.logger.debug(
      `Cloudinary upload start — user=${ownerUserId} mime=${mimeType} size=${fileBuffer.length}B`,
    );

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:         'slforce/profile-photos',
          public_id:      `user_${ownerUserId}_${Date.now()}`,
          resource_type:  'image',
          overwrite:      false,   // chaque upload = nouvelle version, jamais d'écrasement
          // Transformation appliquée à l'upload (pas à la lecture) — on stocke
          // la version optimisée directement, ce qui économise des transformations.
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            reject(new InternalServerErrorException(
              `Cloudinary upload failed: ${error?.message ?? 'unknown error'}`,
            ));
            return;
          }
          this.handleUploadSuccess(result, resolve);
        },
      );

      // Stream le buffer en une seule fois.
      uploadStream.end(fileBuffer);
    });
  }

  // ─── healthCheck ─────────────────────────────────────────────────────────
  //
  // Ping minimal de l'API Cloudinary pour le /health/ready endpoint. Renvoie
  // true si l'API répond (auth + DNS + network OK), false sinon. Best-effort :
  // jamais throw, c'est un check de readiness pas une opération critique.
  async healthCheck(): Promise<boolean> {
    try {
      const result = await cloudinary.api.ping();
      return result?.status === 'ok';
    } catch (pingError) {
      this.logger.warn('Cloudinary ping failed', pingError);
      return false;
    }
  }

  // ─── Suppression d'une photo ───────────────────────────────────────────────
  //
  // Appelé pour nettoyer l'ancienne photo après un changement d'avatar, ou
  // lors d'une suppression de compte. Best-effort — un échec ne doit pas
  // bloquer le flow appelant.
  async deletePhotoByPublicId(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (deleteError) {
      this.logger.warn(`Cloudinary delete failed for ${publicId}`, deleteError);
      // pas de re-throw — c'est volontairement best-effort
    }
  }

  // Helper privé — extraction des champs intéressants depuis la réponse SDK.
  // Isole le shape de la réponse Cloudinary pour limiter le couplage.
  private handleUploadSuccess(
    result:  UploadApiResponse,
    resolve: (value: CloudinaryUploadResult) => void,
  ): void {
    resolve({
      secureUrl: result.secure_url,
      publicId:  result.public_id,
    });
  }
}
