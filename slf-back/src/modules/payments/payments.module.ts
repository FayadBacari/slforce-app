import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './data/schemas/payment.schema';
import { PaymentsRepository } from './data/repositories/payments.repository';
import { PaymentsService } from './services/payments.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { PaymentsController } from './presentation/payments.controller';
import { StripeRedirectController } from './presentation/stripe-redirect.controller';
import { AuthModule } from '../auth/auth.module';

// AuthModule is imported to access UsersRepository (for stripeAccountId read/write).
// ConfigModule is imported so PaymentsService can read STRIPE_PUBLISHABLE_KEY.
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentsController, StripeRedirectController],
  providers:   [PaymentsRepository, PaymentsService, StripeConnectService],
  exports:     [PaymentsService],
})
export class PaymentsModule {}
