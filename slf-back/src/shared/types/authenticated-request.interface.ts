import { Request } from 'express';
import { UserRole } from './user-role.enum';

// The minimal user info attached to every request after authentication.
// Set by JwtStrategy.validate() when a request carries a valid Bearer token.
export interface AuthenticatedUserPayload {
  userId: string;
  email:  string;
  role:   UserRole;
}

// An Express request that has been authenticated.
// Used as the parameter type in protected controller routes.
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserPayload;
}
