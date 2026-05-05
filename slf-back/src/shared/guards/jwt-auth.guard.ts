import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_ROUTE_KEY } from '../decorators/public-route.decorator';

// The default global guard.
// Every request requires a valid Bearer token UNLESS the route (or its controller)
// is decorated with @Public().
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(executionContext: ExecutionContext) {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
      executionContext.getHandler(),
      executionContext.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    return super.canActivate(executionContext);
  }
}
