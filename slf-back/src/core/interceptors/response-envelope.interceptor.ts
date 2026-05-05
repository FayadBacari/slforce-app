import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

// Shape of every successful response.
// Matches the shape the frontend's apiClient already expects:
//   { success: true, data: <whatever the controller returned> }
interface SuccessResponseEnvelope<TData> {
  success: true;
  data:    TData;
}

// Wraps every controller return value in `{ success: true, data: ... }`.
// Errors are NOT wrapped here — they go through AllExceptionsFilter instead.
@Injectable()
export class ResponseEnvelopeInterceptor<TData>
  implements NestInterceptor<TData, SuccessResponseEnvelope<TData>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<SuccessResponseEnvelope<TData>> {
    return next.handle().pipe(
      map((controllerReturnValue) => ({
        success: true as const,
        data:    controllerReturnValue,
      })),
    );
  }
}
