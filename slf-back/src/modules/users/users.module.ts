import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { UsersController } from './presentation/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ConfigModule,   // for STREAM_API_KEY / STREAM_API_SECRET used by privacy sync
    AuthModule,     // provides UsersRepository
    ChatModule,     // provides ChatService (used by UsersController to sync Stream avatar)
  ],
  controllers: [UsersController],
  providers:   [UsersService],
})
export class UsersModule {}
