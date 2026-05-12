import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  StripeProcessedEvent,
  type StripeProcessedEventDocument,
} from '../schemas/stripe-processed-event.schema';

// ─── Code d'erreur Mongo pour violation de contrainte unique ─────────────────
// (Le driver natif `mongodb` expose MongoServerError mais l'import est instable
// selon les versions ; on duck-type sur `.code` qui reste stable.)
const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class StripeEventsRepository {
  private readonly logger = new Logger(StripeEventsRepository.name);

  constructor(
    @InjectModel(StripeProcessedEvent.name)
    private readonly eventModel: Model<StripeProcessedEventDocument>,
  ) {}

  // ─── markEventAsProcessedIfNew ────────────────────────────────────────────
  //
  // Tente d'insérer un event Stripe dans la collection. Si l'event existe déjà
  // (E11000 sur l'index unique `eventId`), on swallow l'erreur et on signale
  // que l'event était déjà traité — le caller skip alors le handler.
  //
  // Atomique : la garantie d'unicité repose sur l'index Mongo, pas sur une
  // séquence find→insert (qui aurait une race condition entre deux instances
  // recevant le même event simultanément depuis Stripe).
  async markEventAsProcessedIfNew(params: {
    eventId:   string;
    eventType: string;
  }): Promise<{ wasAlreadyProcessed: boolean }> {
    try {
      await this.eventModel.create({
        eventId:   params.eventId,
        eventType: params.eventType,
      });
      return { wasAlreadyProcessed: false };
    } catch (insertError: unknown) {
      // Duck-typing sur `.code` — c'est le contrat stable des erreurs Mongo
      // (`MongoServerError` chez le driver natif ou `MongoBulkWriteError`).
      const errorCode = (insertError as { code?: number }).code;
      if (errorCode === MONGO_DUPLICATE_KEY_ERROR_CODE) {
        // Event déjà connu — c'est précisément le cas qu'on cherche à détecter.
        return { wasAlreadyProcessed: true };
      }

      // Toute autre erreur (réseau, perte de connexion DB) — on log et on
      // re-throw. Le caller (webhook controller) doit retourner 500 pour que
      // Stripe retente plus tard.
      this.logger.error(
        `markEventAsProcessedIfNew failed for ${params.eventId}`,
        insertError,
      );
      throw insertError;
    }
  }
}
