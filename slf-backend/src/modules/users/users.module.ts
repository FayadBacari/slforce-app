import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Schema — User vit ici, dans son module de domaine.
import { User, UserSchema } from './data/schemas/user.schema';

// Repository
import { UsersRepository } from './data/repositories/users.repository';

// Services
import { UsersService } from './services/users.service';

// Presentation
import { UsersController } from './presentation/users.controller';

// Cross-module imports
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { CloudinaryModule } from '@core/cloudinary/cloudinary.module';

// ─── UsersModule ───────────────────────────────────────────────────────────────
//
// Concerns : gestion du profil utilisateur (CRUD), confidentialité, suppression
// de compte, statistiques plateforme. Propriétaire du schéma User et de son repo.
//
// Dépend de AuthModule (forwardRef) pour AuthTokensService — la suppression de
// compte révoque toutes les refresh sessions actives. Dépendance circulaire
// résolue par forwardRef (pattern NestJS officiel pour modules co-dépendants).
//
// Dépend de ChatModule pour synchroniser l'avatar et l'identité Stream Chat
// après une mise à jour de profil ou une suppression de compte.
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AuthModule),
    ChatModule,
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UsersService,
  ],
  // UsersRepository est consommé par AuthModule (lookup user pendant login),
  // SearchModule (search results) et PaymentsModule (stripeAccountId).
  exports: [UsersRepository],
})
export class UsersModule {}
