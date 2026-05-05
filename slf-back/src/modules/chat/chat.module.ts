import { Module } from '@nestjs/common';
import { ChatController } from './presentation/chat.controller';
import { ChatService } from './services/chat.service';

// ConfigModule is global (registered in AppModule with isGlobal: true)
// so it's available here without an explicit import.
@Module({
  controllers: [ChatController],
  providers:   [ChatService],
  exports:     [ChatService],   // exported so other modules (e.g. Notifications) can generate tokens
})
export class ChatModule {}
