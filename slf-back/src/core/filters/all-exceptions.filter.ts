import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Shape of every error response sent to the client.
// Keeping a consistent shape across the whole API makes the frontend's
// error-handling code dead simple.
interface ErrorResponseBody {
  success:    false;
  statusCode: number;
  message:    string;
  errorCode?: string;
  timestamp:  string;
  path:       string;
}

// Catches EVERY uncaught exception and returns a consistent JSON shape.
// Without this filter, NestJS uses its default formatter — but we want full control.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response    = httpContext.getResponse<Response>();
    const request     = httpContext.getRequest<Request>();

    // Default to 500 — overridden if it's a known HttpException
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message    = 'Une erreur interne est survenue.';
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObject = exceptionResponse as { message?: string | string[]; errorCode?: string };
        // class-validator returns an array of messages — we keep only the first for the client
        if (Array.isArray(responseObject.message)) {
          message = responseObject.message[0] ?? message;
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

    const errorBody: ErrorResponseBody = {
      success:    false,
      statusCode,
      message,
      errorCode,
      timestamp:  new Date().toISOString(),
      path:       request.url,
    };

    response.status(statusCode).json(errorBody);
  }
}
