import { SetMetadata } from '@nestjs/common';

// Internal key used by JwtAuthGuard to detect public routes.
export const IS_PUBLIC_ROUTE_KEY = 'is-public-route';

// Decorator that marks a route as publicly accessible (no JWT required).
// Use it on auth routes (login, register, refresh, forgot-password):
//   @Public()
//   @Post('login')
//   login(...) { ... }
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_ROUTE_KEY, true);
