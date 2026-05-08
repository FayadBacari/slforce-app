import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from '../services/payments.service';
import { StripeConnectService } from '../services/stripe-connect.service';
import { Public } from '@shared/decorators/public-route.decorator';
import { SkipThrottle } from '@nestjs/throttler';

// ─── PaymentsWebhookController ────────────────────────────────────────────────
//
// Endpoint dédié aux notifications asynchrones de Stripe.
//
// Pourquoi un controller séparé de PaymentsController ?
//   • Permet d'isoler clairement les règles spécifiques au webhook :
//       - @Public (Stripe ne peut pas signer un JWT user)
//       - @SkipThrottle (rate-limit incompatible avec les retries de Stripe)
//   • Évite de polluer PaymentsController (côté client mobile) avec une route
//     qui n'a aucun sens pour les utilisateurs finaux.
//
// Sécurité :
//   • La signature HMAC du body est vérifiée par StripeConnectService avant
//     toute action — un attaquant qui devine l'URL ne peut rien injecter.
//   • Le body brut (`req.rawBody`) est requis pour la vérification ; activé
//     globalement via `rawBody: true` dans main.ts.

@ApiTags('Payments / Webhooks')
@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly paymentsService:      PaymentsService,
    private readonly stripeConnectService: StripeConnectService,
  ) {}

  // POST /api/v1/payments/webhook
  //
  // Stripe envoie un POST JSON signé à chaque événement (paiement réussi,
  // remboursement, dispute…). Le retour 200 est CRUCIAL — sans 2xx, Stripe
  // retentera l'envoi avec backoff jusqu'à 3 jours.
  @Public()
  @SkipThrottle()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req()                              request:   RawBodyRequest<Request>,
    @Headers('stripe-signature')        signature: string,
  ): Promise<{ received: boolean }> {
    if (!request.rawBody) {
      // rawBody manquant = main.ts mal configuré — c'est un bug serveur,
      // pas une faute du caller. On log et on rejette en 400.
      this.logger.error('rawBody indisponible — vérifier `rawBody: true` dans main.ts');
      throw new BadRequestException('Webhook payload missing.');
    }

    // Étape 1 — Vérification de signature (peut throw UnauthorizedException)
    const event = this.stripeConnectService.constructWebhookEvent(
      request.rawBody,
      signature,
    );

    // Étape 2 — Dispatcher l'événement. La logique métier vit dans le service.
    await this.paymentsService.handleStripeWebhookEvent(event);

    // Étape 3 — Acquittement à Stripe. Body minimal — Stripe ne lit que le code.
    return { received: true };
  }
}
