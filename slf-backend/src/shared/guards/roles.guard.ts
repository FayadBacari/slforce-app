import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import { UserRole } from '../types/user-role.enum';

// Runs AFTER JwtAuthGuard. If the route is decorated with @RequireRoles(...),
// it checks the authenticated user's role against the allowed list.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      REQUIRED_ROLES_KEY,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    // If no roles are required for this route, anyone authenticated may access.
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request          = executionContext.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUser = request.user;

    if (!authenticatedUser || !allowedRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenException("Vous n'avez pas accès à cette ressource.");
    }

    return true;
  }
}
