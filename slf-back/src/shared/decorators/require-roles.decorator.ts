import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/user-role.enum';

// Internal key used by RolesGuard to read required roles for a route.
export const REQUIRED_ROLES_KEY = 'required-roles';

// Restricts a route to specific roles:
//   @RequireRoles(UserRole.Coach)
//   @Get('/earnings')
//   getEarnings(...) { ... }
export const RequireRoles = (...allowedRoles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ROLES_KEY, allowedRoles);
