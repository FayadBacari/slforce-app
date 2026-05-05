import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';

// ─── STREAM CHAT SERVER CLIENT ────────────────────────────────────────────────
// One server-side Stream client shared across the module.
// The server client (initialised with both key AND secret) can:
//   • Generate user tokens (JWT signed by the Stream secret)
//   • Manage channels, ban users, delete messages (admin operations)
// The mobile client (key only) connects as a specific user and cannot sign tokens.

@Injectable()
export class ChatService implements OnModuleInit {
  private streamServerClient!: StreamChat;

  constructor(private readonly configService: ConfigService) {}

  // Initialises the singleton server client when the module boots.
  // Using OnModuleInit ensures the client is ready before the first request.
  onModuleInit(): void {
    const apiKey    = this.configService.getOrThrow<string>('STREAM_API_KEY');
    const apiSecret = this.configService.getOrThrow<string>('STREAM_API_SECRET');

    // getInstance() returns the same singleton if already created with these credentials.
    // Passing the secret tells Stream this is a SERVER client with admin privileges.
    this.streamServerClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  // Generates a signed JWT that the mobile client passes to connectUser().
  // The token is scoped to this userId — it cannot impersonate another user.
  // We do NOT set an expiry: Stream tokens are long-lived by default and the
  // mobile client refreshes the connection automatically on reconnect.
  generateUserToken(userId: string): { token: string } {
    const token = this.streamServerClient.createToken(userId);
    return { token };
  }

  // Syncs the user's avatar to Stream Chat.
  // Called after a successful profile photo upload so the chat UI reflects the
  // new image without waiting for the user to reconnect.
  // Fire-and-forget — the caller should NOT await this if it's not critical.
  async updateUserImageInStream(userId: string, imageUrl: string): Promise<void> {
    await this.streamServerClient.upsertUser({ id: userId, image: imageUrl });
  }
}
