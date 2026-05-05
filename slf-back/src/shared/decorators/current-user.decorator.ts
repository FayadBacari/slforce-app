import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUserPayload } from '../types/authenticated-request.interface';

// Inside any controller method, write:
//   @Get('/profile')
//   getProfile(@CurrentUser() currentUser: AuthenticatedUserPayload) { ... }
//
// The decorator pulls the user payload that JwtStrategy attached to the request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): AuthenticatedUserPayload => {
    const request = executionContext.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
