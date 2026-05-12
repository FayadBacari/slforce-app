import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StripeProcessedEventDocument = StripeProcessedEvent & Document;

// ─── StripeProcessedEvent ─────────────────────────────────────────────────────
//
// Trace tous les events Stripe que le webhook a déjà traités.
//
// Pourquoi ?
//   Stripe peut renvoyer le même `event.id` plusieurs fois en cas de timeout
//   de notre handler (Stripe retry pendant 3 jours avec backoff exponentiel).
//   Sans cette trace, on traiterait l'event deux fois — duplication possible
//   sur les events futurs (refund, dispute, etc.) où l'idempotence ne repose
//   pas sur un autre champ unique comme `paymentIntentId`.
//
// TTL :
//   Les events sont conservés 60 jours puis supprimés automatiquement par
//   Mongo. C'est largement supérieur aux 3 jours de retry de Stripe, ce qui
//   évite tout risque de "désynchronisation" si on conserve trop peu.

const SIXTY_DAYS_IN_SECONDS = 60 * 24 * 60 * 60;

@Schema({
  collection: 'stripe_processed_events',
  timestamps: { createdAt: 'processedAt', updatedAt: false },
  versionKey: false,
})
export class StripeProcessedEvent {
  // L'ID Stripe de l'event (`evt_xxx`) — clé primaire d'unicité.
  @Prop({ required: true, unique: true, index: true })
  eventId!: string;

  // Type d'event Stripe (`payment_intent.succeeded`, etc.). Stocké pour debug
  // et stats, pas pour la logique.
  @Prop({ required: true, trim: true })
  eventType!: string;

  // Géré par `timestamps: { createdAt: 'processedAt' }` — date de la 1re
  // réception réussie de l'event. Si un retry arrive plus tard, on ne touche
  // pas à ce champ (l'event existe déjà, on no-op).
  processedAt!: Date;
}

export const StripeProcessedEventSchema = SchemaFactory.createForClass(StripeProcessedEvent);

// TTL Mongo — supprime automatiquement les events après 60 jours.
// La création de cet index est cruciale pour ne pas faire exploser la
// collection ; à orchestrer via migration en prod.
StripeProcessedEventSchema.index(
  { processedAt: 1 },
  { expireAfterSeconds: SIXTY_DAYS_IN_SECONDS },
);
