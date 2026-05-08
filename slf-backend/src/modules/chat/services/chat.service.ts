import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';

// ─── STREAM CHAT SERVER CLIENT ────────────────────────────────────────────────
//
// Un seul client Stream côté serveur, partagé via ce service.
// Le client serveur (initialisé avec key + secret) peut :
//   • Générer des tokens user (JWT signé par le secret Stream)
//   • Manager les channels, ban users, delete messages (admin)
// Le client mobile (key seulement) ne peut pas signer de tokens, il se connecte
// en tant qu'utilisateur précis.
//
// Tous les services qui ont besoin de modifier l'identité d'un user dans Stream
// (avatar après upload photo, anonymisation après suppression de compte, sync
// du flag privacy) passent par ce service — UsersService n'a plus de client
// Stream local, ce qui élimine la duplication d'init.

// Shape des champs modifiables sur un user Stream.
// `name` et `image` sont des champs standards du SDK ; `showOnlineStatus` est
// un champ custom (valide à l'exécution, ignoré par les typings du SDK).
export interface StreamUserUpdate {
  name?:             string;
  image?:            string;
  showOnlineStatus?: boolean;
}

// Type du paramètre attendu par `upsertUser()` du SDK Stream.
// Les types officiels n'exposent pas les champs custom, d'où l'alias + un cast
// localisé au seul endroit où on parle au SDK.
type StreamUserInput = Parameters<InstanceType<typeof StreamChat>['upsertUser']>[0];

@Injectable()
export class ChatService implements OnModuleInit {
  private streamServerClient!: StreamChat;

  constructor(private readonly configService: ConfigService) {}

  // Initialise le singleton serveur au boot du module.
  // OnModuleInit garantit que le client est prêt avant la première requête.
  onModuleInit(): void {
    const apiKey    = this.configService.getOrThrow<string>('STREAM_API_KEY');
    const apiSecret = this.configService.getOrThrow<string>('STREAM_API_SECRET');
    // getInstance() renvoie le singleton existant si déjà créé avec ces creds.
    this.streamServerClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  // ─── Génération de token (consommé après login pour connecter le mobile) ────
  //
  // Génère un JWT signé que le client mobile passe à connectUser().
  // Le token est scopé à userId — il ne peut pas usurper un autre user.
  // Pas d'expiration explicite : les tokens Stream sont long-lived par défaut
  // et le client mobile rafraîchit la connexion automatiquement au reconnect.
  generateUserToken(userId: string): { token: string } {
    const token = this.streamServerClient.createToken(userId);
    return { token };
  }

  // ─── Mise à jour d'identité Stream ───────────────────────────────────────────
  //
  // Met à jour un sous-ensemble de champs sur un user Stream existant.
  // Best-effort : le caller ne devrait pas await si l'opération n'est pas
  // critique pour la réponse HTTP (sync chat = nice-to-have, pas obligatoire).
  //
  // La cast `as unknown as StreamUserInput` est nécessaire pour les champs
  // custom (showOnlineStatus) que le SDK Stream type strictement.
  async updateUserInStream(userId: string, updates: StreamUserUpdate): Promise<void> {
    await this.streamServerClient.upsertUser(
      { id: userId, ...updates } as unknown as StreamUserInput,
    );
  }

  // ─── Helpers spécialisés ─────────────────────────────────────────────────────
  // Méthodes nommées pour les usages courants — l'intent est immédiatement
  // lisible chez le caller, pas besoin de relire updateUserInStream.

  // Sync l'avatar après upload — appelé fire-and-forget par UsersController.
  async updateUserImageInStream(userId: string, imageUrl: string): Promise<void> {
    await this.updateUserInStream(userId, { image: imageUrl });
  }

  // Marque l'identité Stream comme "Compte Supprimé" — appelé pendant le
  // soft-delete pour que les anciens chats n'affichent plus le vrai nom/photo.
  async markUserAsDeletedInStream(userId: string): Promise<void> {
    await this.updateUserInStream(userId, { name: 'Compte Supprimé' });
  }

  // Sync le flag de visibilité de présence — appelé quand l'utilisateur change
  // son réglage de privacy. Le mobile lit channel.state.members[id].user.showOnlineStatus
  // et affiche "Désactivé" plutôt que la vraie présence quand le flag est false.
  async updateUserPresenceVisibilityInStream(
    userId: string,
    showOnlineStatus: boolean,
  ): Promise<void> {
    await this.updateUserInStream(userId, { showOnlineStatus });
  }
}
