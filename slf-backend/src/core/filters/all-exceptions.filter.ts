import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// ─── ErrorResponseBody ────────────────────────────────────────────────────────
//
// Shape unique de TOUTES les réponses d'erreur de l'API.
// Le frontend lit ce contrat dans `api-error-handler.ts`. Toute modif ici
// doit être synchronisée côté front pour éviter le drift.
export interface ErrorResponseBody {
  success:        false;
  statusCode:     number;
  message:        string;          // message principal user-friendly (1er pour validation)
  // Tous les messages bruts renvoyés par class-validator quand la validation
  // échoue. Le frontend peut les exposer un par un dans le formulaire.
  // Undefined pour les erreurs non-validation (404, 500, etc.).
  validationErrors?: string[];
  errorCode?:     string;          // code machine-readable optionnel (ex: STRIPE_NO_ACCOUNT)
  timestamp:      string;
  path:           string;
  // Correlation ID propagé depuis pino-http (genReqId dans app.module.ts).
  // Permet au mobile de logger l'ID exact en cas de crash → support facile.
  requestId?:     string;
}

// Catches EVERY uncaught exception and returns a consistent JSON shape.
// Without this filter, NestJS uses its default formatter — but we want full control.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response    = httpContext.getResponse<Response>();
    const request     = httpContext.getRequest<Request & { id?: string }>();

    // Default to 500 — overridden if it's a known HttpException
    let statusCode:        number   = HttpStatus.INTERNAL_SERVER_ERROR;
    let message:           string   = 'Une erreur interne est survenue.';
    let validationErrors:  string[] | undefined;
    let errorCode:         string   | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObject = exceptionResponse as {
          message?:   string | string[];
          errorCode?: string;
        };

        // class-validator renvoie un array de messages quand plusieurs
        // contraintes échouent en même temps. On EXPOSE TOUS les messages
        // dans `validationErrors` (pour que le client puisse les afficher
        // un par un sous chaque champ) ET on garde le premier dans
        // `message` pour la compat des callers qui n'attendent qu'une string.
        if (Array.isArray(responseObject.message)) {
          validationErrors = responseObject.message.filter(
            (item): item is string => typeof item === 'string',
          );
          message = validationErrors[0] ?? message;
        } else if (typeof responseObject.message === 'string') {
          message = responseObject.message;
        }
        if (typeof responseObject.errorCode === 'string') {
          errorCode = responseObject.errorCode;
        }
      }
    } else if (exception instanceof Error) {
      // Unknown error — log the full stack but never leak it to the client
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Correlation ID injecté par pino-http (req.id). Renvoyé au client pour
    // qu'il puisse l'attacher à ses crash reports — trace bout-en-bout.
    const requestId = typeof request.id === 'string' ? request.id : undefined;

    const errorBody: ErrorResponseBody = {
      success:    false,
      statusCode,
      message,
      validationErrors,
      errorCode,
      timestamp:  new Date().toISOString(),
      path:       request.url,
      requestId,
    };

    response.status(statusCode).json(errorBody);
  }
}
