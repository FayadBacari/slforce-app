import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './data/schemas/payment.schema';
import { PaymentsRepository } from './data/repositories/payments.repository';
import { PaymentsService } from './services/payments.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { PaymentsController } from './presentation/payments.controller';
import { PaymentsWebhookController } from './presentation/payments-webhook.controller';
import { StripeRedirectController } from './presentation/stripe-redirect.controller';
import { UsersModule } from '../users/users.module';

// UsersModule est importé pour accéder à UsersRepository (lecture/écriture
// du stripeAccountId sur le document User d'un coach).
// ConfigModule donne accès à STRIPE_PUBLISHABLE_KEY et autres clés Stripe.
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    UsersModule,
  ],
  controllers: [PaymentsController, PaymentsWebhookController, StripeRedirectController],
  providers:   [PaymentsRepository, PaymentsService, StripeConnectService],
  exports:     [PaymentsService],
})
export class PaymentsModule {}
