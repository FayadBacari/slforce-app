import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthenticatedUserPayload } from '@shared/types/authenticated-request.interface';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/v1/chat/token
  // Returns a signed Stream Chat JWT scoped to the authenticated user.
  // Called immediately after login / registration so the mobile client can
  // establish a WebSocket connection to Stream Chat.
  //
  // Auth: requires a valid JWT (global JwtAuthGuard — NOT @Public()).
  // The user must already be logged in before asking for a chat token.
  @Get('token')
  getChatToken(
    @CurrentUser() currentUser: AuthenticatedUserPayload,
  ): { token: string } {
    return this.chatService.generateUserToken(currentUser.userId);
  }
}
